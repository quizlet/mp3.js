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
        onLoad: function(duration) {
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
        return typeof options.onLoad === "function" ? options.onLoad(this.loadedAudio[url].duration * 1000) : void 0;
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
              cb(_this.loadedAudio[url].duration * 1000);
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
