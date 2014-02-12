class window.HtmlAudioPlayer
	@getInstance = -> @instance ||= new @

	loadedAudio: {}
	loadingAudio: {}
	playingAudio: {}

	usabilityElm: null

	MAX_VOLUME: 1

	constructor: -> @usabilityElm = document.createElement('audio')

	isUsable: (cb = ->) -> cb @usabilityElm?.canPlayType?('audio/mpeg') and navigator.appVersion.indexOf('MSIE') is -1

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
				setTimeout lowerVol, 10
			else
				elm.pause()
				elm.currentTime = 0
				elm.volume = @MAX_VOLUME
		lowerVol()

		delete @playingAudio[url]
		soundData.onStop?(url)

	play: (url, options = {}) ->
		@preload url,
			onLoad: (duration) =>
				@stop(url) if @playingAudio[url]
				elm = @loadedAudio[url]
				elm.play()
				@playingAudio[url] =
					elm: elm
					onStop: options.onStop
					onFinishTimer: setTimeout =>
						delete @playingAudio[url]
						options.onFinish?(url)
					, duration

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
		return options.onLoad?(@loadedAudio[url].duration * 1000) if @loadedAudio[url]

		if @loadingAudio[url]
			for method in ['onLoad', 'onError']
				@loadingAudio[url][method].push options[method]
		else
			@loadingAudio[url] =
				onLoad: [options.onLoad]
				onError: [options.onError]

			elm = document.createElement 'audio'
			elm.setAttribute 'preload', 'auto'

			elm.addEventListener 'loadeddata', =>
				return unless url of @loadingAudio
				@loadedAudio[url] = @loadingAudio[url].elm
				cb(@loadedAudio[url].duration * 1000) for cb in @loadingAudio[url].onLoad when cb?
				delete @loadingAudio[url]
			, false

			elm.addEventListener 'error', =>
				@handleLoadingError(url)
			, false

			elm.src = url
			elm.load()
			@loadingAudio[url].elm = elm

		if options.timeout
			setTimeout (=> @handleLoadingError(url)), Number(options.timeout)

	handleLoadingError: (url) ->
		return unless url of @loadingAudio
		@loadingAudio[url].elm = null
		cb(url) for cb in @loadingAudio[url].onError when cb?
		delete @loadingAudio[url]
