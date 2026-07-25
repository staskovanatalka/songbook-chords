import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SongService } from '../../core/services/song.service';

@Component({
  selector: 'app-converter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card shadow-sm">
      <div class="card-body">
        <h3 class="h4 card-title mb-3">Převodník z pisnicky-akordy.cz</h3>
        <p class="text-muted small">Zkopíruj celou písničku z webu a vlož ji sem.</p>

        <div class="mb-3">
          <label class="form-label fw-bold small">Název písničky:</label>
          <input type="text" [(ngModel)]="title" class="form-control form-control-sm" placeholder="Např. Anděl">
        </div>

        <div class="mb-3">
          <label class="form-label fw-bold small">Autor / Interpret:</label>
          <input type="text" [(ngModel)]="artist" class="form-control form-control-sm" placeholder="Např. Karel Kryl">
        </div>

        <div class="mb-3">
          <label class="form-label fw-bold small">Poznámky (nepovinné):</label>
          <input type="text" [(ngModel)]="notes" class="form-control form-control-sm" placeholder="Např. Capo na 2. pražci">
        </div>

        <div class="mb-3">
          <label class="form-label fw-bold small">Sem vlož text s akordy z webu:</label>
          <textarea [(ngModel)]="rawText" class="form-control font-monospace form-control-sm" rows="8"></textarea>
        </div>

        <button (click)="convertAndSave()" class="btn btn-primary w-100 btn-sm">Převést a uložit do zpěvníku</button>
      </div>
    </div>
  `
})
export class ConverterComponent {
  private songService = inject(SongService);
  close = output<void>();

  title = '';
  artist = '';
  notes = '';
  rawText = '';

  private isChordLine(line: string): boolean {
    const chordRegex = /^[A-H1-9#m\s\+\-\/dimsu,|x|:\(\)]+(\s*\d+x)?$/i;
    return line.trim().length > 0 && chordRegex.test(line);
  }

  async convertAndSave() {
    const lines = this.rawText.split('\n');
    const resultLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const currentLine = lines[i];

      if (this.isChordLine(currentLine)) {
        const nextLine = lines[i + 1] || '';

        if (nextLine.trim() === '' || this.isChordLine(nextLine)) {
          let chordOnlyLine = currentLine.replace(/([A-H][A-Za-z0-9#\+\-\/]*)(,?)/g, (_, chord, comma) => `[${chord}]${comma || ''}`);
          resultLines.push(`{${chordOnlyLine}}`);
          continue;
        }

        const prefixMatch = nextLine.match(/^(\s*(?:\d+\.|\w+\:|[A-Z]\.)\s*)/);
        const prefix = prefixMatch ? prefixMatch[1] : '';
        const cleanNextLine = nextLine.slice(prefix.length);

        const chords: { chord: string; index: number }[] = [];
        const regex = /([A-H][A-Za-z0-9#\+\-\/]*)/g;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(currentLine)) !== null) {
          chords.push({ chord: match[1], index: match.index });
        }

        let textWithChords = prefix;
        let textIndex = 0;

        chords.forEach(c => {
          if (c.index > textIndex) {
            textWithChords += cleanNextLine.substring(textIndex, c.index);
            textIndex = c.index;
          }
          while (textIndex < cleanNextLine.length && /[\s,.\-!?]/.test(cleanNextLine[textIndex])) {
            textWithChords += cleanNextLine[textIndex];
            textIndex++;
          }
          textWithChords += `[${c.chord}]`;
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

    await this.songService.addSong({
      title: this.title.trim() || 'Bez názvu',
      artist: this.artist.trim() || 'Neznámý autor',
      notes: this.notes.trim(),
      text: resultLines.join('\n')
    });

    this.close.emit();
  }
}
