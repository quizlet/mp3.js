(function() {
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
      var ref;
      if (options == null) {
        options = {};
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
        timeout: (ref = options.timeout) != null ? ref : 0
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
      var i, len, method, ref, xhr;
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
        xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = (function(_this) {
          return function() {
            return _this.audioContext.decodeAudioData(xhr.response, function(buffer) {
              var cb, j, len1, ref1;
              _this.loadedAudio[url] = buffer;
              ref1 = _this.loadingAudio[url].onLoad;
              for (j = 0, len1 = ref1.length; j < len1; j++) {
                cb = ref1[j];
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
      var cb, i, len, ref;
      if (!(url in this.loadingAudio)) {
        return;
      }
      this.loadingAudio[url].xhr.abort();
      ref = this.loadingAudio[url].onError;
      for (i = 0, len = ref.length; i < len; i++) {
        cb = ref[i];
        if (cb != null) {
          cb(url);
        }
      }
      return delete this.loadingAudio[url];
    };

    return WebAudioPlayer;

  })();

}).call(this);
