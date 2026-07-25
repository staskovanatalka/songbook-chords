import { Component, input, signal, computed, inject, output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChordDiagramComponent } from './chord-diagram.component';
import { Song } from '../../core/models/song.model';
import { SongService } from '../../core/services/song.service';
import html2pdf from 'html2pdf.js';
import { StrummingPatternComponent } from './strumming-pattern.component';


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
        (mouseover)="onContentHover($event)"
        (mouseleave)="onContentMouseLeave()"
      >

        <!-- HOVER TOOLTIP S DIAGRAMEM AKORDU -->
        @if (activeChord(); as chord) {
          <div
            class="fixed z-[9999] pointer-events-auto transition-all duration-75"
            [style.left.px]="chord.x"
            [style.top.px]="chord.y - 8"
            style="transform: translate(-50%, -100%);"
            (mouseenter)="onTooltipMouseEnter()"
            (mouseleave)="onContentMouseLeave()"
          >
            <app-chord-diagram
              [chordName]="chord.name"
            ></app-chord-diagram>
          </div>
        }

        <!-- LOKÁLNÍ HUDEBNÍ LIŠTA -->
        <div class="flex items-center justify-between mb-2 gap-2 px-1 flex-nowrap w-full min-w-0 overflow-visible">

          <!-- KONTROLER TRANSPOZICE -->
          <div class="inline-flex rounded border border-[var(--primary-color)] font-mono text-xs shadow-sm shrink-0">

            <!-- Tlačítko -1 -->
            <button
              type="button"
              (click)="transpose(-1)"
              class="px-2.5 py-1 bg-[var(--primary-color-alpha)] text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white font-medium transition-colors cursor-pointer rounded-l shrink-0"
            >-1</button>

            <!-- 12 TLAČÍTEK TÓNIN (Řízeno čistě přes CSS @container) -->
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

            <!-- Kompaktní číselník transpozice -->
            <div class="scale-picker-compact items-center px-3 font-bold bg-[var(--bg-card)] text-[var(--primary-color)] border-l border-[var(--primary-color)] shrink-0">
              {{ transposeOffset() > 0 ? '+' + transposeOffset() : transposeOffset() }}
            </div>

            <!-- Tlačítko +1 -->
            <button
              type="button"
              (click)="transpose(1)"
              class="px-2.5 py-1 bg-[var(--primary-color-alpha)] text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white font-medium transition-colors cursor-pointer border-l border-[var(--primary-color)] rounded-r shrink-0"
            >+1</button>
          </div>

          <!-- Ovládání písma a sloupců (Pravá skupina tlačítek) -->
          <div class="flex items-center gap-1.5 ml-auto font-mono shrink-0 relative">
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

            <!-- TLAČÍTKO SE TŘEMI TECKAMI & DROPDOWN -->
            <div class="relative song-menu-container z-[100]">
              <button
                type="button"
                (click)="toggleMenu($event)"
                class="h-[31px] w-8 flex items-center justify-center rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                title="Další možnosti"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="pointer-events-none">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>

              <!-- ROZEVÍRACÍ MENU -->
              @if (isMenuOpen()) {
                <div class="absolute right-0 top-full mt-1 w-44 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-2xl py-1 z-[9999] text-xs font-sans">

                  <!-- UPRAVIT -->
                  <button
                    type="button"
                    (click)="onEdit()"
                    class="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[var(--bg-hover)] text-[var(--text-main)] cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Upravit písničku
                  </button>

                  <!-- TISK -->
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

                  <!-- SMAZAT -->
                  <button
                    type="button"
                    (click)="onDelete()"
                    class="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[var(--bg-hover)] text-red-500 font-medium cursor-pointer"
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

        <!-- KARTA PÍSNIČKY -->
        <div class="printable-song-card bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-5 mb-4 shadow-sm">
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
              <div
                class="relative inline-flex items-center gap-1 cursor-help"
                (mouseenter)="isStrummingHovered.set(true)"
                (mouseleave)="isStrummingHovered.set(false)"
              >
                <span class="text-[var(--text-muted)] opacity-75">Rytmus:</span>
                <strong class="text-[var(--primary-color)]">{{ currentSong.strumming }}</strong>

                <!-- POPUP SE ŠIPKAMI RYTMU -->
                @if (isStrummingHovered()) {
                  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[9999] pointer-events-none">
                    <app-strumming-pattern [pattern]="currentSong.strumming"></app-strumming-pattern>
                  </div>
                }
              </div>
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

          <!-- AUTOMATICKÝ PŘEHLED AKORDŮ POD PÍSNIČKOU -->
          @if (uniqueChords().length > 0) {
            <div class="border-t border-[var(--border-color)] pt-4 mt-6 print:pt-2 print:mt-3">
              <h3 class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 font-mono">
                Použité akordy ({{ uniqueChords().length }})
              </h3>
              <div class="flex flex-wrap gap-4 items-center">
                @for (chordName of uniqueChords(); track chordName) {
                  <div class="flex flex-col items-center bg-[var(--bg-body)] p-2 rounded border border-[var(--border-color)] shadow-sm print:shadow-none print:border-none">
                    <app-chord-diagram [chordName]="chordName"></app-chord-diagram>
                  </div>
                }
              </div>
            </div>
          }

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
  songService = inject(SongService);

  song = input<Song | null>(null);
  notation = input<'CZ' | 'EN'>('CZ');
  instrument = input<'GTR' | 'UKU'>('GTR');

  transposeOffset = signal<number>(0);
  fontSize = signal<number>(18);
  isTwoColumns = signal<boolean>(false);
  isStrummingHovered = signal<boolean>(false);

  activeChord = signal<HoveredChord | null>(null);
  private hideTimeout: any = null;

  scaleCZ = ["C", "C#", "D", "Es", "E", "F", "F#", "G", "As", "A", "B", "H"];
  scaleEN = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

  noteMap: { [key: string]: number } = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5,
    "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "B": 10, "Bb": 10, "H": 11
  };

  isMenuOpen = signal<boolean>(false);

  // Události pro rodičovskou komponentu
  editSong = output<void>();
  printSong = output<void>();
  deleteSong = output<void>();

  scaleNotes = computed(() => {
    return this.notation() === 'CZ' ? this.scaleCZ : this.scaleEN;
  });
  // Dynamicky vybere všechny unikátní akordy použité v aktuální písničce
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
    this.fontSize.update(s => Math.min(Math.max(s + amount, 12), 28));
  }

  toggleTwoColumns() {
    this.isTwoColumns.update(v => !v);
  }

  onContentHover(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target && target.classList.contains('chord')) {
      clearTimeout(this.hideTimeout);
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

  onTooltipMouseEnter() {
    clearTimeout(this.hideTimeout);
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

    // 1. Najdeme element karty písničky
    const element = document.querySelector('.printable-song-card') as HTMLElement;
    if (!element) return;

    // 2. Připravíme název souboru: NazevPisnicky_Autor.pdf (očistíme od mezer a diakritiky)
    const formatName = (str: string) =>
      str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Odstraní diakritiku
        .replace(/\s+/g, '_')           // Nahradí mezery podtržítkem
        .replace(/[^a-zA-Z0-9_]/g, '');  // Odstraní speciální znaky

    const fileName = `${formatName(current.title)}_${formatName(current.artist)}.pdf`;

    // 3. Konfigurace generování PDF
    const options = {
      margin: 10,
      filename: fileName,
      image: { type: 'jpeg' as const, quality: 0.98 }, // <- Přidáno 'as const'
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    // 4. Vygenerujeme a stáhneme PDF
    html2pdf().set(options).from(element).save();

    this.printSong.emit();
  }

  onDelete() {
    this.isMenuOpen.set(false);
    this.deleteSong.emit();
  }

  onContentMouseLeave() {
    this.hideTimeout = setTimeout(() => {
      this.activeChord.set(null);
    }, 250);
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
            return `<span class="chord font-bold text-[var(--primary-color)] cursor-pointer hover:underline">${transposed}</span>`;
          });
          return `<div class="font-mono my-1">${replaced}</div>`;
        }

        return line.replace(/(\S*\[.*?\]\S*)/g, (fullWord) => {
          const processedWord = fullWord.replace(/\[(.*?)\]([A-Za-zá-žÁ-Ž0-9#b\+\-,]*)/g, (_, chord: string, subWord: string) => {
            const transposed = this.transposeChord(chord, semitones, notation);
            const safeWord = subWord || "";
            return `<span class="word-with-chord"><span class="chord cursor-pointer hover:underline">${transposed}</span>${safeWord}</span>`;
          });

          return `<span class="chord-word-wrapper">${processedWord}</span>`;
        });
      });

      return `<div class="mb-4">${processedLines.join('\n')}</div>`;
    });

    return processedVerses.join('\n');
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

    let newBaseNote = notation === "CZ" ? this.scaleCZ[newIndex] : this.scaleEN[newIndex];
    const minorSuffix = isMinor ? (notation === "CZ" ? "mi" : "m") : "";

    return newBaseNote + minorSuffix + rest;
  }
}
