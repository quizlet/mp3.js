package {

import flash.display.Sprite;
import flash.external.ExternalInterface;

public class FlashAudioPlayer extends Sprite {

	private var instances:Object;

	public function FlashAudioPlayer():void {
		this.instances = new Object();

		ExternalInterface.addCallback('_preload', preload);
		ExternalInterface.addCallback('_play', play);
		ExternalInterface.addCallback('_stop', stop);
		ExternalInterface.addCallback('_destruct', destruct);
		ExternalInterface.addCallback('_setVolume', setVolume);
	}

	protected function preload(mp3:String):void {
		if (mp3 in instances) { return; }
		this.instances[mp3] = new SoundInstance(mp3);
	}

	protected function play(mp3:String):void {
		if (!(mp3 in instances)) { this.preload(mp3); }
		this.instances[mp3].play();
	}

	protected function stop(mp3:String):void {
		if (mp3 in instances) { this.instances[mp3].stop(); }
	}

	protected function destruct(mp3:String):void {
		if (mp3 in instances) { delete this.instances[mp3]; }
	}

	protected function setVolume(mp3:String, vol:Number):void {
		if (mp3 in instances) { this.instances[mp3].setVolume(vol); }
	}
}

}

import flash.external.ExternalInterface;
import flash.net.URLRequest;
import flash.media.Sound;
import flash.media.SoundChannel;
import flash.media.SoundTransform;
import flash.events.Event;
import flash.errors.IOError;
import flash.events.IOErrorEvent;
import flash.events.ProgressEvent;

class SoundInstance {

	private var channel:SoundChannel;
	private var sound:Sound;
	private var playerInstance:String;

	private var duration:Number;
	private var volume:Number = 1;

	public function SoundInstance(mp3:String):void {
		this.playerInstance = 'FlashAudioPlayer.getInstance().';

		this.channel = new SoundChannel();
		this.sound = new Sound(new URLRequest(mp3));

		this.sound.addEventListener(IOErrorEvent.IO_ERROR, this.loadError);
		this.sound.addEventListener(Event.COMPLETE, this.loadComplete);
		this.sound.addEventListener(ProgressEvent.PROGRESS, this.setDurationFromProgress);
	}

	public function play():void {
		this.channel = this.sound.play();
		this.setVolume(this.volume);
	}

	public function stop():void {
		this.channel.stop();
	}

	public function setVolume(vol:Number):void {
		this.volume = vol;
		var transform:SoundTransform = this.channel.soundTransform;
		if (vol < 0) vol = 0;
		if (vol > 1) vol = 1;
		transform.volume = vol;
		this.channel.soundTransform = transform;
	}

	private function setDurationFromProgress(e:ProgressEvent):void {
		this.duration = (e.bytesTotal / (e.bytesLoaded / this.sound.length))
	}

	private function loadError(e:IOErrorEvent):void {
		ExternalInterface.call(this.playerInstance + 'loadError', { url: this.sound.url });
	}

	private function loadComplete(e:Event):void {
		ExternalInterface.call(this.playerInstance + 'loadComplete', {
			url: this.sound.url,
			duration: this.duration
		});
	}

}
