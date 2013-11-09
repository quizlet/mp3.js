mp3.js
======
Dead Simple Audio for the Web  
[quizlet.github.io/mp3.js](http://quizlet.github.io/mp3.js)

## 1. Get It!

<a href="https://raw.github.com/quizlet/mp3.js/master/mp3.js" class="button" target="_blank">Download mp3.js</a>

## 2. Include mp3.js on your page

```html
<html>
  <head>
    ...
    <script type="text/javascript" src="/path/to/mp3.js" />
  </head>
...
```

## 3. Drop some beats

```javascript
var player = new AudioPlayer();

// easy playing
player.play('/hammertime.mp3');

// supports preloading
player.preload('/what-the-fox-say.mp3');

// Hook into events in the audio lifecycle
player.play('/all-along-the-watchtower.mp3', {
  onLoad: function() { alert('Audio Loaded!'); }
  onError: function() { alert('Error Loading Audio!'); }
  onStop: function() { alert('Audio Stopped Playing!'); }
});

// stop everything at any time
player.stopAll();

// or just stop playing a single file
player.stop('/hammertime.mp3');
```
