describe 'AudioPlayer', ->

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

			methodExpectation.called.should.equal(false)
			isUsableExpectation.getCall(0).args[0](true) # report the plugin as available

			mockPlugin.verify()