import { Component, effect, HostListener, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Song } from '../../core/models/song.model';

export interface NewSongData {
  title: string;
  artist: string;
  capo?: string;
  strumming?: string;
  notes?: string;
  text: string;
  tags?: string[];
}

@Component({
  selector: 'app-song-converter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full max-w-4xl mx-auto">
      <div class="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-5 shadow-sm">

        <div class="pb-3 mb-4 border-b border-[var(--border-color)]">
          <h3 class="text-xl font-bold text-[var(--text-main)] m-0">Převodník a přidání písničky</h3>
          <p class="text-xs text-[var(--text-muted)] m-0 mt-1">Zkopíruj celou písničku z webu (např. pisnicky-akordy.cz) a vlož ji sem.</p>
        </div>

        <!-- FORMULÁŘ -->
        <div class="space-y-4 font-sans">

          <!-- Název a Autor -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-[var(--text-main)] mb-1">Název písničky</label>
              <input
                type="text"
                [(ngModel)]="title"
                placeholder="Např. Anděl"
                class="w-full px-3 py-1.5 text-sm rounded border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-main)] focus:outline-none focus:border-[var(--primary-color)]"
              >
            </div>
            <div>
              <label class="block text-xs font-bold text-[var(--text-main)] mb-1">Autor</label>
              <input
                type="text"
                [(ngModel)]="artist"
                placeholder="Např. Karel Kryl"
                class="w-full px-3 py-1.5 text-sm rounded border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-main)] focus:outline-none focus:border-[var(--primary-color)]"
              >
            </div>
          </div>

          <!-- Capo a Rytmus -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-[var(--text-main)] mb-1">Capo</label>
              <input
                type="text"
                [(ngModel)]="capo"
                placeholder="Např. 2. pražec"
                class="w-full px-3 py-1.5 text-sm rounded border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-main)] focus:outline-none focus:border-[var(--primary-color)]"
              >
            </div>
            <div>
              <label class="block text-xs font-bold text-[var(--text-main)] mb-1">Rytmus</label>
              <input
                type="text"
                [(ngModel)]="strumming"
                placeholder="Např. v v ^ ^ v ^"
                class="w-full px-3 py-1.5 text-sm rounded border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-main)] focus:outline-none focus:border-[var(--primary-color)]"
              >
            </div>
          </div>

          <!-- Poznámky -->
          <div>
            <label class="block text-xs font-bold text-[var(--text-main)] mb-1">Poznámky</label>
            <input
              type="text"
              [(ngModel)]="notes"
              placeholder="Např. Vybrnkávání v mezipřehrávce"
              class="w-full px-3 py-1.5 text-sm rounded border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-main)] focus:outline-none focus:border-[var(--primary-color)]"
            >
          </div>

          <!-- Text z webu -->
          <div>
            <label class="block text-xs font-bold text-[var(--text-main)] mb-1">Text s akordy z webu</label>
            <textarea
              [(ngModel)]="rawText"
              rows="10"
              placeholder="C          G&#10;Zpíval o tom, jak je svět..."
              class="w-full px-3 py-2 text-sm font-mono-custom rounded border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-main)] focus:outline-none focus:border-[var(--primary-color)] leading-relaxed"
            ></textarea>
          </div>

          <!-- SPODNÍ TLAČÍTKA -->
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              (click)="handleConvertAndSave()"
              [disabled]="!title().trim() || !rawText().trim()"
              class="flex-1 py-2 px-4 rounded font-mono-custom font-bold text-sm bg-[var(--primary-color)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
            >
              Uložit
            </button>

            <button
              type="button"
              (click)="cancel.emit()"
              class="px-4 py-2 text-xs font-mono-custom rounded border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
            >
              Zrušit
            </button>
          </div>

        </div>
      </div>
    </div>
  `
})
export class SongConverterComponent {
  songToEdit = input<Song | null>(null);

  title = signal<string>('');
  artist = signal<string>('');
  capo = signal<string>('');
  strumming = signal<string>('');
  notes = signal<string>('');
  rawText = signal<string>('');

  newTagInput = signal<string>('');
  currentTags = signal<string[]>([]);

  saveSong = output<NewSongData>();
  cancel = output<void>();

  constructor() {
    // Reaguje na změnu songToEdit a předvyplní formulář
    effect(() => {
      const song = this.songToEdit();
      if (song) {
        this.title.set(song.title || '');
        this.artist.set(song.artist || '');
        this.capo.set(song.capo || '');
        this.strumming.set(song.strumming || '');
        this.notes.set(song.notes || '');
        this.rawText.set(song.text || '');
        // OPRAVA: Načtení tagů správně přes funkci song.tags
        this.currentTags.set(song.tags ? [...song.tags] : []);
      } else {
        this.resetForm();
      }
    });
  }

  // Odchycení klávesy ESC pro zavření
  @HostListener('window:keydown.escape')
  handleKeyboardEvent() {
    this.cancel.emit();
  }

  addTag() {
    const val = this.newTagInput().trim().toLowerCase().replace(/^#/, '');
    if (val && !this.currentTags().includes(val)) {
      this.currentTags.update(tags => [...tags, val]);
      this.newTagInput.set('');
    }
  }

  removeTag(tagToRemove: string) {
    this.currentTags.update(tags => tags.filter(t => t !== tagToRemove));
  }

  handleConvertAndSave() {
    if (!this.title().trim() || !this.rawText().trim()) return;

    const convertedText = this.convertRawText(this.rawText());

    this.saveSong.emit({
      title: this.title().trim(),
      artist: this.artist().trim() || 'Neznámý autor',
      capo: this.capo().trim(),
      strumming: this.strumming().trim(),
      notes: this.notes().trim(),
      text: convertedText,
      tags: this.currentTags() // OPRAVA: Posíláme nastavené tagy při uložení
    });

    this.resetForm();
  }

  private resetForm() {
    this.title.set('');
    this.artist.set('');
    this.capo.set('');
    this.strumming.set('');
    this.notes.set('');
    this.rawText.set('');
    this.currentTags.set([]);
    this.newTagInput.set('');
  }

  private convertRawText(raw: string): string {
    const lines = raw.split("\n");
    const resultLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const currentLine = lines[i];

      if (this.isChordLine(currentLine)) {
        const nextLine = lines[i + 1] || "";

        // 1. Samostatný akordový řádek / předehra (bez textu pod ním)
        if (!nextLine.trim() || this.isChordLine(nextLine)) {
          const chordRegex = /\b[A-H](?:b|#)?(?:m|maj|mi|ma|dim|aug|add|sus)?\d*(?:\/[A-H](?:b|#)?)?\b/g;
          const formattedLine = currentLine.replace(chordRegex, (match) => `[${match}]`);
          resultLines.push(`{${formattedLine}}`);
          continue;
        }

        // 2. Proplétání do textu
        const prefixMatch = nextLine.match(/^(\s*(?:\d+\.|\w+\:|[A-Z]\.|R\:|Ref\:)\s*)/i);
        const prefix = prefixMatch ? prefixMatch[1] : "";
        const cleanNextLine = nextLine.slice(prefix.length);

        interface TokenMatch { text: string; index: number; isChord: boolean; }
        const tokens: TokenMatch[] = [];

        // Regex zachytí akordy I symboly |, :|, 4x
        const tokenRegex = /(\b[A-H](?:b|#)?(?:m|maj|mi|ma|dim|aug|add|sus)?\d*(?:\/[A-H](?:b|#)?)?\b)|(\||:\||\|:|\b\d+x\b)/gi;

        let match: RegExpExecArray | null;
        while ((match = tokenRegex.exec(currentLine)) !== null) {
          tokens.push({
            text: match[0],
            index: Math.max(0, match.index - prefix.length),
            isChord: !!match[1]
          });
        }

        let textWithChords = prefix;
        let textIndex = 0;

        tokens.forEach(t => {
          if (t.index > textIndex) {
            textWithChords += cleanNextLine.substring(textIndex, t.index);
            textIndex = t.index;
          }

          if (t.isChord) {
            // Posun k prvním písmenu slova dole
            while (textIndex < cleanNextLine.length && /[\s,.\-!?]/.test(cleanNextLine[textIndex])) {
              textWithChords += cleanNextLine[textIndex];
              textIndex++;
            }
            textWithChords += `[${t.text.trim()}]`;
          } else {
            // OPRAVA: Symboly ořízneme na max. 1 mezeru, aby nevnikaly obří díry {|        ||}
            const cleanSymbol = t.text.trim();
            textWithChords += `{|${cleanSymbol}|}`;
          }
        });

        if (textIndex < cleanNextLine.length) {
          textWithChords += cleanNextLine.substring(textIndex);
        }

        resultLines.push(textWithChords);
        i++;
      } else {
        resultLines.push(currentLine);
      }
    }

    return resultLines.join("\n");
  }




  private isChordLine(line: string): boolean {
    const chordRegex = /^[A-H1-9#m\s\+\-\/dimsu,|x|:\(\)]+(\s*\d+x)?$/i;
    return line.trim().length > 0 && chordRegex.test(line);
  }
}
