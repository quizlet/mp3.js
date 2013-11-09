---
layout: page
title: mp3.js
tagline: Supporting tagline
---

## 1. Get It!

<a href="https://raw.github.com/quizlet/mp3.js/master/mp3.js" class="button" target="_blank">Download mp3.js</a>

## 2. Include mp3.js on your page

{% highlight html linenos %}
<html>
  <head>
    ...
    <script type="text/javascript" src="/path/to/mp3.js" />
  </head>
...
{% endhighlight %}

## 3. Drop some beats

{% highlight javascript %}
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
{% endhighlight %}

<a href="https://github.com/quizlet/mp3.js">
  <img style="position: absolute; top: 0; right: 0; border: 0; padding: 0; margin: 0;" src="https://s3.amazonaws.com/github/ribbons/forkme_right_red_aa0000.png" alt="Fork me on GitHub" />
</a>