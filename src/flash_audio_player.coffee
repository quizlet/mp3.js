class window.FlashAudioPlayer
	@getInstance = -> @instance ||= new @

	onIsUsable: ->

	loadingAudio: {}

	durations: {}
	playingAudio: {}

	SWF_PATH: ''
	CONTAINER_ID: 'flashAudioContainer'
	FLASH_ID: 'flashAudioObject'
	FLASH_VERSION: '9.0.0'

	MAX_VOLUME: 1

	constructor: -> @appendFlashObject()

	isUsable: (onIsUsable = ->) ->
		return onIsUsable(true) if @flashPlugin?
		@onIsUsable = onIsUsable

	isPlaying: (url) -> Object::hasOwnProperty.call(@playingAudio, url)

	stopAll: ->
		@loadingAudio[url] = onLoad: [], onError: [] for url of @loadingAudio
		@stop url for url of @playingAudio
		true # prevents returning list comp

	stop: (url) ->
		@loadingAudio[url] = onLoad: [], onError: [] if url of @loadingAudio
		soundData = @playingAudio[url]
		return unless soundData
		clearTimeout soundData.onFinish

		volume = @MAX_VOLUME
		lowerVol = =>
			if volume > 0
				@flashPlugin._setVolume url, volume -= 0.03
				timeoutSet 10, lowerVol
			else
				@flashPlugin._stop url
				@flashPlugin._setVolume url, @MAX_VOLUME
		lowerVol()

		delete @playingAudio[url]
		soundData.onStop?(url)

	play: (url, options = {}) ->
		@preload url,
			onLoad: =>
				@stop(url) if @playingAudio[url]
				@flashPlugin._play(url)
				@playingAudio[url] =
					onStop: options.onStop
					onFinish: timeoutSet @durations[url], =>
						delete @playingAudio[url]
						options.onFinish?(url)
			onError: -> options.onError?(url)
			timeout: options.timeout ? 0

	destruct: (url) ->
		if Object::hasOwnProperty.call(@durations, url)
			delete @durations[url]
			@flashPlugin._destruct url
			return true
		false

	preload: (url, options = {}) ->
		return options.onError?() unless url

		# make sure we didn't already load this file
		return options.onLoad?(url) if @durations[url]

		if @loadingAudio[url]
			for method in ['onLoad', 'onError']
				@loadingAudio[url][method].push options[method]
		else
			@loadingAudio[url] =
				onLoad: [options.onLoad]
				onError: [options.onError]

			@flashPlugin._preload url

		if options.timeout
			timeoutSet Number(options.timeout), => @loadError { url }

	appendFlashObject: ->
		# Create wrapper
		wrapper = document.createElement 'div'
		wrapper.id = @CONTAINER_ID;
		wrapper.style.position = 'absolute'
		wrapper.style.marginLeft = '-1px'

		# Create replacement
		replacement = document.createElement 'div'
		replacement.id = @FLASH_ID
		wrapper.appendChild replacement

		document.body.appendChild wrapper

		# Embed SWF
		swfobject.embedSWF(
			@SWF_PATH, @FLASH_ID, '1', '1', @FLASH_VERSION,
			null, null, { allowScriptAccess: 'always' }, null, (e) =>
				return @onIsUsable(false) unless e.success and e.ref

				# give Flash some time to init PercentLoaded
				waitForFlash = (tries = 5) =>
					return @onIsUsable(false) unless tries
					timeoutSet 100, =>
						# similar checks for IE & Firefox, respectively
						hasFn = Object::hasOwnProperty.call(e.ref, 'PercentLoaded') or e.ref.PercentLoaded?
						if hasFn and e.ref.PercentLoaded()
							pollFlashObject = intervalSet 250, =>
								if e.ref.PercentLoaded() is 100
									@flashPlugin = e.ref
									@onIsUsable true
									intervalClear pollFlashObject
						else
							waitForFlash --tries

				waitForFlash()
		)

	loadError: (e) ->
		return unless e.url of @loadingAudio
		cb(e.url) for cb in @loadingAudio[e.url].onError when cb?
		delete @loadingAudio[e.url]
		@flashPlugin._destruct e.url

	loadComplete: (e) ->
		return unless e.url of @loadingAudio
		@durations[e.url] = e.duration
		cb(e.url) for cb in @loadingAudio[e.url].onLoad when cb?
		delete @loadingAudio[e.url]
