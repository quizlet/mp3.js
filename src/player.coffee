class window.AudioPlayer
	constructor: (settings = {}) ->
		@settings =
			plugins: settings.plugins || [WebAudioPlayer, FlashAudioPlayer]
			onUsable: settings.onUsable || ->
			onNotUsable: settings.onNotUsable || -> window.console?.error? 'Cannot play audio'

		@methodBuffer = []
		@plugin =
			preload: (url, options = {}) => @methodBuffer.push ['preload', arguments]
			play: (url, options = {}) => @methodBuffer.push ['play', arguments]
			isPlaying: (url) => @methodBuffer.push ['isPlaying', arguments]
			destruct: (url) => @methodBuffer.push ['destruct', arguments]
			stop: => @methodBuffer.push ['stop', arguments]
			stopAll: => @methodBuffer.push ['stopAll', arguments]

		for own method of @plugin
			do (method) =>
				@[method] = ->
					@plugin[method].apply @plugin, arguments

		@initUsablePlugin()

	initUsablePlugin: ->
		plugin = @settings.plugins.shift()
		return @settings.onNotUsable?() unless plugin
		plugin.getInstance().isUsable (usable) =>
			if usable
				@plugin = plugin.getInstance()
				@settings.onUsable?()
				while @methodBuffer.length
					[method, args] = @methodBuffer.shift()
					@plugin[method].apply @plugin, args
			else
				@initUsablePlugin()
