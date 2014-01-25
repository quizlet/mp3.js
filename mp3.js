(function() {
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

    FlashAudioPlayer.prototype.FLASH_VERSION = '9.0.0';

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
      var lowerVol, soundData, volume,
        _this = this;
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
      lowerVol = function() {
        if (volume > 0) {
          _this.flashPlugin._setVolume(url, volume -= 0.03);
          return setTimeout(lowerVol, 10);
        } else {
          _this.flashPlugin._stop(url);
          return _this.flashPlugin._setVolume(url, _this.MAX_VOLUME);
        }
      };
      lowerVol();
      delete this.playingAudio[url];
      return typeof soundData.onStop === "function" ? soundData.onStop(url) : void 0;
    };

    FlashAudioPlayer.prototype.play = function(url, options) {
      var _ref,
        _this = this;
      if (options == null) {
        options = {};
      }
      return this.preload(url, {
        onLoad: function() {
          if (_this.playingAudio[url]) {
            _this.stop(url);
          }
          _this.flashPlugin._play(url);
          return _this.playingAudio[url] = {
            onStop: options.onStop,
            onFinishTimer: setTimeout(function() {
              delete _this.playingAudio[url];
              return typeof options.onFinish === "function" ? options.onFinish(url) : void 0;
            }, _this.loadedAudio[url])
          };
        },
        onError: function() {
          return typeof options.onError === "function" ? options.onError(url) : void 0;
        },
        timeout: (_ref = options.timeout) != null ? _ref : 0
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
      var method, _i, _len, _ref,
        _this = this;
      if (options == null) {
        options = {};
      }
      if (!url) {
        return typeof options.onError === "function" ? options.onError() : void 0;
      }
      if (this.loadedAudio[url]) {
        return typeof options.onLoad === "function" ? options.onLoad(url) : void 0;
      }
      if (this.loadingAudio[url]) {
        _ref = ['onLoad', 'onError'];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          method = _ref[_i];
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
        return setTimeout((function() {
          return _this.loadError({
            url: url
          });
        }), Number(options.timeout));
      }
    };

    FlashAudioPlayer.prototype.appendFlashObject = function() {
      var replacement, wrapper,
        _this = this;
      wrapper = document.createElement('div');
      wrapper.id = this.CONTAINER_ID;
      wrapper.style.position = 'absolute';
      wrapper.style.marginLeft = '-1px';
      replacement = document.createElement('div');
      replacement.id = this.FLASH_ID;
      wrapper.appendChild(replacement);
      document.body.appendChild(wrapper);
      return swfobject.embedSWF(this.SWF_PATH, this.FLASH_ID, '1', '1', this.FLASH_VERSION, null, null, {
        allowScriptAccess: 'always'
      }, null, function(e) {
        var waitForFlash;
        if (!(e.success && e.ref)) {
          return _this.onIsUsable(false);
        }
        waitForFlash = function(tries) {
          if (tries == null) {
            tries = 5;
          }
          if (!tries) {
            return _this.onIsUsable(false);
          }
          return setTimeout(function() {
            var hasFn, pollFlashObject;
            hasFn = Object.prototype.hasOwnProperty.call(e.ref, 'PercentLoaded') || (e.ref.PercentLoaded != null);
            if (hasFn && e.ref.PercentLoaded()) {
              return pollFlashObject = setInterval(function() {
                if (e.ref.PercentLoaded() === 100) {
                  _this.flashPlugin = e.ref;
                  _this.onIsUsable(true);
                  return intervalClear(pollFlashObject);
                }
              }, 250);
            } else {
              return waitForFlash(--tries);
            }
          }, 100);
        };
        return waitForFlash();
      });
    };

    FlashAudioPlayer.prototype.loadError = function(e) {
      var cb, _i, _len, _ref;
      if (!(e.url in this.loadingAudio)) {
        return;
      }
      _ref = this.loadingAudio[e.url].onError;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cb = _ref[_i];
        if (cb != null) {
          cb(e.url);
        }
      }
      delete this.loadingAudio[e.url];
      return this.flashPlugin._destruct(e.url);
    };

    FlashAudioPlayer.prototype.loadComplete = function(e) {
      var cb, _i, _len, _ref;
      if (!(e.url in this.loadingAudio)) {
        return;
      }
      this.loadedAudio[e.url] = e.duration;
      _ref = this.loadingAudio[e.url].onLoad;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cb = _ref[_i];
        if (cb != null) {
          cb(e.url);
        }
      }
      return delete this.loadingAudio[e.url];
    };

    return FlashAudioPlayer;

  })();

}).call(this);
;(function() {
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
      var _ref;
      if (cb == null) {
        cb = function() {};
      }
      return cb(((_ref = this.usabilityElm) != null ? typeof _ref.canPlayType === "function" ? _ref.canPlayType('audio/mpeg') : void 0 : void 0) && navigator.appVersion.indexOf('MSIE') === -1);
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
      var elm, lowerVol, soundData, volume,
        _this = this;
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
      lowerVol = function() {
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
      lowerVol();
      delete this.playingAudio[url];
      return typeof soundData.onStop === "function" ? soundData.onStop(url) : void 0;
    };

    HtmlAudioPlayer.prototype.play = function(url, options) {
      var _ref,
        _this = this;
      if (options == null) {
        options = {};
      }
      return this.preload(url, {
        onLoad: function() {
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
            }, elm.duration * 1000)
          };
        },
        onError: function() {
          return typeof options.onError === "function" ? options.onError(url) : void 0;
        },
        timeout: (_ref = options.timeout) != null ? _ref : 0
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
      var elm, method, _i, _len, _ref,
        _this = this;
      if (options == null) {
        options = {};
      }
      if (!url) {
        return typeof options.onError === "function" ? options.onError() : void 0;
      }
      if (this.loadedAudio[url]) {
        return typeof options.onLoad === "function" ? options.onLoad(url) : void 0;
      }
      if (this.loadingAudio[url]) {
        _ref = ['onLoad', 'onError'];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          method = _ref[_i];
          this.loadingAudio[url][method].push(options[method]);
        }
      } else {
        this.loadingAudio[url] = {
          onLoad: [options.onLoad],
          onError: [options.onError]
        };
        elm = document.createElement('audio');
        elm.setAttribute('preload', 'auto');
        elm.addEventListener('loadeddata', function() {
          var cb, _j, _len1, _ref1;
          if (!(url in _this.loadingAudio)) {
            return;
          }
          _this.loadedAudio[url] = _this.loadingAudio[url].elm;
          _ref1 = _this.loadingAudio[url].onLoad;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            cb = _ref1[_j];
            if (cb != null) {
              cb(url);
            }
          }
          return delete _this.loadingAudio[url];
        }, false);
        elm.addEventListener('error', function() {
          return _this.handleLoadingError(url);
        }, false);
        elm.src = url;
        elm.load();
        this.loadingAudio[url].elm = elm;
      }
      if (options.timeout) {
        return setTimeout((function() {
          return _this.handleLoadingError(url);
        }), Number(options.timeout));
      }
    };

    HtmlAudioPlayer.prototype.handleLoadingError = function(url) {
      var cb, _i, _len, _ref;
      if (!(url in this.loadingAudio)) {
        return;
      }
      this.loadingAudio[url].elm = null;
      _ref = this.loadingAudio[url].onError;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cb = _ref[_i];
        if (cb != null) {
          cb(url);
        }
      }
      return delete this.loadingAudio[url];
    };

    return HtmlAudioPlayer;

  })();

}).call(this);
;(function() {
  var __hasProp = {}.hasOwnProperty;

  window.AudioPlayer = (function() {
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
      plugin = this.settings.plugins.shift();
      if (!plugin) {
        return typeof (_base = this.settings).onNotUsable === "function" ? _base.onNotUsable() : void 0;
      }
      return plugin.getInstance().isUsable(function(usable) {
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
      });
    };

    return AudioPlayer;

  })();

}).call(this);
;(function() {
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
      var _base;
      if (cb == null) {
        cb = function() {};
      }
      return cb((this.audioContext != null) && (typeof (_base = this.usabilityElm).canPlayType === "function" ? _base.canPlayType('audio/mpeg') : void 0));
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
      var _ref,
        _this = this;
      if (options == null) {
        options = {};
      }
      return this.preload(url, {
        onLoad: function() {
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
            }, buffer.duration * 1000)
          };
        },
        onError: function() {
          return typeof options.onError === "function" ? options.onError(url) : void 0;
        },
        timeout: (_ref = options.timeout) != null ? _ref : 0
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
      var method, xhr, _i, _len, _ref,
        _this = this;
      if (options == null) {
        options = {};
      }
      if (!url) {
        return typeof options.onError === "function" ? options.onError() : void 0;
      }
      this.unmuteIOS();
      if (this.loadedAudio[url]) {
        return typeof options.onLoad === "function" ? options.onLoad(url) : void 0;
      }
      if (this.loadingAudio[url]) {
        _ref = ['onLoad', 'onError'];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          method = _ref[_i];
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
        xhr.onload = function() {
          return _this.audioContext.decodeAudioData(xhr.response, function(buffer) {
            var cb, _j, _len1, _ref1;
            _this.loadedAudio[url] = buffer;
            _ref1 = _this.loadingAudio[url].onLoad;
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              cb = _ref1[_j];
              if (cb != null) {
                cb(url);
              }
            }
            return delete _this.loadingAudio[url];
          }, function() {
            return _this.handleLoadingError(url);
          });
        };
        xhr.onerror = function() {
          return _this.handleLoadingError(url);
        };
        xhr.send();
        this.loadingAudio[url].xhr = xhr;
      }
      if (options.timeout) {
        return setTimeout((function() {
          return _this.handleLoadingError(url);
        }), Number(options.timeout));
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
        if (!WebAudioPlayer.audioContext) {
          if (typeof AudioContext !== "undefined" && AudioContext !== null) {
            WebAudioPlayer.audioContext = new AudioContext();
          } else if (typeof webkitAudioContext !== "undefined" && webkitAudioContext !== null) {
            WebAudioPlayer.audioContext = new webkitAudioContext();
          }
        }
        return WebAudioPlayer.audioContext;
      } catch (_error) {}
    };

    WebAudioPlayer.prototype.handleLoadingError = function(url) {
      var cb, _i, _len, _ref;
      if (!(url in this.loadingAudio)) {
        return;
      }
      this.loadingAudio[url].xhr.abort();
      _ref = this.loadingAudio[url].onError;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cb = _ref[_i];
        if (cb != null) {
          cb(url);
        }
      }
      return delete this.loadingAudio[url];
    };

    return WebAudioPlayer;

  })();

}).call(this);
