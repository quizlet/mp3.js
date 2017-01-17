(function() {
  var factory,
    hasProp = {}.hasOwnProperty;

  factory = function() {
    var AudioPlayer;
    return AudioPlayer = (function() {
      AudioPlayer.usablePlugin = null;

      function AudioPlayer(settings) {
        var fn, method, ref;
        if (settings == null) {
          settings = {};
        }
        this.settings = {
          plugins: settings.plugins || [WebAudioPlayer, HtmlAudioPlayer, FlashAudioPlayer],
          onUsable: settings.onUsable || function() {},
          onNotUsable: settings.onNotUsable || function() {
            var ref;
            return (ref = window.console) != null ? typeof ref.error === "function" ? ref.error('Cannot play audio') : void 0 : void 0;
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
        ref = this.plugin;
        fn = (function(_this) {
          return function(method) {
            return _this[method] = function() {
              return this.plugin[method].apply(this.plugin, arguments);
            };
          };
        })(this);
        for (method in ref) {
          if (!hasProp.call(ref, method)) continue;
          fn(method);
        }
        this.initUsablePlugin();
      }

      AudioPlayer.prototype.initUsablePlugin = function() {
        var base, plugin;
        if (this.constructor.usablePlugin != null) {
          this._initPlugin(this.constructor.usablePlugin);
          return;
        }
        plugin = this.settings.plugins.shift();
        if (!plugin) {
          return typeof (base = this.settings).onNotUsable === "function" ? base.onNotUsable() : void 0;
        }
        return plugin.getInstance().isUsable((function(_this) {
          return function(usable) {
            if (usable) {
              return _this._initPlugin(plugin);
            } else {
              return _this.initUsablePlugin();
            }
          };
        })(this));
      };

      AudioPlayer.prototype._initPlugin = function(plugin) {
        var args, base, method, ref, results;
        this.plugin = plugin.getInstance();
        this.constructor.usablePlugin = plugin;
        if (typeof (base = this.settings).onUsable === "function") {
          base.onUsable();
        }
        results = [];
        while (this.methodBuffer.length) {
          ref = this.methodBuffer.shift(), method = ref[0], args = ref[1];
          results.push(this.plugin[method].apply(this.plugin, args));
        }
        return results;
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
