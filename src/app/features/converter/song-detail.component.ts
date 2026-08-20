import {
  Component,
  input,
  signal,
  computed,
  inject,
  output,
  HostListener,
  ElementRef,
  effect,
  viewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChordDiagramComponent } from '../../shared/components/chord-diagram.component';
import { StrummingPatternComponent } from '../../shared/components/strumming-pattern.component';
import { Song } from '../../core/models/song.model';
import { SongService } from '../../core/services/song.service';
import html2pdf from 'html2pdf.js';

interface HoveredChord {
  name: string;
  x: number;
  y: number;
}

@Component({
  selector: 'app-song-detail',
  standalone: true,
  imports: [CommonModule, ChordDiagramComponent, StrummingPatternComponent],
  template: `
    @if (song(); as currentSong) {
      <div
        class="w-full relative overflow-visible toolbar-container"
        [class.p-4]="songService.isFullscreen()"
        [class.md:p-8]="songService.isFullscreen()"
        [class.h-screen]="songService.isFullscreen()"
        [class.flex]="songService.isFullscreen()"
        [class.flex-col]="songService.isFullscreen()"
        (mouseover)="onContentHover($event)"
        (mouseout)="onContentMouseOut($event)"
      >

        <!-- HOVER TOOLTIP S DIAGRAMEM AKORDU -->
        @if (activeChord(); as chord) {
          <div
            class="fixed z-[99999] pointer-events-none transition-opacity duration-75"
            [style.left.px]="chord.x"
            [style.top.px]="chord.y - 8"
            style="transform: translate(-50%, -100%);"
          >
            <app-chord-diagram
              [chordName]="chord.name"
            ></app-chord-diagram>
          </div>
        }

        <!-- PŘI FULLSCREENU: Tlačítko pro návrat v pravém dolním rohu -->
        @if (songService.isFullscreen()) {
          <button
            type="button"
            (click)="toggleFullscreen()"
            class="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer shadow-lg text-xs font-mono select-none opacity-80 hover:opacity-100"
            title="Ukončit režim celé obrazovky (Esc)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
            </svg>
            <span>Esc</span>
          </button>
        }

        <!-- BĚŽNÁ HUDEBNÍ LIŠTA -->
        @if (!songService.isFullscreen()) {
          <div class="flex items-center justify-between mb-2 gap-2 px-1 flex-nowrap w-full min-w-0 overflow-visible">

            <!-- LEVÁ ČÁST: KONTROLER TRANSPOZICE -->
            <div class="inline-flex rounded-lg border border-[var(--primary-color)] font-mono text-xs shadow-sm shrink-0 overflow-hidden">
              <button
                type="button"
                (click)="transpose(-1)"
                class="px-2.5 py-1 bg-[var(--primary-color-alpha)] text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white font-medium transition-colors cursor-pointer shrink-0"
              >-1</button>

              <div class="scale-picker-full items-center bg-[var(--bg-card)] shrink-0">
                @for (note of scaleNotes(); track note; let i = $index) {
                  <button
                    type="button"
                    (click)="selectKeyIndex(i)"
                    [class.bg-[var(--primary-color)]]="i === currentNoteIndex()"
                    [class.text-white]="i === currentNoteIndex()"
                    [class.text-[var(--primary-color)]]="i !== currentNoteIndex()"
                    class="px-2 py-1 hover:bg-[var(--primary-color-alpha)] transition-colors text-center font-bold cursor-pointer border-l border-[var(--primary-color)] opacity-90 hover:opacity-100 shrink-0"
                  >{{ note }}</button>
                }
              </div>

              <div class="scale-picker-compact items-center px-3 font-bold bg-[var(--bg-card)] text-[var(--primary-color)] border-l border-[var(--primary-color)] shrink-0">
                {{ transposeOffset() > 0 ? '+' + transposeOffset() : transposeOffset() }}
              </div>

              <button
                type="button"
                (click)="transpose(1)"
                class="px-2.5 py-1 bg-[var(--primary-color-alpha)] text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white font-medium transition-colors cursor-pointer border-l border-[var(--primary-color)] shrink-0"
              >+1</button>
            </div>

            <!-- PRAVÁ SKUPINA TLAČÍTEK -->
            <div class="flex items-center gap-1.5 ml-auto font-mono shrink-0 relative">

              <!-- TLAČÍTKO FULLSCREEN -->
              <button
                type="button"
                (click)="toggleFullscreen()"
                class="btn-icon"
                title="Režim celé obrazovky"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </svg>
              </button>

              <!-- Tlačítko sloupce -->
              <button
                type="button"
                (click)="toggleTwoColumns()"
                class="btn-icon"
                [class.btn-active]="isTwoColumns()"
                title="Přepnout sloupce"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                  @if (isTwoColumns()) {
                    <line x1="12" y1="3" x2="12" y2="21"></line>
                  }
                </svg>
              </button>

              <button
                type="button"
                (click)="changeFontSize(-1)"
                class="btn-text min-w-[34px]"
                title="Zmenšit písmo"
              >A-</button>

              <button
                type="button"
                (click)="changeFontSize(1)"
                class="btn-text min-w-[34px]"
                title="Zvětšit písmo"
              >A+</button>

              <!-- TŘI TEČKY & DROPDOWN -->
              <div class="relative song-menu-container z-30">
                <button
                  type="button"
                  (click)="toggleMenu($event)"
                  class="btn-icon"
                  [class.btn-active]="isMenuOpen()"
                  title="Další možnosti"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="pointer-events-none">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </button>

                @if (isMenuOpen()) {
                  <div class="absolute right-0 top-full mt-1.5 w-44 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl py-1.5 z-[9999] text-xs font-sans">
                    <button
                      type="button"
                      (click)="onEdit()"
                      class="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[var(--bg-hover)] text-[var(--text-main)] cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 2 2h14a2 2 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Upravit písničku
                    </button>

                    <button
                      type="button"
                      (click)="onPrint()"
                      class="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[var(--bg-hover)] text-[var(--text-main)] cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 6 2 18 2 18 9"></polyline>
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                        <rect x="6" y="14" width="12" height="8"></rect>
                      </svg>
                      Tisk
                    </button>

                    <div class="my-1 border-t border-[var(--border-color)]"></div>

                    <button
                      type="button"
                      (click)="onDelete()"
                      class="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[var(--bg-hover)] text-rose-500 font-medium cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      Smazat písničku
                    </button>
                  </div>
                }
              </div>

            </div>
          </div>
        }

        <!-- SAMOTNÁ KARTA S PÍSNIČKOU -->
        <div
          #songCard
          class="printable-song-card transition-all duration-150 flex-1 flex flex-col"
          [class.bg-[var(--bg-card)]]="!songService.isFullscreen()"
          [class.border]="!songService.isFullscreen()"
          [class.border-[var(--border-color)]]="!songService.isFullscreen()"
          [class.rounded-xl]="!songService.isFullscreen()"
          [class.p-5]="!songService.isFullscreen()"
          [class.mb-4]="!songService.isFullscreen()"
          [class.shadow-sm]="!songService.isFullscreen()"
          [class.p-0]="songService.isFullscreen()"
          [class.border-0]="songService.isFullscreen()"
          [class.bg-transparent]="songService.isFullscreen()"
        >
          <!-- HLAVIČKA -->
          <div class="flex justify-between items-center pb-2 mb-2 border-b border-[var(--border-color)] flex-wrap gap-2 shrink-0">
            <h2 class="text-xl md:text-2xl font-bold m-0 text-[var(--text-main)]">
              {{ currentSong.title }}
            </h2>
            <div class="italic text-[var(--primary-color)] font-medium text-base md:text-lg">
              {{ currentSong.artist }}
            </div>
          </div>

          <!-- METADATA -->
          @if (currentSong.capo || currentSong.strumming) {
            <div class="flex gap-4 items-center mb-3 font-mono text-xs shrink-0">
              @if (currentSong.capo) {
                <span class="inline-flex items-center gap-1">
                  <span class="text-[var(--text-muted)] opacity-75">Capo:</span>
                  <strong class="text-[var(--primary-color)]">{{ currentSong.capo }}</strong>
                </span>
              }
              @if (currentSong.strumming) {
                <div
                  class="relative inline-flex items-center gap-1 cursor-help"
                  (mouseenter)="isStrummingHovered.set(true)"
                  (mouseleave)="isStrummingHovered.set(false)"
                >
                  <span class="text-[var(--text-muted)] opacity-75">Rytmus:</span>
                  <strong class="text-[var(--primary-color)]">{{ currentSong.strumming }}</strong>

                  @if (isStrummingHovered()) {
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[9999] pointer-events-none">
                      <app-strumming-pattern [pattern]="currentSong.strumming"></app-strumming-pattern>
                    </div>
                  }
                </div>
              }
            </div>
          }

          <!-- TEXT S AKORDY -->
          <div
            id="song-content"
            class="my-1 text-[var(--text-main)] font-mono transition-all duration-100 flex-1"
            [style.columnCount]="isTwoColumns() ? 2 : 1"
            [style.columnGap]="isTwoColumns() ? '2.5rem' : '0'"
            [style.fontSize.px]="fontSize()"
            [innerHTML]="parsedSongHtml()"
          ></div>

          <!-- AUTOMATICKÝ PŘEHLED AKORDŮ POD PÍSNIČKOU -->
          @if (uniqueChords().length > 0) {
            <div class="border-t border-[var(--border-color)] pt-3 mt-3 shrink-0 print:pt-2 print:mt-2">
              <h3 class="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 font-mono">
                Použité akordy ({{ uniqueChords().length }})
              </h3>
              <div class="flex flex-wrap gap-3 items-center">
                @for (chordName of uniqueChords(); track chordName) {
                  <div class="flex flex-col items-center">
                    <app-chord-diagram
                      [chordName]="chordName"
                      [hasBorder]="false"
                      [scale]="1.15"
                    ></app-chord-diagram>
                  </div>
                }
              </div>
            </div>
          }

          <!-- POZNÁMKY -->
          @if (currentSong.notes && !songService.isFullscreen()) {
            <div class="border-t border-[var(--border-color)] pt-3 mt-3 shrink-0">
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
  songService = inject(SongService);

  songCardEl = viewChild<ElementRef>('songCard');

  song = input<Song | null>(null);
  notation = input<'CZ' | 'EN'>('CZ');
  instrument = input<'GTR' | 'UKU'>('GTR');

  transposeOffset = signal<number>(0);
  fontSize = signal<number>(14);
  isTwoColumns = signal<boolean>(false);
  isStrummingHovered = signal<boolean>(false);

  activeChord = signal<HoveredChord | null>(null);

  scaleCZ = ["C", "C#", "D", "Es", "E", "F", "F#", "G", "As", "A", "B", "H"];
  scaleEN = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

  noteMap: { [key: string]: number } = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5,
    "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "B": 10, "Bb": 10, "H": 11
  };

  isMenuOpen = signal<boolean>(false);

  editSong = output<void>();
  printSong = output<void>();
  deleteSong = output<void>();

  constructor() {
    effect(() => {
      const current = this.song();
      if (current) {
        setTimeout(() => this.autoFitText(), 60);
      }
    });
  }

  scaleNotes = computed(() => {
    return this.notation() === 'CZ' ? this.scaleCZ : this.scaleEN;
  });

  uniqueChords = computed<string[]>(() => {
    const currentSong = this.song();
    if (!currentSong || !currentSong.text) return [];

    const semitones = this.transposeOffset();
    const currentNotation = this.notation();
    const matches = currentSong.text.match(/\[(.*?)\]/g);

    if (!matches) return [];

    const chordsSet = new Set<string>();

    for (const m of matches) {
      const rawChord = m.replace(/[\[\]]/g, '').trim();
      if (rawChord) {
        const transposed = this.transposeChord(rawChord, semitones, currentNotation);
        chordsSet.add(transposed);
      }
    }

    return Array.from(chordsSet);
  });

  originalKeyIndex = computed(() => {
    const currentSong = this.song();
    if (!currentSong) return 0;
    return this.detectOriginalKeyIndex(currentSong.text);
  });

  currentNoteIndex = computed(() => {
    let index = (this.originalKeyIndex() + this.transposeOffset()) % 12;
    if (index < 0) index += 12;
    return index;
  });

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
    this.autoFitText();
  }

  @HostListener('window:keydown.escape')
  onEscape() {
    if (this.songService.isFullscreen()) {
      this.toggleFullscreen();
    }
  }

  toggleFullscreen() {
    this.songService.toggleFullscreen();
    setTimeout(() => {
      this.autoFitText();
    }, 100);
  }

  autoFitText() {
    const cardEl = this.songCardEl()?.nativeElement as HTMLElement;
    const currentSong = this.song();
    if (!cardEl || !currentSong) return;

    const windowHeight = window.innerHeight;
    const cardWidth = cardEl.clientWidth;

    const verses = currentSong.text.trim().split(/\n\s*\n/);
    const verseCount = verses.length;

    const canFitTwoCols = cardWidth >= 620 && verseCount >= 2;
    this.isTwoColumns.set(canFitTwoCols);

    let currentFont = this.songService.isFullscreen()
      ? (canFitTwoCols ? 14 : 15)
      : (canFitTwoCols ? 13.5 : 14.5);
    this.fontSize.set(currentFont);

    requestAnimationFrame(() => {
      const cardRect = cardEl.getBoundingClientRect();
      const availableHeight = Math.max(windowHeight - cardRect.top - 24, 200);

      const adjust = () => {
        if (cardEl.scrollHeight > availableHeight && currentFont > 8.5) {
          currentFont -= 0.4;
          this.fontSize.set(currentFont);
          requestAnimationFrame(adjust);
        }
      };

      requestAnimationFrame(adjust);
    });
  }

  transpose(amount: number) {
    this.transposeOffset.update(v => v + amount);
  }

  selectKeyIndex(targetIndex: number) {
    let diff = targetIndex - this.originalKeyIndex();
    if (diff < -6) diff += 12;
    if (diff > 6) diff -= 12;
    this.transposeOffset.set(diff);
  }

  changeFontSize(amount: number) {
    this.fontSize.update(s => Math.min(Math.max(s + amount, 8), 28));
  }

  toggleTwoColumns() {
    this.isTwoColumns.update(v => !v);
  }

  onContentHover(event: MouseEvent) {
    const target = (event.target as HTMLElement)?.closest('.chord') as HTMLElement;
    if (target) {
      const rect = target.getBoundingClientRect();
      const chordName = target.textContent?.trim() || '';

      if (chordName) {
        this.activeChord.set({
          name: chordName,
          x: rect.left + rect.width / 2,
          y: rect.top
        });
      }
    }
  }

  onContentMouseOut(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target && target.classList.contains('chord')) {
      this.activeChord.set(null);
    }
  }

  toggleMenu(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.isMenuOpen.update(v => !v);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.song-menu-container')) {
      this.isMenuOpen.set(false);
    }
  }

  onEdit() {
    this.isMenuOpen.set(false);
    this.editSong.emit();
  }

  onPrint() {
    this.isMenuOpen.set(false);

    const current = this.song();
    if (!current) return;

    const element = document.querySelector('.printable-song-card') as HTMLElement;
    if (!element) return;

    const formatName = (str: string) =>
      str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '');

    const fileName = `${formatName(current.title)}_${formatName(current.artist)}.pdf`;

    const options = {
      margin: 10,
      filename: fileName,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().set(options).from(element).save();

    this.printSong.emit();
  }

  onDelete() {
    this.isMenuOpen.set(false);
    this.deleteSong.emit();
  }

  private detectOriginalKeyIndex(text: string): number {
    const matches = text.match(/\[(.*?)\]/g);
    if (!matches || matches.length === 0) return 0;

    for (const m of matches) {
      let chord = m.replace(/[\[\]]/g, '').trim();
      chord = chord.replace(/mi/g, 'm').replace(/m($|(?![a-z]))/g, '');
      const baseMatch = chord.match(/^([A-H]b?|A#|C#|D#|F#|G#)/i);
      if (baseMatch) {
        let baseNote = baseMatch[1].charAt(0).toUpperCase() + baseMatch[1].slice(1);
        if (this.noteMap[baseNote] !== undefined) {
          return this.noteMap[baseNote];
        }
      }
    }
    return 0;
  }

  private renderSongText(text: string, semitones: number, notation: 'CZ' | 'EN'): string {
    // Normalizace: pokud je za samostatným "R:" hned číslo sloky (např. "3."), oddělíme je prázdným řádkem
    const normalizedText = text.replace(/(^[ \t]*(?:R\d*:|Ref\.:|Ref:|Refrén:|Chorus:)[ \t]*)\n([ \t]*\d+\.)/gim, '$1\n\n$2');
    const rawVerses = normalizedText.split(/\n\s*\n/);

    const processedVerses = rawVerses.map(verse => {
      const trimmedVerse = verse.trim();

      // Detekce refrénu (i samotného R:)
      const isChorus = /^(R\d*:|Ref\.:|Ref:|Refrén:|Chorus:)/i.test(trimmedVerse) && !/^\s*\d+\./m.test(trimmedVerse);

      const lines = verse.split('\n');

      const processedLines = lines.map(line => {

        if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
          const innerContent = line.trim().slice(1, -1);

          const renderedLine = innerContent.replace(/\[(.*?)\]/g, (_, chord: string) => {
            const transposed = this.transposeChord(chord, semitones, notation);
            return `<span class="chord font-bold cursor-pointer hover:underline">${transposed}</span>`;
          });

          return `<div class="line-wrapper chord-line font-mono select-none">${renderedLine}</div>`;
        }

        const renderedLine = line.replace(/(\S*(?:\[.*?\]|\{\|.*?\|\})\S*)/g, (fullWord) => {
          const processedWord = fullWord.replace(/(?:\[(.*?)\]|\{\|(.*?)\|\})([^\s\[\{]*)/g, (_, chord: string, symbol: string, subWord: string) => {
            const safeWord = subWord.length > 0 ? subWord : "&nbsp;";

            if (chord) {
              const transposed = this.transposeChord(chord, semitones, notation);
              return `<span class="word-with-chord"><span class="chord cursor-pointer hover:underline">${transposed}</span>${safeWord}</span>`;
            } else if (symbol) {
              return `<span class="word-with-chord"><span class="symbol-above text-[var(--text-main)] font-normal">${symbol}</span>${safeWord}</span>`;
            }

            return subWord;
          });

          return `<span class="chord-word-wrapper">${processedWord}</span>`;
        });

        return `<div class="line-wrapper text-line font-mono whitespace-nowrap">${renderedLine || '&nbsp;'}</div>`;
      });

// Prodloužená zaoblená čárka s minimální výškou
      const chorusIndicator = isChorus
        ? '<div class="absolute left-0 top-0 bottom-0 min-h-[1.5em] w-[3px] rounded-full bg-[var(--primary-color)] opacity-50 pointer-events-none"></div>'
        : '';

      const paddingClass = isChorus ? 'pl-3.5' : '';

      return `<div class="verse-block relative mb-3 block w-full ${paddingClass}" style="break-inside: avoid-column; -webkit-column-break-inside: avoid; page-break-inside: avoid; display: inline-block;">${chorusIndicator}${processedLines.join('')}</div>`;
    });

    return processedVerses.join('');
  }

  private transposeChord(chord: string, semitones: number, notation: 'CZ' | 'EN'): string {
    let clean = chord.trim();
    const isMinor = /([A-H][b#]?)(mi|m)($|(?![a-z]))/i.test(clean);

    clean = clean.replace(/mi/gi, '').replace(/m($|(?![a-z]))/gi, '');

    const match = clean.match(/^([A-H]b?|A#|C#|D#|F#|G#)(.*)/i);
    if (!match) return chord;

    let baseNote = match[1];
    const rest = match[2];
    baseNote = baseNote.charAt(0).toUpperCase() + baseNote.slice(1);

    let index = this.noteMap[baseNote] !== undefined ? this.noteMap[baseNote] : -1;
    if (index === -1) return chord;

    let newIndex = (index + semitones) % 12;
    if (newIndex < 0) newIndex += 12;

    let newBaseNote = notation === "CZ" ? (this.scaleCZ)[newIndex] : (this.scaleEN)[newIndex];
    const minorSuffix = isMinor ? (notation === "CZ" ? "mi" : "m") : "";

    return newBaseNote + minorSuffix + rest;
  }
}
