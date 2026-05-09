// src/services/AudioService.ts
// @ts-ignore
import { Howl, Howler } from 'howler';

class AudioService {
  private sounds: Map<string, InstanceType<typeof Howl>> = new Map();
  private musicTrack: InstanceType<typeof Howl> | null = null;
  private sfxVolume = 0.6;
  private musicVolume = 0.3;
  private initialized = false;

  init() {
    if (this.initialized) return;
    this.initialized = true;
    Howler.volume(1.0);
  }

  // Play a one-shot sound by URL or data URI
  play(id: string, src: string | string[], volume = this.sfxVolume) {
    if (!this.initialized) return;
    if (!this.sounds.has(id)) {
      this.sounds.set(id, new Howl({ src: Array.isArray(src) ? src : [src], volume, preload: true }));
    }
    this.sounds.get(id)?.play();
  }

  // Play looping background music
  playMusic(src: string | string[]) {
    this.stopMusic();
    this.musicTrack = new Howl({
      src: Array.isArray(src) ? src : [src],
      loop: true,
      volume: this.musicVolume,
    });
    this.musicTrack.play();
  }

  stopMusic() {
    this.musicTrack?.stop();
    this.musicTrack = null;
  }

  setMusicVolume(v: number) {
    this.musicVolume = v;
    this.musicTrack?.volume(v);
  }

  setSfxVolume(v: number) {
    this.sfxVolume = v;
  }

  stopAll() {
    Howler.stop();
  }
}

export const audioService = new AudioService();
