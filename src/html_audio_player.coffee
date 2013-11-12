class window.HtmlAudioPlayer
	@getInstance = -> @instance ||= new @

	loadedAudio: {}
	loadingAudio: {}
	playingAudio: {}

	usabilityElm: null

	MAX_VOLUME: 1

	constructor: -> @usabilityElm = document.createElement('audio')

	isUsable: (cb = ->) -> cb @usabilityElm?.canPlayType?('audio/mpeg')

	isPlaying: (url) -> Object::hasOwnProperty.call(@playingAudio, url)

	stopAll: ->
		for url of @loadingAudio
			@loadingAudio[url].onLoad = []
			@loadingAudio[url].onError = []
		@stop url for url of @playingAudio
		true # prevents returning list comp

	stop: (url) ->
		if url of @loadingAudio
			@loadingAudio[url].onLoad = []
			@loadingAudio[url].onError = []
		soundData = @playingAudio[url]
		return unless soundData
		clearTimeout soundData.onFinishTimer
		elm = soundData.elm

		volume = @MAX_VOLUME
		lowerVol = =>
			if volume > 0
				volume -= 0.03
				elm.volume = Math.max(volume, 0)
				timeoutSet 10, lowerVol
			else
				elm.pause()
				elm.currentTime = 0
				elm.volume = @MAX_VOLUME
		lowerVol()

		delete @playingAudio[url]
		soundData.onStop?(url)

	play: (url, options = {}) ->
		@preload url,
			onLoad: =>
				@stop(url) if @playingAudio[url]
				elm = @loadedAudio[url]
				elm.play()
				@playingAudio[url] =
					elm: elm
					onStop: options.onStop
					onFinishTimer: timeoutSet elm.duration * 1000, =>
						delete @playingAudio[url]
						options.onFinish?(url)

			onError: -> options.onError?(url)
			timeout: options.timeout ? 0

	destruct: (url) ->
		if Object::hasOwnProperty.call(@loadedAudio, url)
			delete @loadedAudio[url]
			return true
		false

	preload: (url, options = {}) ->
		return options.onError?() unless url

		# make sure we didn't already load this file
		return options.onLoad?(url) if @loadedAudio[url]

		if @loadingAudio[url]
			for method in ['onLoad', 'onError']
				@loadingAudio[url][method].push options[method]
		else
			@loadingAudio[url] =
				onLoad: [options.onLoad]
				onError: [options.onError]

			elm = document.createElement('audio')
			elm.setAttribute 'preload', 'auto'

			elm.addEventListener 'loadeddata', =>
				return unless url of @loadingAudio
				@loadedAudio[url] = @loadingAudio[url].elm
				cb(url) for cb in @loadingAudio[url].onLoad when cb?
				delete @loadingAudio[url]
			, false

			elm.addEventListener 'error', =>
				@handleLoadingError(url)
			, false

			elm.src = url
			elm.load()
			@loadingAudio[url].elm = elm

		if options.timeout
			timeoutSet Number(options.timeout), => @handleLoadingError(url)

	handleLoadingError: (url) ->
		return unless url of @loadingAudio
		@loadingAudio[url].elm = null
		cb(url) for cb in @loadingAudio[url].onError when cb?
		delete @loadingAudio[url]
