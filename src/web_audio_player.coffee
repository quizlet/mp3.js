class window.WebAudioPlayer
	@getInstance = -> @instance ||= new @

	loadedAudio: {}
	loadingAudio: {}
	playingAudio: {}

	usabilityElm: null
	unlockedIOS: false

	constructor: ->
		@usabilityElm = document.createElement('audio')
		@audioContext = @getAudioContext()

	isUsable: (cb = ->) -> cb @audioContext? and @usabilityElm.canPlayType?('audio/mpeg')

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
		soundData.gainNode.gain.linearRampToValueAtTime 0, @audioContext.currentTime + 0.3
		delete @playingAudio[url]
		soundData.onStop?(url)

	play: (url, options = {}) ->
		@preload url,
			onLoad: (duration) =>
				@stop(url) if @playingAudio[url]

				# Create (or replace) buffer source
				buffer = @loadedAudio[url]
				bufferSource = @audioContext.createBufferSource()
				bufferSource.buffer = buffer

				# Connect to gain node
				gainNode = (@audioContext.createGainNode or @audioContext.createGain).call(@audioContext)
				gainNode.gain.linearRampToValueAtTime 1, @audioContext.currentTime
				gainNode.connect @audioContext.destination

				bufferSource.connect gainNode
				(bufferSource.noteOn or bufferSource.start).call(bufferSource, 0)

				@playingAudio[url] =
					onStop: options.onStop
					source: bufferSource
					gainNode: gainNode
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

		@unmuteIOS()

		# make sure we didn't already load this file
		return options.onLoad?(@loadedAudio[url].duration * 1000) if @loadedAudio[url]

		if @loadingAudio[url]
			for method in ['onLoad', 'onError']
				@loadingAudio[url][method].push options[method]
		else
			@loadingAudio[url] =
				onLoad: [options.onLoad]
				onError: [options.onError]

			xhr = new XMLHttpRequest()
			xhr.open 'GET', url, true
			xhr.responseType = 'arraybuffer'
			xhr.onload = =>
				@audioContext.decodeAudioData xhr.response, (buffer) =>
					@loadedAudio[url] = buffer
					cb(buffer.duration * 1000) for cb in @loadingAudio[url].onLoad when cb?
					delete @loadingAudio[url]
				, => @handleLoadingError(url)
			xhr.onerror = => @handleLoadingError(url)
			xhr.send()
			@loadingAudio[url].xhr = xhr

		if options.timeout
			setTimeout (=> @handleLoadingError(url)), Number(options.timeout)

	unmuteIOS: ->
		return if @unlockedIOS

		bufferSource = @audioContext.createBufferSource()
		bufferSource.connect(@audioContext.destination)
		(bufferSource.start or bufferSource.noteOn).call(bufferSource, 0)
		@unlockedIOS = true

	## audioContexts will throw syntax errors
	## if too many are created on one page.
	## Catching the error will allow the
	## plugin to fallthrough gracefully.
	getAudioContext: ->
		try
			unless @constructor.audioContext
				if AudioContext?
					@constructor.audioContext = new AudioContext()
				else if webkitAudioContext?
					@constructor.audioContext = new webkitAudioContext()
			@constructor.audioContext

	handleLoadingError: (url) ->
		return unless url of @loadingAudio
		@loadingAudio[url].xhr.abort()
		cb(url) for cb in @loadingAudio[url].onError when cb?
		delete @loadingAudio[url]
