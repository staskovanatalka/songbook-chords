import {
  Component,
  input,
  signal,
  computed,
  inject,
  HostListener,
  ElementRef,
  effect,
  viewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Song } from '../../core/models/song.model';

@Component({
  selector: 'app-song-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (song(); as currentSong) {
      <div #containerEl class="w-full">

        <!-- LOKÁLNÍ LIŠTA S TLAČÍTKY -->
        <div class="flex items-center justify-between mb-3 gap-2 px-1 w-full min-w-0 flex-nowrap">

          <!-- Transpozice (-1 / +0 / +1) -->
          <div class="inline-flex rounded border border-[var(--primary-color)] overflow-hidden font-mono text-xs shadow-sm shrink-0">
            <button
              type="button"
              (click)="transpose(-1)"
              class="px-2.5 py-1 bg-[var(--primary-color-alpha)] text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white font-medium transition-colors cursor-pointer"
            >-1</button>
            <div class="flex items-center px-3 font-bold bg-[var(--bg-card)] text-[var(--primary-color)] border-x border-[var(--primary-color)]">
              {{ transposeOffset() > 0 ? '+' + transposeOffset() : transposeOffset() }}
            </div>
            <button
              type="button"
              (click)="transpose(1)"
              class="px-2.5 py-1 bg-[var(--primary-color-alpha)] text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white font-medium transition-colors cursor-pointer"
            >+1</button>
          </div>

          <!-- Ovládání zobrazení (FIT, Sloupce, A-, A+) -->
          <div class="flex items-center gap-1.5 ml-auto font-mono shrink-0">
            <!-- TLAČÍTKO AUTO-FIT -->
            <button
              type="button"
              (click)="toggleAutoFit()"
              [class.bg-[var(--primary-color)]]="isAutoFitEnabled()"
              [class.text-white]="isAutoFitEnabled()"
              [class.border-[var(--primary-color)]]="isAutoFitEnabled()"
              class="h-[31px] px-2.5 flex items-center justify-center gap-1.5 rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] hover:border-[var(--primary-color)] transition-all text-xs font-bold cursor-pointer shadow-sm"
              title="Automaticky přizpůsobit text obrazovce"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="4 14 10 14 10 20"></polyline>
                <polyline points="20 10 14 10 14 4"></polyline>
                <line x1="14" y1="10" x2="21" y2="3"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
              <span>FIT</span>
            </button>

            <!-- Tlačítko 2 sloupce -->
            <button
              type="button"
              (click)="toggleTwoColumns()"
              [class.bg-[var(--primary-color-alpha)]]="isTwoColumns()"
              [class.text-[var(--primary-color)]]="isTwoColumns()"
              [class.border-[var(--primary-color)]]="isTwoColumns()"
              class="h-[31px] px-2 flex items-center justify-center rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
              title="Přepnout 2 sloupce"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                @if (isTwoColumns()) {
                  <line x1="12" y1="3" x2="12" y2="21"></line>
                }
              </svg>
            </button>

            <!-- Velikost písma A- / A+ -->
            <button
              type="button"
              (click)="changeFontSize(-1)"
              class="h-[31px] px-2 flex items-center justify-center rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors text-xs font-medium cursor-pointer"
              title="Zmenšit písmo"
            >A-</button>

            <button
              type="button"
              (click)="changeFontSize(1)"
              class="h-[31px] px-2 flex items-center justify-center rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors text-xs font-medium cursor-pointer"
              title="Zvětšit písmo"
            >A+</button>
          </div>
        </div>

        <!-- KARTA PÍSNIČKY -->
        <div
          #songCard
          class="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-5 mb-4 shadow-sm"
        >
          <!-- HLAVIČKA -->
          <div class="flex justify-between items-center pb-2 mb-2 border-b border-[var(--border-color)] flex-wrap gap-2">
            <h2 class="text-xl md:text-2xl font-bold m-0 text-[var(--text-main)]">
              {{ currentSong.title }}
            </h2>
            <div class="italic text-[var(--primary-color)] font-medium">
              {{ currentSong.artist }}
            </div>
          </div>

          <!-- METADATA -->
          <div class="flex gap-4 items-center mb-3 font-mono text-xs">
            @if (currentSong.capo) {
              <span class="inline-flex items-center gap-1">
                <span class="text-[var(--text-muted)] opacity-75">Capo:</span>
                <strong class="text-[var(--primary-color)]">{{ currentSong.capo }}</strong>
              </span>
            }
            @if (currentSong.strumming) {
              <span class="inline-flex items-center gap-1">
                <span class="text-[var(--text-muted)] opacity-75">Rytmus:</span>
                <strong class="text-[var(--primary-color)]">{{ currentSong.strumming }}</strong>
              </span>
            }
          </div>

          <!-- TEXT S AKORDY -->
          <div
            id="song-content"
            class="my-2 text-[var(--text-main)] font-mono transition-all duration-150"
            [style.columnCount]="isTwoColumns() ? 2 : 1"
            [style.columnGap]="isTwoColumns() ? '2.5rem' : '0'"
            [style.fontSize.px]="fontSize()"
            [innerHTML]="parsedSongHtml()"
          ></div>

          <!-- POZNÁMKY -->
          @if (currentSong.notes) {
            <div class="border-t border-[var(--border-color)] pt-3 mt-4">
              <h6 class="uppercase text-[var(--text-muted)] text-[10px] font-bold tracking-wider mb-1">Moje Poznámky</h6>
              <div class="italic text-sm text-[var(--text-muted)]">{{ currentSong.notes }}</div>
            </div>
          }

        </div>
      </div>
    } @else {
      <div class="flex flex-col items-center justify-center py-20 text-center text-[var(--text-muted)]">
        <h3 class="text-lg font-medium text-[var(--text-main)]">Vyberte písničku ze seznamu</h3>
        <p class="text-sm opacity-75">Nebo přidejte novou pomocí tlačítka + v horní liště.</p>
      </div>
    }
  `
})
export class SongDetailComponent {
  sanitizer = inject(DomSanitizer);

  songCardEl = viewChild<ElementRef>('songCard');
  containerEl = viewChild<ElementRef>('containerEl');

  song = input<Song | null>(null);
  notation = input<'CZ' | 'EN'>('CZ');

  transposeOffset = signal<number>(0);
  fontSize = signal<number>(15);
  isTwoColumns = signal<boolean>(false);
  isAutoFitEnabled = signal<boolean>(true);

  constructor() {
    effect(() => {
      const current = this.song();
      if (current && this.isAutoFitEnabled()) {
        setTimeout(() => this.calculateAutoFit(), 60);
      }
    });
  }

  parsedSongHtml = computed<SafeHtml>(() => {
    const currentSong = this.song();
    const currentNotation = this.notation();
    const semitones = this.transposeOffset();

    if (!currentSong) return '';

    const rawHtml = this.renderSongText(currentSong.text, semitones, currentNotation);
    return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  });

  @HostListener('window:resize')
  onResize() {
    if (this.isAutoFitEnabled()) {
      this.calculateAutoFit();
    }
  }

  toggleAutoFit() {
    this.isAutoFitEnabled.update(v => !v);
    if (this.isAutoFitEnabled()) {
      this.calculateAutoFit();
    }
  }

  calculateAutoFit() {
    const cardEl = this.songCardEl()?.nativeElement as HTMLElement;
    const currentSong = this.song();
    if (!cardEl || !currentSong) return;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // 1. Dva sloupce pro širší displeje s více slokami
    const verseCount = currentSong.text.split(/\n\s*\n/).length;
    const shouldTwoCols = windowWidth >= 860 && verseCount >= 4;
    this.isTwoColumns.set(shouldTwoCols);

    // 2. Výpočet dostupné výšky k dolnímu okraji viewportu
    const cardRect = cardEl.getBoundingClientRect();
    const availableHeight = Math.max(windowHeight - cardRect.top - 40, 250);

    // 3. Postupné přizpůsobení velikosti fontu (16px -> 11px)
    let currentFont = 16;
    this.fontSize.set(currentFont);

    setTimeout(() => {
      while (cardEl.scrollHeight > availableHeight && currentFont > 11) {
        currentFont -= 0.5;
        this.fontSize.set(currentFont);
      }
    }, 15);
  }

  transpose(amount: number) {
    this.transposeOffset.update(v => v + amount);
  }

  changeFontSize(amount: number) {
    this.isAutoFitEnabled.set(false);
    this.fontSize.update(s => Math.min(Math.max(s + amount, 10), 28));
  }

  toggleTwoColumns() {
    this.isAutoFitEnabled.set(false);
    this.isTwoColumns.update(v => !v);
  }

  private renderSongText(text: string, semitones: number, notation: 'CZ' | 'EN'): string {
    const rawVerses = text.split(/\n\s*\n/);

    const processedVerses = rawVerses.map(verse => {
      const lines = verse.split('\n');
      const processedLines = lines.map(line => {

        if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
          const innerContent = line.trim().slice(1, -1);
          const replaced = innerContent.replace(/\[(.*?)\]|([A-H][A-Za-z0-9#\+\-\/]*)/g, (match, inBrackets, standalone) => {
            const chord = inBrackets || standalone;
            if (!chord) return match;
            const transposed = this.transposeChord(chord, semitones, notation);
            return `<span class="chord font-bold text-[var(--primary-color)]">${transposed}</span>`;
          });
          return `<div class="font-mono my-0.5 leading-relaxed">${replaced}</div>`;
        }

        const processedWord = line.replace(/(\S*\[.*?\]\S*)/g, (fullWord) => {
          return fullWord.replace(/\[(.*?)\]([A-Za-zá-žÁ-Ž0-9#b\+\-,]*)/g, (_, chord: string, subWord: string) => {
            const transposed = this.transposeChord(chord, semitones, notation);
            const safeWord = subWord || "";
            return `<span class="word-with-chord inline-block"><span class="chord block font-bold text-[var(--primary-color)] leading-tight select-none">${transposed}</span>${safeWord}</span>`;
          });
        });

        return `<div class="leading-relaxed font-mono">${processedWord || '&nbsp;'}</div>`;
      });

      // style="break-inside: avoid;" zabraňuje rozlomení sloky mezi dva sloupce
      return `<div class="mb-3 block w-full" style="break-inside: avoid; page-break-inside: avoid;">${processedLines.join('')}</div>`;
    });

    return processedVerses.join('');
  }

  private transposeChord(chord: string, semitones: number, notation: 'CZ' | 'EN'): string {
    const scaleCZ = ["C", "C#", "D", "Es", "E", "F", "F#", "G", "As", "A", "B", "H"];
    const scaleEN = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

    const noteMap: { [key: string]: number } = {
      "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5,
      "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "B": 10, "Bb": 10, "H": 11
    };

    let clean = chord.trim();
    const isMinor = /([A-H][b#]?)(mi|m)($|(?![a-z]))/i.test(clean);

    clean = clean.replace(/mi/gi, '').replace(/m($|(?![a-z]))/gi, '');

    const match = clean.match(/^([A-H]b?|A#|C#|D#|F#|G#)(.*)/i);
    if (!match) return chord;

    let baseNote = match[1];
    const rest = match[2];
    baseNote = baseNote.charAt(0).toUpperCase() + baseNote.slice(1);

    let index = noteMap[baseNote] !== undefined ? noteMap[baseNote] : -1;
    if (index === -1) return chord;

    let newIndex = (index + semitones) % 12;
    if (newIndex < 0) newIndex += 12;

    let newBaseNote = notation === "CZ" ? scaleCZ[newIndex] : scaleEN[newIndex];
    const minorSuffix = isMinor ? (notation === "CZ" ? "mi" : "m") : "";

    return newBaseNote + minorSuffix + rest;
  }
}
