(function() {
  var __hasProp = {}.hasOwnProperty;

  window.AudioPlayer = (function() {
    function AudioPlayer(settings) {
      var method, _fn, _ref;
      if (settings == null) {
        settings = {};
      }
      this.settings = {
        plugins: settings.plugins || [WebAudioPlayer, HtmlAudioPlayer, FlashAudioPlayer],
        onUsable: settings.onUsable || function() {},
        onNotUsable: settings.onNotUsable || function() {
          var _ref;
          return (_ref = window.console) != null ? typeof _ref.error === "function" ? _ref.error('Cannot play audio') : void 0 : void 0;
        }
      };
      this.methodBuffer = [];
      this.plugin = {
        preload: (function(_this) {
          return function(url, options) {
            if (options == null) {
              options = {};
            }
            return _this.methodBuffer.push(['preload', arguments]);
          };
        })(this),
        play: (function(_this) {
          return function(url, options) {
            if (options == null) {
              options = {};
            }
            return _this.methodBuffer.push(['play', arguments]);
          };
        })(this),
        isPlaying: (function(_this) {
          return function(url) {
            return _this.methodBuffer.push(['isPlaying', arguments]);
          };
        })(this),
        destruct: (function(_this) {
          return function(url) {
            return _this.methodBuffer.push(['destruct', arguments]);
          };
        })(this),
        stop: (function(_this) {
          return function() {
            return _this.methodBuffer.push(['stop', arguments]);
          };
        })(this),
        stopAll: (function(_this) {
          return function() {
            return _this.methodBuffer.push(['stopAll', arguments]);
          };
        })(this)
      };
      _ref = this.plugin;
      _fn = (function(_this) {
        return function(method) {
          return _this[method] = function() {
            return this.plugin[method].apply(this.plugin, arguments);
          };
        };
      })(this);
      for (method in _ref) {
        if (!__hasProp.call(_ref, method)) continue;
        _fn(method);
      }
      this.initUsablePlugin();
    }

    AudioPlayer.prototype.initUsablePlugin = function() {
      var plugin, _base;
      plugin = this.settings.plugins.shift();
      if (!plugin) {
        return typeof (_base = this.settings).onNotUsable === "function" ? _base.onNotUsable() : void 0;
      }
      return plugin.getInstance().isUsable((function(_this) {
        return function(usable) {
          var args, method, _base1, _ref, _results;
          if (usable) {
            _this.plugin = plugin.getInstance();
            if (typeof (_base1 = _this.settings).onUsable === "function") {
              _base1.onUsable();
            }
            _results = [];
            while (_this.methodBuffer.length) {
              _ref = _this.methodBuffer.shift(), method = _ref[0], args = _ref[1];
              _results.push(_this.plugin[method].apply(_this.plugin, args));
            }
            return _results;
          } else {
            return _this.initUsablePlugin();
          }
        };
      })(this));
    };

    return AudioPlayer;

  })();

}).call(this);
