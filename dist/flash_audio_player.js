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

}).call(this);
