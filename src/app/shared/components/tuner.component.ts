import { Component, input, output, signal, effect, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Instrument } from '../../core/models/song.model';

const STRUNG_FREQUENCIES: { [key: string]: number } = {
  // Kytara
  "E2": 82.41,
  "A2": 110.00,
  "D3": 146.83,
  "G3": 196.00,
  "B3": 246.94,
  "E4": 329.63,
  // Ukulele
  "G4": 392.00,
  "C4": 261.63,
  "E4_UKU": 329.63,
  "A4": 440.00
};

@Component({
  selector: 'app-tuner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div class="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl w-full max-w-md p-6 relative flex flex-col items-center">

        <!-- ZAVÍRACÍ TLAČÍTKO -->
        <button
          type="button"
          (click)="close.emit()"
          class="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl font-bold p-1 cursor-pointer"
        >✕</button>

        <!-- NADPIS & VOLBA NÁSTROJE -->
        <h3 class="text-xl font-bold mb-1 text-[var(--text-main)]">
          Ladička — {{ instrument() === 'UKU' ? 'Ukulele' : 'Kytara' }}
        </h3>
        <p class="text-xs text-[var(--text-muted)] mb-4">
          {{ isListening() ? 'Poslouchám... Brnkni do struny' : 'Klikni na tlačítko a zapni mikrofon' }}
        </p>

        <!-- UKAZATEL RUČIČKY (TUNER POINTER) -->
        <div class="w-full bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg p-4 mb-6 relative flex flex-col items-center">
          <div class="text-sm font-mono font-bold mb-2 h-6 text-center">
            @if (detectedNote()) {
              <span>Struna <strong class="text-[var(--primary-color)] text-lg">{{ detectedNote() }}</strong> ({{ detectedPitch().toFixed(1) }} Hz)</span>
            } @else {
              <span class="text-[var(--text-muted)] font-normal opacity-70">Čekám na tón...</span>
            }
          </div>

          <!-- Stupnice -->
          <div class="w-full h-3 bg-gray-300 dark:bg-gray-700 rounded-full relative overflow-hidden my-2">
            <!-- Středová ryska -->
            <div class="absolute left-1/2 top-0 bottom-0 w-1 bg-green-500 -translate-x-1/2 z-10"></div>
            <!-- Ručička -->
            <div
              class="absolute top-0 bottom-0 w-3 rounded-full transition-all duration-75 -translate-x-1/2"
              [style.left.%]="pointerPosition()"
              [style.backgroundColor]="isTuned() ? '#22c55e' : '#f97316'"
            ></div>
          </div>

          <!-- Text stavu -->
          <div class="text-xs font-semibold mt-1" [class.text-green-500]="isTuned()" [class.text-orange-500]="!isTuned() && detectedNote()">
            {{ tunerStatusText() }}
          </div>
        </div>

        <!-- HLAVA NÁSTROJE (SVG STROKE) -->
        <div class="mb-6 flex justify-center">
          <svg width="200" height="195" viewBox="0 0 200 195" class="text-[var(--text-main)]">
            <!-- Silueta hlavy -->
            <path d="M75,195 L75,160 L65,140 L65,25 Q100,5 135,25 L135,140 L125,160 L125,195 Z" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.25"/>
            <rect x="75" y="165" width="50" height="30" fill="currentColor" opacity="0.1" />

            <!-- Kolíčky a struny -->
            @for (strung of currentStrings(); track $index) {
              <!-- Kolík -->
              <circle
                [attr.cx]="strung.align === 'end' ? 58 : 142"
                [attr.cy]="strung.y"
                r="4" fill="currentColor" opacity="0.3"
              />
              <line
                [attr.x1]="strung.align === 'end' ? 58 : 142"
                [attr.y1]="strung.y"
                [attr.x2]="strung.align === 'end' ? 75 : 125"
                [attr.y2]="strung.y"
                stroke="currentColor" stroke-width="1" opacity="0.2"
              />

              <!-- Zvýrazněný kruh s tónem -->
              <g class="cursor-pointer" (click)="playManualTone(strung.note)">
                <circle
                  [attr.cx]="strung.x"
                  [attr.cy]="strung.y"
                  r="15"
                  [attr.fill]="detectedNote() === strung.note ? 'var(--primary-color)' : 'var(--bg-card)'"
                  [attr.stroke]="detectedNote() === strung.note ? 'var(--primary-color)' : 'var(--border-color)'"
                  stroke-width="2"
                />
                <text
                  [attr.x]="strung.x"
                  [attr.y]="strung.y + 4"
                  text-anchor="middle"
                  font-size="11"
                  font-family="monospace"
                  font-weight="bold"
                  [attr.fill]="detectedNote() === strung.note ? '#ffffff' : 'var(--text-main)'"
                >{{ strung.note }}</text>
              </g>
            }
          </svg>
        </div>

        <!-- OVLÁDACÍ TLAČÍTKO MIKROFONU -->
        <button
          type="button"
          (click)="toggleListening()"
          [class.bg-emerald-600]="!isListening()"
          [class.hover:bg-emerald-700]="!isListening()"
          [class.bg-rose-600]="isListening()"
          [class.hover:bg-rose-700]="isListening()"
          class="w-full py-2.5 rounded-lg text-white font-bold transition-colors shadow cursor-pointer text-sm"
        >
          {{ isListening() ? 'Zastavit ladičku' : 'Zapnout ladičku (mikrofon)' }}
        </button>

      </div>
    </div>
  `
})
export class TunerComponent implements OnDestroy {
  instrument = input<Instrument>('GTR');
  close = output<void>();

  isListening = signal<boolean>(false);
  detectedPitch = signal<number>(0);
  detectedNote = signal<string>('');
  pointerPosition = signal<number>(50); // 50% = střed
  isTuned = signal<boolean>(false);
  tunerStatusText = signal<string>('');

  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number = 0;

  guitarStrings = [
    { note: "D", x: 30,  y: 65,  align: "end" },
    { note: "A", x: 30,  y: 115, align: "end" },
    { note: "E", x: 30,  y: 165, align: "end" },
    { note: "G", x: 170, y: 65,  align: "start" },
    { note: "B", x: 170, y: 115, align: "start" },
    { note: "E", x: 170, y: 165, align: "start" }
  ];

  ukuleleStrings = [
    { note: "G", x: 30,  y: 85,  align: "end" },
    { note: "C", x: 30,  y: 145, align: "end" },
    { note: "E", x: 170, y: 85,  align: "start" },
    { note: "A", x: 170, y: 145, align: "start" }
  ];

  currentStrings = signal(this.guitarStrings);

  constructor() {
    effect(() => {
      this.currentStrings.set(this.instrument() === 'UKU' ? this.ukuleleStrings : this.guitarStrings);
    });
  }

  async toggleListening() {
    if (this.isListening()) {
      this.stopListening();
    } else {
      await this.startListening();
    }
  }

  async startListening() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;

      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);

      this.isListening.set(true);
      this.updateLoop();
    } catch (err) {
      console.error("Přístup k mikrofonu selhal:", err);
      this.tunerStatusText.set("Povolte přístup k mikrofonu v prohlížeči.");
    }
  }

  stopListening() {
    this.isListening.set(false);
    cancelAnimationFrame(this.animFrameId);

    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.pointerPosition.set(50);
    this.detectedNote.set('');
    this.tunerStatusText.set('');
  }

  playManualTone(note: string) {
    // Ruční přehrání referenčního tónu po kliknutí na kolík
    const targetFreq = STRUNG_FREQUENCIES[note] || 220;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(targetFreq, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  }

  private updateLoop = () => {
    if (!this.isListening() || !this.analyser) return;

    const buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buffer);

    const pitch = this.autoCorrelate(buffer, this.audioContext!.sampleRate);

    if (pitch !== -1 && pitch > 50 && pitch < 500) {
      this.detectedPitch.set(pitch);

      const isUku = this.instrument() === 'UKU';
      const targetKeys = isUku
        ? ["G4", "C4", "E4_UKU", "A4"]
        : ["E2", "A2", "D3", "G3", "B3", "E4"];

      let closestKey = targetKeys[0];
      let minDiff = Math.abs(pitch - STRUNG_FREQUENCIES[closestKey]);

      for (const k of targetKeys) {
        const diff = Math.abs(pitch - STRUNG_FREQUENCIES[k]);
        if (diff < minDiff) {
          minDiff = diff;
          closestKey = k;
        }
      }

      const targetFreq = STRUNG_FREQUENCIES[closestKey];
      const noteName = closestKey.replace(/[0-9_UKU]/g, '');
      this.detectedNote.set(noteName);

      const diffHz = pitch - targetFreq;

      if (Math.abs(diffHz) < 1.0) {
        this.isTuned.set(true);
        this.pointerPosition.set(50);
        this.tunerStatusText.set('Perfektně naladěno!');
      } else {
        this.isTuned.set(false);
        const direction = diffHz > 0 ? 'Povol strunu' : 'Utáhni strunu';
        this.tunerStatusText.set(direction);

        let pct = 50 + (diffHz * 4);
        pct = Math.max(5, Math.min(95, pct));
        this.pointerPosition.set(pct);
      }
    }

    this.animFrameId = requestAnimationFrame(this.updateLoop);
  };

  private autoCorrelate(buffer: Float32Array, sampleRate: number): number {
    const SIZE = buffer.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1;

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

  ngOnDestroy() {
    this.stopListening();
  }
}
