factory = ->
	class AudioPlayer
		@usablePlugin: null
		constructor: (settings = {}) ->
			@settings =
				plugins: settings.plugins || [WebAudioPlayer, HtmlAudioPlayer, FlashAudioPlayer]
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
			# Already found usable plugin?
			if @constructor.usablePlugin?
				@_initPlugin(@constructor.usablePlugin)
				return

			plugin = @settings.plugins.shift()
			return @settings.onNotUsable?() unless plugin
			plugin.getInstance().isUsable (usable) =>
				if usable
					@_initPlugin(plugin)
				else
					@initUsablePlugin()

		_initPlugin: (plugin) ->
			@plugin = plugin.getInstance()
			@constructor.usablePlugin = plugin
			@settings.onUsable?()
			while @methodBuffer.length
				[method, args] = @methodBuffer.shift()
				@plugin[method].apply @plugin, args

do (root = @, factory) ->
	if typeof define is 'function' and define.amd
		define [], factory
	else if module?.exports?
		module.exports = factory()
	else
		root.AudioPlayer = factory()
