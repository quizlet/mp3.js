(function() {
  var factory,
    hasProp = {}.hasOwnProperty;

  window.WebAudioPlayer = (function() {
    WebAudioPlayer.getInstance = function() {
      return this.instance || (this.instance = new this);
    };

    WebAudioPlayer.prototype.loadedAudio = {};

    WebAudioPlayer.prototype.loadingAudio = {};

    WebAudioPlayer.prototype.playingAudio = {};

    WebAudioPlayer.prototype.usabilityElm = null;

    WebAudioPlayer.prototype.unlockedIOS = false;

    function WebAudioPlayer() {
      this.usabilityElm = document.createElement('audio');
      this.audioContext = this.getAudioContext();
    }

    WebAudioPlayer.prototype.isUsable = function(cb) {
      var base;
      if (cb == null) {
        cb = function() {};
      }
      return cb((this.audioContext != null) && (typeof (base = this.usabilityElm).canPlayType === "function" ? base.canPlayType('audio/mpeg') : void 0));
    };

    WebAudioPlayer.prototype.isPlaying = function(url) {
      return Object.prototype.hasOwnProperty.call(this.playingAudio, url);
    };

    WebAudioPlayer.prototype.stopAll = function() {
      var url;
      for (url in this.loadingAudio) {
        this.loadingAudio[url].onLoad = [];
        this.loadingAudio[url].onError = [];
      }
      for (url in this.playingAudio) {
        this.stop(url);
      }
      return true;
    };

    WebAudioPlayer.prototype.stop = function(url) {
      var soundData;
      if (url in this.loadingAudio) {
        this.loadingAudio[url].onLoad = [];
        this.loadingAudio[url].onError = [];
      }
      soundData = this.playingAudio[url];
      if (!soundData) {
        return;
      }
      clearTimeout(soundData.onFinishTimer);
      soundData.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
      delete this.playingAudio[url];
      return typeof soundData.onStop === "function" ? soundData.onStop(url) : void 0;
    };

    WebAudioPlayer.prototype.play = function(url, options) {
      var ref1;
      if (options == null) {
        options = {};
      }
      if (this.audioContext.state === 'suspended') {
        return this.audioContext.resume().then((function(_this) {
          return function() {
            return _this.play(url, options);
          };
        })(this));
      }
      return this.preload(url, {
        onLoad: (function(_this) {
          return function(duration) {
            var buffer, bufferSource, gainNode;
            if (_this.playingAudio[url]) {
              _this.stop(url);
            }
            buffer = _this.loadedAudio[url];
            bufferSource = _this.audioContext.createBufferSource();
            bufferSource.buffer = buffer;
            gainNode = (_this.audioContext.createGainNode || _this.audioContext.createGain).call(_this.audioContext);
            gainNode.gain.linearRampToValueAtTime(1, _this.audioContext.currentTime);
            gainNode.connect(_this.audioContext.destination);
            bufferSource.connect(gainNode);
            (bufferSource.noteOn || bufferSource.start).call(bufferSource, 0);
            return _this.playingAudio[url] = {
              onStop: options.onStop,
              source: bufferSource,
              gainNode: gainNode,
              onFinishTimer: setTimeout(function() {
                delete _this.playingAudio[url];
                return typeof options.onFinish === "function" ? options.onFinish(url) : void 0;
              }, duration)
            };
          };
        })(this),
        onError: function() {
          return typeof options.onError === "function" ? options.onError(url) : void 0;
        },
        timeout: (ref1 = options.timeout) != null ? ref1 : 0
      });
    };

    WebAudioPlayer.prototype.destruct = function(url) {
      if (Object.prototype.hasOwnProperty.call(this.loadedAudio, url)) {
        delete this.loadedAudio[url];
        return true;
      }
      return false;
    };

    WebAudioPlayer.prototype.preload = function(url, options) {
      var i, len, method, ref1, xhr;
      if (options == null) {
        options = {};
      }
      if (!url) {
        return typeof options.onError === "function" ? options.onError() : void 0;
      }
      this.unmuteIOS();
      if (this.loadedAudio[url]) {
        return typeof options.onLoad === "function" ? options.onLoad(this.loadedAudio[url].duration * 1000) : void 0;
      }
      if (this.loadingAudio[url]) {
        ref1 = ['onLoad', 'onError'];
        for (i = 0, len = ref1.length; i < len; i++) {
          method = ref1[i];
          this.loadingAudio[url][method].push(options[method]);
        }
      } else {
        this.loadingAudio[url] = {
          onLoad: [options.onLoad],
          onError: [options.onError]
        };
        xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = (function(_this) {
          return function() {
            return _this.audioContext.decodeAudioData(xhr.response, function(buffer) {
              var cb, j, len1, ref2;
              _this.loadedAudio[url] = buffer;
              ref2 = _this.loadingAudio[url].onLoad;
              for (j = 0, len1 = ref2.length; j < len1; j++) {
                cb = ref2[j];
                if (cb != null) {
                  cb(buffer.duration * 1000);
                }
              }
              return delete _this.loadingAudio[url];
            }, function() {
              return _this.handleLoadingError(url);
            });
          };
        })(this);
        xhr.onerror = (function(_this) {
          return function() {
            return _this.handleLoadingError(url);
          };
        })(this);
        xhr.send();
        this.loadingAudio[url].xhr = xhr;
      }
      if (options.timeout) {
        return setTimeout(((function(_this) {
          return function() {
            return _this.handleLoadingError(url);
          };
        })(this)), Number(options.timeout));
      }
    };

    WebAudioPlayer.prototype.unmuteIOS = function() {
      var bufferSource;
      if (this.unlockedIOS) {
        return;
      }
      bufferSource = this.audioContext.createBufferSource();
      bufferSource.connect(this.audioContext.destination);
      (bufferSource.start || bufferSource.noteOn).call(bufferSource, 0);
      return this.unlockedIOS = true;
    };

    WebAudioPlayer.prototype.getAudioContext = function() {
      try {
        if (!this.constructor.audioContext) {
          if (typeof AudioContext !== "undefined" && AudioContext !== null) {
            this.constructor.audioContext = new AudioContext();
          } else if (typeof webkitAudioContext !== "undefined" && webkitAudioContext !== null) {
            this.constructor.audioContext = new webkitAudioContext();
          }
        }
        return this.constructor.audioContext;
      } catch (undefined) {}
    };

    WebAudioPlayer.prototype.handleLoadingError = function(url) {
      var cb, i, len, ref1;
      if (!(url in this.loadingAudio)) {
        return;
      }
      this.loadingAudio[url].xhr.abort();
      ref1 = this.loadingAudio[url].onError;
      for (i = 0, len = ref1.length; i < len; i++) {
        cb = ref1[i];
        if (cb != null) {
          cb(url);
        }
      }
      return delete this.loadingAudio[url];
    };

    return WebAudioPlayer;

  })();

  window.HtmlAudioPlayer = (function() {
    HtmlAudioPlayer.getInstance = function() {
      return this.instance || (this.instance = new this);
    };

    HtmlAudioPlayer.prototype.loadedAudio = {};

    HtmlAudioPlayer.prototype.loadingAudio = {};

    HtmlAudioPlayer.prototype.playingAudio = {};

    HtmlAudioPlayer.prototype.usabilityElm = null;

    HtmlAudioPlayer.prototype.MAX_VOLUME = 1;

    function HtmlAudioPlayer() {
      this.usabilityElm = document.createElement('audio');
    }

    HtmlAudioPlayer.prototype.isUsable = function(cb) {
      var ref1;
      if (cb == null) {
        cb = function() {};
      }
      return cb(((ref1 = this.usabilityElm) != null ? typeof ref1.canPlayType === "function" ? ref1.canPlayType('audio/mpeg') : void 0 : void 0) && navigator.appVersion.indexOf('MSIE') === -1);
    };

    HtmlAudioPlayer.prototype.isPlaying = function(url) {
      return Object.prototype.hasOwnProperty.call(this.playingAudio, url);
    };

    HtmlAudioPlayer.prototype.stopAll = function() {
      var url;
      for (url in this.loadingAudio) {
        this.loadingAudio[url].onLoad = [];
        this.loadingAudio[url].onError = [];
      }
      for (url in this.playingAudio) {
        this.stop(url);
      }
      return true;
    };

    HtmlAudioPlayer.prototype.stop = function(url) {
      var elm, lowerVol, soundData, volume;
      if (url in this.loadingAudio) {
        this.loadingAudio[url].onLoad = [];
        this.loadingAudio[url].onError = [];
      }
      soundData = this.playingAudio[url];
      if (!soundData) {
        return;
      }
      clearTimeout(soundData.onFinishTimer);
      elm = soundData.elm;
      volume = this.MAX_VOLUME;
      lowerVol = (function(_this) {
        return function() {
          if (volume > 0) {
            volume -= 0.03;
            elm.volume = Math.max(volume, 0);
            return setTimeout(lowerVol, 10);
          } else {
            elm.pause();
            elm.currentTime = 0;
            return elm.volume = _this.MAX_VOLUME;
          }
        };
      })(this);
      lowerVol();
      delete this.playingAudio[url];
      return typeof soundData.onStop === "function" ? soundData.onStop(url) : void 0;
    };

    HtmlAudioPlayer.prototype.play = function(url, options) {
      var ref1;
      if (options == null) {
        options = {};
      }
      return this.preload(url, {
        onLoad: (function(_this) {
          return function(duration) {
            var elm;
            if (_this.playingAudio[url]) {
              _this.stop(url);
            }
            elm = _this.loadedAudio[url];
            elm.play();
            return _this.playingAudio[url] = {
              elm: elm,
              onStop: options.onStop,
              onFinishTimer: setTimeout(function() {
                delete _this.playingAudio[url];
                return typeof options.onFinish === "function" ? options.onFinish(url) : void 0;
              }, duration)
            };
          };
        })(this),
        onError: function() {
          return typeof options.onError === "function" ? options.onError(url) : void 0;
        },
        timeout: (ref1 = options.timeout) != null ? ref1 : 0
      });
    };

    HtmlAudioPlayer.prototype.destruct = function(url) {
      if (Object.prototype.hasOwnProperty.call(this.loadedAudio, url)) {
        delete this.loadedAudio[url];
        return true;
      }
      return false;
    };

    HtmlAudioPlayer.prototype.preload = function(url, options) {
      var elm, i, len, method, ref1;
      if (options == null) {
        options = {};
      }
      if (!url) {
        return typeof options.onError === "function" ? options.onError() : void 0;
      }
      if (this.loadedAudio[url]) {
        return typeof options.onLoad === "function" ? options.onLoad(this.loadedAudio[url].duration * 1000) : void 0;
      }
      if (this.loadingAudio[url]) {
        ref1 = ['onLoad', 'onError'];
        for (i = 0, len = ref1.length; i < len; i++) {
          method = ref1[i];
          this.loadingAudio[url][method].push(options[method]);
        }
      } else {
        this.loadingAudio[url] = {
          onLoad: [options.onLoad],
          onError: [options.onError]
        };
        elm = document.createElement('audio');
        elm.setAttribute('preload', 'auto');
        elm.addEventListener('loadeddata', (function(_this) {
          return function() {
            var cb, j, len1, ref2;
            if (!(url in _this.loadingAudio)) {
              return;
            }
            _this.loadedAudio[url] = _this.loadingAudio[url].elm;
            ref2 = _this.loadingAudio[url].onLoad;
            for (j = 0, len1 = ref2.length; j < len1; j++) {
              cb = ref2[j];
              if (cb != null) {
                cb(_this.loadedAudio[url].duration * 1000);
              }
            }
            return delete _this.loadingAudio[url];
          };
        })(this), false);
        elm.addEventListener('error', (function(_this) {
          return function() {
            return _this.handleLoadingError(url);
          };
        })(this), false);
        elm.src = url;
        elm.load();
        this.loadingAudio[url].elm = elm;
      }
      if (options.timeout) {
        return setTimeout(((function(_this) {
          return function() {
            return _this.handleLoadingError(url);
          };
        })(this)), Number(options.timeout));
      }
    };

    HtmlAudioPlayer.prototype.handleLoadingError = function(url) {
      var cb, i, len, ref1;
      if (!(url in this.loadingAudio)) {
        return;
      }
      this.loadingAudio[url].elm = null;
      ref1 = this.loadingAudio[url].onError;
      for (i = 0, len = ref1.length; i < len; i++) {
        cb = ref1[i];
        if (cb != null) {
          cb(url);
        }
      }
      return delete this.loadingAudio[url];
    };

    return HtmlAudioPlayer;

  })();

  window.FlashAudioPlayer = (function() {
    FlashAudioPlayer.getInstance = function() {
      return this.instance || (this.instance = new this);
    };

    FlashAudioPlayer.prototype.onIsUsable = function() {};

    FlashAudioPlayer.prototype.loadedAudio = {};

    FlashAudioPlayer.prototype.loadingAudio = {};

    FlashAudioPlayer.prototype.playingAudio = {};

    FlashAudioPlayer.prototype.SWF_PATH = '';

    FlashAudioPlayer.prototype.CONTAINER_ID = 'flashAudioContainer';

    FlashAudioPlayer.prototype.FLASH_ID = 'flashAudioObject';

    FlashAudioPlayer.prototype.FLASH_VERSION = [9, 0];

    FlashAudioPlayer.prototype.MAX_VOLUME = 1;

    function FlashAudioPlayer() {
      this.appendFlashObject();
    }

    FlashAudioPlayer.prototype.isUsable = function(onIsUsable) {
      if (onIsUsable == null) {
        onIsUsable = function() {};
      }
      if (this.flashPlugin != null) {
        return onIsUsable(true);
      }
      return this.onIsUsable = onIsUsable;
    };

    FlashAudioPlayer.prototype.isPlaying = function(url) {
      return Object.prototype.hasOwnProperty.call(this.playingAudio, url);
    };

    FlashAudioPlayer.prototype.stopAll = function() {
      var url;
      for (url in this.loadingAudio) {
        this.loadingAudio[url] = {
          onLoad: [],
          onError: []
        };
      }
      for (url in this.playingAudio) {
        this.stop(url);
      }
      return true;
    };

    FlashAudioPlayer.prototype.stop = function(url) {
      var lowerVol, soundData, volume;
      if (url in this.loadingAudio) {
        this.loadingAudio[url] = {
          onLoad: [],
          onError: []
        };
      }
      soundData = this.playingAudio[url];
      if (!soundData) {
        return;
      }
      clearTimeout(soundData.onFinishTimer);
      volume = this.MAX_VOLUME;
      lowerVol = (function(_this) {
        return function() {
          if (volume > 0) {
            _this.flashPlugin._setVolume(url, volume -= 0.03);
            return setTimeout(lowerVol, 10);
          } else {
            _this.flashPlugin._stop(url);
            return _this.flashPlugin._setVolume(url, _this.MAX_VOLUME);
          }
        };
      })(this);
      lowerVol();
      delete this.playingAudio[url];
      return typeof soundData.onStop === "function" ? soundData.onStop(url) : void 0;
    };

    FlashAudioPlayer.prototype.play = function(url, options) {
      var ref1;
      if (options == null) {
        options = {};
      }
      return this.preload(url, {
        onLoad: (function(_this) {
          return function(duration) {
            if (_this.playingAudio[url]) {
              _this.stop(url);
            }
            _this.flashPlugin._play(url);
            return _this.playingAudio[url] = {
              onStop: options.onStop,
              onFinishTimer: setTimeout(function() {
                delete _this.playingAudio[url];
                return typeof options.onFinish === "function" ? options.onFinish(url) : void 0;
              }, duration)
            };
          };
        })(this),
        onError: function() {
          return typeof options.onError === "function" ? options.onError(url) : void 0;
        },
        timeout: (ref1 = options.timeout) != null ? ref1 : 0
      });
    };

    FlashAudioPlayer.prototype.destruct = function(url) {
      if (Object.prototype.hasOwnProperty.call(this.loadedAudio, url)) {
        delete this.loadedAudio[url];
        this.flashPlugin._destruct(url);
        return true;
      }
      return false;
    };

    FlashAudioPlayer.prototype.preload = function(url, options) {
      var i, len, method, ref1;
      if (options == null) {
        options = {};
      }
      if (!url) {
        return typeof options.onError === "function" ? options.onError() : void 0;
      }
      if (this.loadedAudio[url]) {
        return typeof options.onLoad === "function" ? options.onLoad(this.loadedAudio[url]) : void 0;
      }
      if (this.loadingAudio[url]) {
        ref1 = ['onLoad', 'onError'];
        for (i = 0, len = ref1.length; i < len; i++) {
          method = ref1[i];
          this.loadingAudio[url][method].push(options[method]);
        }
      } else {
        this.loadingAudio[url] = {
          onLoad: [options.onLoad],
          onError: [options.onError]
        };
        this.flashPlugin._preload(url);
      }
      if (options.timeout) {
        return setTimeout(((function(_this) {
          return function() {
            return _this.loadError({
              url: url
            });
          };
        })(this)), Number(options.timeout));
      }
    };

    FlashAudioPlayer.prototype.appendFlashObject = function() {
      var replacement, wrapper;
      wrapper = document.createElement('div');
      wrapper.id = this.CONTAINER_ID;
      wrapper.style.position = 'absolute';
      wrapper.style.marginLeft = '-1px';
      replacement = document.createElement('div');
      replacement.id = this.FLASH_ID;
      wrapper.appendChild(replacement);
      document.body.appendChild(wrapper);
      return flashembed(this.FLASH_ID, {
        src: this.SWF_PATH,
        width: '1',
        height: '1',
        version: this.FLASH_VERSION,
        onEmbed: (function(_this) {
          return function(success, ref) {
            var api, waitForFlash;
            if (!(success && ref.getApi())) {
              return _this.onIsUsable(false);
            }
            api = ref.getApi();
            waitForFlash = function(tries) {
              if (tries == null) {
                tries = 5;
              }
              if (!tries) {
                return _this.onIsUsable(false);
              }
              return setTimeout(function() {
                var hasFn, pollFlashObject;
                hasFn = Object.prototype.hasOwnProperty.call(api, 'PercentLoaded') || (api.PercentLoaded != null);
                if (hasFn && api.PercentLoaded()) {
                  return pollFlashObject = setInterval(function() {
                    if (api.PercentLoaded() === 100) {
                      _this.flashPlugin = api;
                      _this.onIsUsable(true);
                      return clearInterval(pollFlashObject);
                    }
                  }, 250);
                } else {
                  return waitForFlash(--tries);
                }
              }, 100);
            };
            return waitForFlash();
          };
        })(this)
      });
    };

    FlashAudioPlayer.prototype.loadError = function(e) {
      var cb, i, len, ref1;
      if (!(e.url in this.loadingAudio)) {
        return;
      }
      ref1 = this.loadingAudio[e.url].onError;
      for (i = 0, len = ref1.length; i < len; i++) {
        cb = ref1[i];
        if (cb != null) {
          cb(e.url);
        }
      }
      delete this.loadingAudio[e.url];
      return this.flashPlugin._destruct(e.url);
    };

    FlashAudioPlayer.prototype.loadComplete = function(e) {
      var cb, i, len, ref1;
      if (!(e.url in this.loadingAudio)) {
        return;
      }
      this.loadedAudio[e.url] = e.duration;
      ref1 = this.loadingAudio[e.url].onLoad;
      for (i = 0, len = ref1.length; i < len; i++) {
        cb = ref1[i];
        if (cb != null) {
          cb(e.duration);
        }
      }
      return delete this.loadingAudio[e.url];
    };

    return FlashAudioPlayer;

  })();

  factory = function() {
    var AudioPlayer;
    return AudioPlayer = (function() {
      AudioPlayer.usablePlugin = null;

      function AudioPlayer(settings) {
        var fn, method, ref1;
        if (settings == null) {
          settings = {};
        }
        this.settings = {
          plugins: settings.plugins || [WebAudioPlayer, HtmlAudioPlayer, FlashAudioPlayer],
          onUsable: settings.onUsable || function() {},
          onNotUsable: settings.onNotUsable || function() {
            var ref1;
            return (ref1 = window.console) != null ? typeof ref1.error === "function" ? ref1.error('Cannot play audio') : void 0 : void 0;
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
        ref1 = this.plugin;
        fn = (function(_this) {
          return function(method) {
            return _this[method] = function() {
              return this.plugin[method].apply(this.plugin, arguments);
            };
          };
        })(this);
        for (method in ref1) {
          if (!hasProp.call(ref1, method)) continue;
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
        var args, base, method, ref1, results;
        this.plugin = plugin.getInstance();
        this.constructor.usablePlugin = plugin;
        if (typeof (base = this.settings).onUsable === "function") {
          base.onUsable();
        }
        results = [];
        while (this.methodBuffer.length) {
          ref1 = this.methodBuffer.shift(), method = ref1[0], args = ref1[1];
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
