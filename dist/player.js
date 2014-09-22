(function() {
  var factory,
    __hasProp = {}.hasOwnProperty;

  factory = function() {
    var AudioPlayer;
    return AudioPlayer = (function() {
      AudioPlayer.usablePlugin = null;

      function AudioPlayer(settings) {
        var method, _fn, _ref,
          _this = this;
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
          preload: function(url, options) {
            if (options == null) {
              options = {};
            }
            return _this.methodBuffer.push(['preload', arguments]);
          },
          play: function(url, options) {
            if (options == null) {
              options = {};
            }
            return _this.methodBuffer.push(['play', arguments]);
          },
          isPlaying: function(url) {
            return _this.methodBuffer.push(['isPlaying', arguments]);
          },
          destruct: function(url) {
            return _this.methodBuffer.push(['destruct', arguments]);
          },
          stop: function() {
            return _this.methodBuffer.push(['stop', arguments]);
          },
          stopAll: function() {
            return _this.methodBuffer.push(['stopAll', arguments]);
          }
        };
        _ref = this.plugin;
        _fn = function(method) {
          return _this[method] = function() {
            return this.plugin[method].apply(this.plugin, arguments);
          };
        };
        for (method in _ref) {
          if (!__hasProp.call(_ref, method)) continue;
          _fn(method);
        }
        this.initUsablePlugin();
      }

      AudioPlayer.prototype.initUsablePlugin = function() {
        var plugin, _base,
          _this = this;
        if (this.constructor.usablePlugin != null) {
          this._initPlugin(this.constructor.usablePlugin);
          return;
        }
        plugin = this.settings.plugins.shift();
        if (!plugin) {
          return typeof (_base = this.settings).onNotUsable === "function" ? _base.onNotUsable() : void 0;
        }
        return plugin.getInstance().isUsable(function(usable) {
          if (usable) {
            return _this._initPlugin(plugin);
          } else {
            return _this.initUsablePlugin();
          }
        });
      };

      AudioPlayer.prototype._initPlugin = function(plugin) {
        var args, method, _base, _ref, _results;
        this.plugin = plugin.getInstance();
        this.constructor.usablePlugin = plugin;
        if (typeof (_base = this.settings).onUsable === "function") {
          _base.onUsable();
        }
        _results = [];
        while (this.methodBuffer.length) {
          _ref = this.methodBuffer.shift(), method = _ref[0], args = _ref[1];
          _results.push(this.plugin[method].apply(this.plugin, args));
        }
        return _results;
      };

      return AudioPlayer;

    })();
  };

  (function(root, factory) {
    if (typeof define === 'function' && define.amd) {
      return define([], factory);
    } else if ((typeof module !== "undefined" && module !== null ? module.exports : void 0) != null) {
      return module.exports = factory();
    } else {
      return root.AudioPlayer = factory();
    }
  })(this, factory);

}).call(this);
