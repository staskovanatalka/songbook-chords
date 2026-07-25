import { Injectable, signal } from '@angular/core';
import { Instrument } from '../models/song.model';

export interface TunerResult {
  detectedNote: string;
  frequency: number;
  targetFrequency: number;
  diffHz: number;
  percentage: number; // 5% až 95% pro pozici ručičky
  isCentered: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TunerService {
  isListening = signal<boolean>(false);
  statusMessage = signal<string>('Klikni na strunu nebo spusť mikrofon');
  tunerResult = signal<TunerResult | null>(null);

  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;

  // Frekvence strun pro Kytaru a Ukulele (v Hz)
  private readonly STRING_FREQUENCIES: { [key: string]: number } = {
    'E2': 82.41, 'A2': 110.00, 'D3': 146.83, 'G3': 196.00, 'B3': 246.94, 'E4': 329.63, // Kytara
    'G4': 392.00, 'C4': 261.63, 'E4_UKU': 329.63, 'A4': 440.00                      // Ukulele
  };

  async toggleMic(currentInstrument: Instrument): Promise<void> {
    if (this.isListening()) {
      this.stopMic();
    } else {
      await this.startMic(currentInstrument);
    }
  }

  async startMic(currentInstrument: Instrument): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;

      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);

      this.isListening.set(true);
      this.statusMessage.set('Poslouchám... Brnkni do struny');

      this.updateLoop(currentInstrument);
    } catch (err) {
      console.error('Přístup k mikrofonu selhal:', err);
      this.statusMessage.set('Chyba: Mikrofon nebyl povolen.');
    }
  }

  stopMic(): void {
    this.isListening.set(false);
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.statusMessage.set('Klikni na strunu nebo spusť mikrofon');
    this.tunerResult.set(null);
  }

  private updateLoop(currentInstrument: Instrument): void {
    if (!this.isListening() || !this.analyser || !this.audioContext) return;

    const buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buffer);

    const pitch = this.autoCorrelate(buffer, this.audioContext.sampleRate);

    if (pitch !== -1 && pitch > 50 && pitch < 500) {
      const targetStrings = currentInstrument === 'UKU'
        ? ['G4', 'C4', 'E4_UKU', 'A4']
        : ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];

      let closestString = targetStrings[0];
      let minDiff = Math.abs(pitch - this.STRING_FREQUENCIES[closestString]);

      targetStrings.forEach(stringKey => {
        const diff = Math.abs(pitch - this.STRING_FREQUENCIES[stringKey]);
        if (diff < minDiff) {
          minDiff = diff;
          closestString = stringKey;
        }
      });

      const targetFreq = this.STRING_FREQUENCIES[closestString];
      const displayNote = closestString.replace('2', '').replace('3', '').replace('4', '').replace('_UKU', '');
      const diffHz = pitch - targetFreq;

      let percentage = 50 + (diffHz * 4);
      percentage = Math.max(5, Math.min(95, percentage));

      const isCentered = Math.abs(diffHz) < 1.0;

      this.tunerResult.set({
        detectedNote: displayNote,
        frequency: pitch,
        targetFrequency: targetFreq,
        diffHz,
        percentage,
        isCentered
      });

      if (isCentered) {
        this.statusMessage.set(`Struna ${displayNote} je perfektně naladěna!`);
      } else {
        const direction = diffHz > 0 ? 'Povol strunu' : 'Utáhni strunu';
        this.statusMessage.set(`Struna ${displayNote} (${pitch.toFixed(1)} Hz) — ${direction}`);
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.updateLoop(currentInstrument));
  }

  // Algoritmus autokorelace pro výpočet frekvence tónu
  private autoCorrelate(buffer: Float32Array, sampleRate: number): number {
    const SIZE = buffer.length;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1; // Ticho

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    }
    for (let i = SIZE - 1; i >= SIZE / 2; i--) {
      if (Math.abs(buffer[i]) < thres) { r2 = i; break; }
    }

    const buf = buffer.subarray(r1, r2);
    const len = buf.length;
    const c = new Float32Array(len);

    for (let i = 0; i < len; i++) {
      for (let j = 0; j < len - i; j++) {
        c[i] = c[i] + buf[j] * buf[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < len; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }

    let T0 = maxpos;
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  }
}
