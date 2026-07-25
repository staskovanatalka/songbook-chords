import { Component, input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Song } from '../../core/models/song.model';

@Component({
  selector: 'app-song-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (song(); as currentSong) {
      <div class="w-full">

        <!-- LOKÁLNÍ LIŠTA -->
        <div class="flex items-center justify-between mb-2 flex-wrap gap-2 px-1">

          <!-- Transpozice -->
          <div class="inline-flex rounded border border-[var(--primary-color)] overflow-hidden font-mono text-xs">
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

          <!-- Ovládání písma a sloupců -->
          <div class="flex items-center gap-1.5 ml-auto font-mono">
            <button
              type="button"
              (click)="toggleTwoColumns()"
              [class.bg-[var(--bg-hover)]]="isTwoColumns()"
              class="h-[31px] px-2 flex items-center justify-center rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
              title="Přepnout sloupce"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                <line x1="12" y1="3" x2="12" y2="21"></line>
              </svg>
            </button>

            <button
              type="button"
              (click)="changeFontSize(-1)"
              class="h-[31px] px-2 flex items-center justify-center rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors text-xs font-medium cursor-pointer"
            >A-</button>

            <button
              type="button"
              (click)="changeFontSize(1)"
              class="h-[31px] px-2 flex items-center justify-center rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors text-xs font-medium cursor-pointer"
            >A+</button>
          </div>
        </div>

        <!-- KARTA PÍSNIČKY -->
        <div class="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-5 mb-4 shadow-sm">

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
          <div class="flex gap-4 items-center mb-4 font-mono text-xs">
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
          <pre
            id="song-content"
            class="my-3 text-[var(--text-main)]"
            [class.columns-2]="isTwoColumns()"
            [class.gap-10]="isTwoColumns()"
            [style.fontSize.px]="fontSize()"
            [innerHTML]="parsedSongHtml()"
          ></pre>

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

  song = input<Song | null>(null);

  // DŮLEŽITÉ: Notaci přebíráme přímo jako Input!
  notation = input<'CZ' | 'EN'>('CZ');

  transposeOffset = signal<number>(0);
  fontSize = signal<number>(18);
  isTwoColumns = signal<boolean>(false);

  parsedSongHtml = computed<SafeHtml>(() => {
    const currentSong = this.song();
    const currentNotation = this.notation(); // Sleduje přímo předaný Input
    const semitones = this.transposeOffset();

    if (!currentSong) return '';

    const rawHtml = this.renderSongText(currentSong.text, semitones, currentNotation);
    return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  });

  transpose(amount: number) {
    this.transposeOffset.update(v => v + amount);
  }

  changeFontSize(amount: number) {
    this.fontSize.update(s => Math.min(Math.max(s + amount, 12), 28));
  }

  toggleTwoColumns() {
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
          return `<div class="font-mono my-1">${replaced}</div>`;
        }

        return line.replace(/(\S*\[.*?\]\S*)/g, (fullWord) => {
          const processedWord = fullWord.replace(/\[(.*?)\]([A-Za-zá-žÁ-Ž0-9#b\+\-,]*)/g, (_, chord: string, subWord: string) => {
            const transposed = this.transposeChord(chord, semitones, notation);
            const safeWord = subWord || "";
            return `<span class="word-with-chord"><span class="chord">${transposed}</span>${safeWord}</span>`;
          });

          return `<span class="chord-word-wrapper">${processedWord}</span>`;
        });
      });

      return `<div class="mb-4">${processedLines.join('\n')}</div>`;
    });

    return processedVerses.join('\n');
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
