import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MetronomeService {
  bpm = signal<number>(120);
  isPlaying = signal<boolean>(false);

  private audioCtx: AudioContext | null = null;
  private nextNoteTime = 0;
  private timerId: number | null = null;

  toggle() {
    if (this.isPlaying()) {
      this.stop();
    } else {
      this.start();
    }
  }

  setBpm(delta: number) {
    this.bpm.update(current => Math.max(30, Math.min(250, current + delta)));
  }

  private start() {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    this.isPlaying.set(true);
    this.nextNoteTime = this.audioCtx.currentTime + 0.05;
    this.scheduler();
  }

  private stop() {
    this.isPlaying.set(false);
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
    }
  }

  private scheduler() {
    while (this.nextNoteTime < this.audioCtx!.currentTime + 0.1) {
      this.scheduleNote(this.nextNoteTime);
      this.nextNoteTime += 60.0 / this.bpm();
    }
    this.timerId = window.setTimeout(() => this.scheduler(), 25);
  }

  private scheduleNote(time: number) {
    const osc = this.audioCtx!.createOscillator();
    const gain = this.audioCtx!.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx!.destination);

    osc.frequency.setValueAtTime(1000, time);
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.start(time);
    osc.stop(time + 0.05);
  }
}
