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
        onLoad: function(duration) {
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
        return typeof options.onLoad === "function" ? options.onLoad(this.loadedAudio[url]) : void 0;
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
      return flashembed(this.FLASH_ID, {
        src: this.SWF_PATH,
        width: '1',
        height: '1',
        version: this.FLASH_VERSION,
        onEmbed: function(success, ref) {
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
                    return intervalClear(pollFlashObject);
                  }
                }, 250);
              } else {
                return waitForFlash(--tries);
              }
            }, 100);
          };
          return waitForFlash();
        }
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
          cb(e.duration);
        }
      }
      return delete this.loadingAudio[e.url];
    };

    return FlashAudioPlayer;

  })();

}).call(this);
