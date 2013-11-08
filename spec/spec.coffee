describe 'AudioPlayer', ->

	xhr = null
	requests = null

	beforeEach ->
		xhr = sinon.useFakeXMLHttpRequest()
		requests = []
		xhr.onCreate = (request) -> requests.push request

	afterEach -> 
		xhr.restore()

	it "should call its onNotUsable callback if no plugins are usable", ->
		onNotUsableCallback = sinon.spy()
		player = new AudioPlayer(plugins: [], onNotUsable: onNotUsableCallback)
		onNotUsableCallback.callCount.should.equal(1)

	for method in ['preload', 'play', 'isPlaying', 'destruct', 'stop', 'stopAll']

		it "should buffer calls to #{method} until the plugin becomes usable", ->
			plugin = new WebAudioPlayer
			pluginClass = {getInstance: -> plugin}
			mockPlugin = sinon.mock(plugin)
			isUsableExpectation = mockPlugin.expects('isUsable').once()
			methodExpectation = mockPlugin.expects(method).once()

			player = new AudioPlayer(plugins: [pluginClass])
			player[method]()

			methodExpectation.called.should.be.false
			isUsableExpectation.getCall(0).args[0](true) # report the plugin as available

			mockPlugin.verify()

	describe 'WebAudioPlayer', ->

		mockAudioContext = null

		beforeEach ->
			fakeBufferSource = 
				connect: ->
				start: ->
				noteOn: ->
			WebAudioPlayer.audioContext = 
				decodeAudioData: ->
				createBufferSource: -> fakeBufferSource
			mockAudioContext = sinon.mock(WebAudioPlayer.audioContext)

		it "should preload audio via xhr when the request completes successfully", ->
			options = {onLoad: sinon.spy(), onError: sinon.spy()}
			decodeAudioExpectation = mockAudioContext.expects('decodeAudioData').once()
			webAudioPlayer = new WebAudioPlayer
			webAudioPlayer.preload '/hammertime.mp3', options

			requests.length.should.equal(1)
			options.onLoad.called.should.be.false

			requests[0].respond(200, { "Content-Type": "audio/mpeg" }, 'mp3contents')
			decodeAudioExpectation.called.should.be.true
			decodeAudioExpectation.getCall(0).args[1]('buffer!')
			options.onLoad.called.should.be.true
			options.onLoad.getCall(0).args[0].should.equal('/hammertime.mp3')
			options.onError.called.should.be.false

