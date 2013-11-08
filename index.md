---
layout: page
title: mp3.js
tagline: Supporting tagline
---

## 1. Get It!

Download mp3.js [here](#download-url)

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
player.play('/hammertime.mp3');
{% endhighlight %}