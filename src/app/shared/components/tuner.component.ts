import { Component, input, output, signal, effect, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Instrument } from '../../core/models/song.model';

export interface StringConfig {
  key: string;
  displayNote: string;
  subscript?: string;
  y: number;
  btnX: number;
  pegX: number;
  headX: number;
}

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
    <!-- BACKDROP -->
    <div
      class="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans animate-fade-in"
      (click)="onBackdropClick($event)"
    >
      <!-- MODAL KARTA -->
      <div class="bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] rounded-3xl w-full max-w-[360px] shadow-2xl overflow-hidden text-center flex flex-col select-none">

        <!-- HORNÍ HLAVIČKA -->
        <div class="flex items-center justify-between px-5 pt-4 pb-2 border-b border-[var(--border-color)]">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
              {{ instrument() === 'UKU' ? 'Ukulele' : 'Kytara' }}
            </span>

            <!-- PŘEPÍNAČ AUTO / MANUÁL -->
            <button
              type="button"
              (click)="toggleAutoMode()"
              class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wide transition-all cursor-pointer border"
              [class.bg-[var(--primary-color)]]="isAutoMode()"
              [class.text-white]="isAutoMode()"
              [class.border-[var(--primary-color)]]="isAutoMode()"
              [class.bg-[var(--bg-input)]]="!isAutoMode()"
              [class.text-[var(--text-muted)]]="!isAutoMode()"
              [class.border-[var(--border-color)]]="!isAutoMode()"
              title="Kliknutím přepnete na automatickou detekci"
            >
              {{ isAutoMode() ? 'AUTO' : 'MANUÁL' }}
            </button>
          </div>

          <button
            type="button"
            class="h-7 w-7 flex items-center justify-center rounded-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer text-xs font-bold"
            (click)="closeTuner()"
          >
            ✕
          </button>
        </div>

        <!-- MĚŘÍCÍ PLOCHA -->
        <div class="relative bg-[var(--bg-input)] h-[380px] flex flex-col justify-between overflow-hidden border-b border-[var(--border-color)]">

          <!-- VELKÝ DETEKOVANÝ TÓN -->
          <div class="pt-3 z-10">
            @if (isListening() && activeTargetString(); as target) {
              <div class="text-4xl font-extrabold font-mono tracking-tight flex items-baseline justify-center" [class.text-emerald-500]="isTuned()" [class.text-[var(--text-main)]]="!isTuned()">
                <span>{{ target.displayNote }}</span>
                @if (target.subscript) {
                  <span class="text-xl opacity-75 ml-0.5">{{ target.subscript }}</span>
                }
              </div>
              <div
                class="text-xs font-mono font-bold mt-0.5"
                [class.text-emerald-500]="isTuned()"
                [class.text-amber-500]="!isTuned()"
              >
                {{ tunerStatusText() }}
              </div>
            } @else {
              <div class="text-sm font-medium text-[var(--text-muted)] py-4 font-mono">
                {{ isListening() ? (isAutoMode() ? 'Zahraj na strunu...' : 'Zahraj vybranou strunu...') : 'Ladička je vypnutá' }}
              </div>
            }
          </div>

          <!-- STUPNICE S ČÍSLY A ZÁŘEZY -->
          <div class="relative w-full px-6 z-10">
            <div class="flex justify-between text-[9px] font-mono text-[var(--text-muted)] mb-1 px-1 opacity-80">
              <span>-50</span>
              <span>-25</span>
              <span class="text-emerald-500 font-bold">0</span>
              <span>+25</span>
              <span>+50</span>
            </div>

            <div class="relative w-full h-8 flex items-center">
              <div class="absolute w-full h-[1px] bg-[var(--border-color)]"></div>

              <div class="absolute inset-0 flex justify-between items-center pointer-events-none">
                <div class="w-[1px] h-3 bg-[var(--border-color)]"></div>
                <div class="w-[1px] h-2 bg-[var(--border-color)] opacity-60"></div>
                <div class="w-[1px] h-3 bg-[var(--border-color)]"></div>
                <div class="w-[1px] h-2 bg-[var(--border-color)] opacity-60"></div>
                <div class="w-[2px] h-5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]"></div>
                <div class="w-[1px] h-2 bg-[var(--border-color)] opacity-60"></div>
                <div class="w-[1px] h-3 bg-[var(--border-color)]"></div>
                <div class="w-[1px] h-2 bg-[var(--border-color)] opacity-60"></div>
                <div class="w-[1px] h-3 bg-[var(--border-color)]"></div>
              </div>

              <!-- POHYBLIVÝ KROUŽEK SE ŠIPKOU -->
              <div
                class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-75 ease-out flex flex-col items-center pointer-events-none"
                [style.left.%]="isListening() ? pointerPosition() : 50"
              >
                <div
                  class="w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-md transition-colors duration-150 bg-[var(--bg-card)]"
                  [class.border-emerald-500]="isTuned()"
                  [class.shadow-[0_0_12px_rgba(16,185,129,0.5)]]="isTuned()"
                  [class.border-amber-500]="!isTuned() && isListening()"
                  [class.border-[var(--border-color)]]="!isListening()"
                >
                  <div
                    class="w-2.5 h-2.5 rounded-full"
                    [class.bg-emerald-500]="isTuned()"
                    [class.bg-amber-500]="!isTuned() && isListening()"
                    [class.bg-[var(--text-muted)]]="!isListening()"
                  ></div>
                </div>

                <div
                  class="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] -mt-[1px]"
                  [class.border-t-emerald-500]="isTuned()"
                  [class.border-t-amber-500]="!isTuned() && isListening()"
                  [class.border-t-[var(--border-color)]]="!isListening()"
                ></div>
              </div>
            </div>
          </div>

          <!-- SILUETA HLAVY KYTARY S NAVAZUJÍCÍM KRKEM -->
          <div class="flex justify-center -mb-2">
            <svg width="260" height="235" viewBox="0 0 260 235" class="overflow-visible">

              <!-- Krk navazující pod nultým pražcem -->
              <rect
                x="98"
                y="188"
                width="64"
                height="47"
                fill="var(--border-color)"
                opacity="0.18"
              />

              <!-- Obrys hlavy kytary a přechodu do krku -->
              <path
                d="M 98,235
                   L 98,188
                   L 84,152
                   L 84,18
                   Q 130,4 176,18
                   L 176,152
                   L 162,188
                   L 162,235"
                fill="none"
                stroke="var(--border-color)"
                stroke-width="2"
                stroke-linejoin="round"
                stroke-linecap="round"
              />

              <!-- Kolíčky a tlačítka strun -->
              @for (strung of currentStrings(); track strung.key) {
                <!-- Vodicí linka -->
                <line
                  [attr.x1]="strung.pegX"
                  [attr.y1]="strung.y"
                  [attr.x2]="strung.headX"
                  [attr.y2]="strung.y"
                  stroke="var(--border-color)"
                  stroke-width="1.8"
                />

                <!-- Malý kolíček na vnější straně -->
                <circle
                  [attr.cx]="strung.pegX"
                  [attr.cy]="strung.y"
                  r="4"
                  fill="var(--border-color)"
                />

                <!-- Kruhové tlačítko s tónem -->
                <g class="cursor-pointer group" (click)="selectManualString(strung)">
                  <circle
                    [attr.cx]="strung.btnX"
                    [attr.cy]="strung.y"
                    r="16"
                    [attr.fill]="isSelectedOrDetected(strung) ? (isTuned() ? '#10b981' : '#f59e0b') : 'var(--bg-card)'"
                    [attr.stroke]="isSelectedOrDetected(strung) ? (isTuned() ? '#10b981' : '#f59e0b') : 'var(--border-color)'"
                    stroke-width="2"
                    class="transition-colors duration-150 group-hover:stroke-[var(--primary-color)]"
                  />
                  <!-- Text tónu se spodním indexem -->
                  <text
                    [attr.x]="strung.subscript ? strung.btnX - 2.5 : strung.btnX"
                    [attr.y]="strung.y + 4.5"
                    text-anchor="middle"
                    font-size="12"
                    font-family="sans-serif"
                    font-weight="bold"
                    [attr.fill]="isSelectedOrDetected(strung) ? '#ffffff' : 'var(--text-main)'"
                    class="transition-colors duration-150 group-hover:fill-[var(--primary-color)]"
                  >{{ strung.displayNote }}</text>

                  @if (strung.subscript) {
                    <text
                      [attr.x]="strung.btnX + 6"
                      [attr.y]="strung.y + 6.5"
                      text-anchor="middle"
                      font-size="9"
                      font-family="sans-serif"
                      font-weight="bold"
                      [attr.fill]="isSelectedOrDetected(strung) ? '#ffffff' : 'var(--text-muted)'"
                    >{{ strung.subscript }}</text>
                  }
                </g>
              }
            </svg>
          </div>

        </div>

        <!-- TLAČÍTKO MIKROFONU -->
        <div class="p-4 bg-[var(--bg-card)]">
          <button
            type="button"
            (click)="toggleListening()"
            class="w-full h-10 rounded-xl font-bold font-mono text-xs tracking-wider uppercase transition-all duration-150 cursor-pointer shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 text-white"
            [class.bg-rose-500]="isListening()"
            [class.hover:bg-rose-600]="isListening()"
            [class.bg-emerald-600]="!isListening()"
            [class.hover:bg-emerald-700]="!isListening()"
          >
            @if (isListening()) {
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2"></rect>
              </svg>
              <span>Vypnout mikrofon</span>
            } @else {
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
              <span>Zapnout ladičku</span>
            }
          </button>
        </div>

      </div>
    </div>
  `
})
export class TunerComponent implements OnDestroy {
  instrument = input<Instrument>('GTR');
  close = output<void>();

  isListening = signal<boolean>(false);
  isAutoMode = signal<boolean>(true);

  detectedPitch = signal<number>(0);
  activeKey = signal<string>('');
  manualKey = signal<string | null>(null);

  pointerPosition = signal<number>(50);
  isTuned = signal<boolean>(false);
  tunerStatusText = signal<string>('');

  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number = 0;

  guitarStrings: StringConfig[] = [
    { key: "D3", displayNote: "D", y: 68,  btnX: 38,  pegX: 74,  headX: 84 },
    { key: "A2", displayNote: "A", y: 126, btnX: 38,  pegX: 74,  headX: 84 },
    { key: "E2", displayNote: "E", subscript: "2", y: 184, btnX: 38, pegX: 74, headX: 98 },
    { key: "G3", displayNote: "G", y: 68,  btnX: 222, pegX: 186, headX: 176 },
    { key: "B3", displayNote: "B", y: 126, btnX: 222, pegX: 186, headX: 176 },
    { key: "E4", displayNote: "E", subscript: "4", y: 184, btnX: 222, pegX: 186, headX: 162 }
  ];

  ukuleleStrings: StringConfig[] = [
    { key: "G4", displayNote: "G", y: 80,  btnX: 38,  pegX: 74,  headX: 84 },
    { key: "C4", displayNote: "C", y: 155, btnX: 38,  pegX: 74,  headX: 98 },
    { key: "E4_UKU", displayNote: "E", y: 80,  btnX: 222, pegX: 186, headX: 176 },
    { key: "A4", displayNote: "A", y: 155, btnX: 222, pegX: 186, headX: 162 }
  ];

  currentStrings = signal<StringConfig[]>(this.guitarStrings);

  activeTargetString = computed<StringConfig | null>(() => {
    const key = !this.isAutoMode() ? this.manualKey() : this.activeKey();
    if (!key) return null;
    return this.currentStrings().find(s => s.key === key) || null;
  });

  constructor() {
    effect(() => {
      this.currentStrings.set(this.instrument() === 'UKU' ? this.ukuleleStrings : this.guitarStrings);
      this.manualKey.set(null);
      this.isAutoMode.set(true);
    });
  }

  toggleAutoMode() {
    this.isAutoMode.update(v => !v);
    if (this.isAutoMode()) {
      this.manualKey.set(null);
    } else if (!this.manualKey()) {
      this.manualKey.set(this.currentStrings()[0].key);
    }
  }

  selectManualString(strung: StringConfig) {
    this.isAutoMode.set(false);
    this.manualKey.set(strung.key);
    this.playManualTone(strung.key);
  }

  isSelectedOrDetected(strung: StringConfig): boolean {
    if (!this.isListening()) return false;
    if (!this.isAutoMode()) {
      return this.manualKey() === strung.key;
    }
    return this.activeKey() === strung.key;
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
      this.tunerStatusText.set("Povolte přístup k mikrofonu.");
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
    this.activeKey.set('');
    this.tunerStatusText.set('');
    this.isTuned.set(false);
  }

  closeTuner() {
    this.stopListening();
    this.close.emit();
  }

  onBackdropClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('fixed')) {
      this.closeTuner();
    }
  }

  playManualTone(key: string) {
    const targetFreq = STRUNG_FREQUENCIES[key] || 220;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(targetFreq, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  }

  private updateLoop = () => {
    if (!this.isListening() || !this.analyser) return;

    const buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buffer);

    const pitch = this.autoCorrelate(buffer, this.audioContext!.sampleRate);

    if (pitch !== -1 && pitch > 50 && pitch < 500) {
      this.detectedPitch.set(pitch);

      let targetKey: string;

      if (this.isAutoMode()) {
        const strings = this.currentStrings();
        let closest = strings[0].key;
        let minDiff = Math.abs(pitch - STRUNG_FREQUENCIES[closest]);

        for (const s of strings) {
          const diff = Math.abs(pitch - STRUNG_FREQUENCIES[s.key]);
          if (diff < minDiff) {
            minDiff = diff;
            closest = s.key;
          }
        }
        targetKey = closest;
        this.activeKey.set(targetKey);
      } else {
        targetKey = this.manualKey() || this.currentStrings()[0].key;
      }

      const targetFreq = STRUNG_FREQUENCIES[targetKey];
      const diffHz = pitch - targetFreq;

      if (Math.abs(diffHz) < 1.0) {
        this.isTuned.set(true);
        this.pointerPosition.set(50);
        this.tunerStatusText.set('Perfektní naladění ✓');
      } else {
        this.isTuned.set(false);
        const cents = Math.round(diffHz * 4);
        this.tunerStatusText.set(cents > 0 ? `+${cents} centů` : `${cents} centů`);

        let pct = 50 + cents;
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
