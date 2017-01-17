(function() {
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
      var ref;
      if (cb == null) {
        cb = function() {};
      }
      return cb(((ref = this.usabilityElm) != null ? typeof ref.canPlayType === "function" ? ref.canPlayType('audio/mpeg') : void 0 : void 0) && navigator.appVersion.indexOf('MSIE') === -1);
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
      var ref;
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
        timeout: (ref = options.timeout) != null ? ref : 0
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
      var elm, i, len, method, ref;
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
        ref = ['onLoad', 'onError'];
        for (i = 0, len = ref.length; i < len; i++) {
          method = ref[i];
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
            var cb, j, len1, ref1;
            if (!(url in _this.loadingAudio)) {
              return;
            }
            _this.loadedAudio[url] = _this.loadingAudio[url].elm;
            ref1 = _this.loadingAudio[url].onLoad;
            for (j = 0, len1 = ref1.length; j < len1; j++) {
              cb = ref1[j];
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
      var cb, i, len, ref;
      if (!(url in this.loadingAudio)) {
        return;
      }
      this.loadingAudio[url].elm = null;
      ref = this.loadingAudio[url].onError;
      for (i = 0, len = ref.length; i < len; i++) {
        cb = ref[i];
        if (cb != null) {
          cb(url);
        }
      }
      return delete this.loadingAudio[url];
    };

    return HtmlAudioPlayer;

  })();

}).call(this);
