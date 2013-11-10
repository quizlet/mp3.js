(function() {
  window.FlashAudioPlayer = (function() {
    FlashAudioPlayer.getInstance = function() {
      return this.instance || (this.instance = new this);
    };

    FlashAudioPlayer.prototype.onIsUsable = function() {};

    FlashAudioPlayer.prototype.loadingAudio = {};

    FlashAudioPlayer.prototype.durations = {};

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
      clearTimeout(soundData.onFinish);
      volume = this.MAX_VOLUME;
      lowerVol = function() {
        if (volume > 0) {
          _this.flashPlugin._setVolume(url, volume -= 0.03);
          return timeoutSet(10, lowerVol);
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
            onFinish: timeoutSet(_this.durations[url], function() {
              delete _this.playingAudio[url];
              return typeof options.onFinish === "function" ? options.onFinish(url) : void 0;
            })
          };
        },
        onError: function() {
          return typeof options.onError === "function" ? options.onError(url) : void 0;
        },
        timeout: (_ref = options.timeout) != null ? _ref : 0
      });
    };

    FlashAudioPlayer.prototype.destruct = function(url) {
      if (Object.prototype.hasOwnProperty.call(this.durations, url)) {
        delete this.durations[url];
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
      if (this.durations[url]) {
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
        return timeoutSet(Number(options.timeout), function() {
          return _this.loadError({
            url: url
          });
        });
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
          return timeoutSet(100, function() {
            var hasFn, pollFlashObject;
            hasFn = Object.prototype.hasOwnProperty.call(e.ref, 'PercentLoaded') || (e.ref.PercentLoaded != null);
            if (hasFn && e.ref.PercentLoaded()) {
              return pollFlashObject = intervalSet(250, function() {
                if (e.ref.PercentLoaded() === 100) {
                  _this.flashPlugin = e.ref;
                  _this.onIsUsable(true);
                  return intervalClear(pollFlashObject);
                }
              });
            } else {
              return waitForFlash(--tries);
            }
          });
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
      this.durations[e.url] = e.duration;
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