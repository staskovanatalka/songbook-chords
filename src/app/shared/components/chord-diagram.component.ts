import { Component, input, computed, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import guitarDB from '@tombatossals/chords-db/lib/guitar.json';
import ukuleleDB from '@tombatossals/chords-db/lib/ukulele.json';
import { SongService } from '../../core/services/song.service';

@Component({
  selector: 'app-chord-diagram',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="inline-block p-1 select-none transition-all origin-top"
      [style.transform]="'scale(' + scale() + ')'"
      [class.bg-[var(--bg-card)]]="hasBorder()"
      [class.border]="hasBorder()"
      [class.border-[var(--border-color)]]="hasBorder()"
      [class.rounded]="hasBorder()"
      [class.shadow-lg]="hasBorder()"
      [innerHTML]="svgContent()"
    ></div>
  `
})
export class ChordDiagramComponent {

  scale = input<number>(1);
  hasBorder = input<boolean>(true);
  sanitizer = inject(DomSanitizer);
  songService = inject(SongService);

  chordName = input.required<string>();

  currentPositionIndex = signal<number>(0);

  svgContent = computed<SafeHtml>(() => {
    const rawName = this.chordName();
    const idx = this.currentPositionIndex();const instrument = this.songService.currentInstrument();
    const notation = this.songService.currentNotation();

    const svgString = this.renderChordLibrarySVG(rawName, idx, instrument, notation);
    return this.sanitizer.bypassSecurityTrustHtml(svgString);
  });

  @HostListener('click', ['$event'])
  onSvgClick(event: MouseEvent) {
    const target = event.target as HTMLElement | SVGElement;
    if (target && target.classList.contains('nav-arrow')) {
      const dir = parseInt(target.getAttribute('data-dir') || '0', 10);
      if (dir !== 0) {
        this.currentPositionIndex.update(i => i + dir);
      }
    }
  }

  private getChordDataFromLibrary(rawName: string, instrument: 'GTR' | 'UKU', notation: 'CZ' | 'EN'): any[] {
    const dbSource = instrument === 'GTR' ? guitarDB : ukuleleDB;
    if (!dbSource || !(dbSource as any).chords) return [];

    let cleanName = rawName.trim().replace(/mi/g, 'm');
    if (notation === 'CZ') {
      if (cleanName.startsWith('H')) cleanName = 'B' + cleanName.slice(1);
      else if (cleanName.startsWith('B') && (cleanName.length === 1 || !cleanName.charAt(1).match(/[a-z]/))) {
        cleanName = 'Bb' + cleanName.slice(1);
      }
    }

    const match = cleanName.match(/^([A-G][#b]?)(.*)$/);
    if (!match) return [];

    let key = match[1];
    let suffix = match[2] || 'major';

    const keyMapping: { [key: string]: string } = {
      'C#': 'Csharp', 'F#': 'Fsharp', 'D#': 'Eb', 'G#': 'Ab', 'A#': 'Bb',
      'Db': 'Csharp', 'Eb': 'Eb', 'Gb': 'Fsharp', 'Ab': 'Ab', 'Bb': 'Bb'
    };

    if (keyMapping[key]) key = keyMapping[key];
    if (suffix === 'm') suffix = 'minor';
    if (suffix === '7') suffix = '7';
    if (suffix === 'm7') suffix = 'm7';

    const chordsObj = (dbSource as any).chords;
    let keyChords = chordsObj[key] || chordsObj[key.toLowerCase()] || chordsObj[key.toUpperCase()];
    if (!keyChords) return [];

    let foundChord = keyChords.find((c: any) => c.suffix.toLowerCase() === suffix.toLowerCase());
    if (!foundChord && suffix === 'major') foundChord = keyChords.find((c: any) => c.suffix === 'maj' || c.suffix === '' || c.suffix === 'major');
    if (!foundChord && suffix === 'minor') foundChord = keyChords.find((c: any) => c.suffix === 'm' || c.suffix === 'minor');

    return foundChord ? foundChord.positions : (keyChords[0]?.positions || []);
  }

  private renderChordLibrarySVG(name: string, positionIdx: number, instrument: 'GTR' | 'UKU', notation: 'CZ' | 'EN'): string {
    const positions = this.getChordDataFromLibrary(name, instrument, notation);

    if (positions.length === 0) {
      return `<div class="p-3 text-center text-[var(--text-muted)] text-xs">Diagram pro akord<br><b>${name}</b><br>nenalezen.</div>`;
    }

    if (positionIdx >= positions.length) positionIdx = 0;
    if (positionIdx < 0) positionIdx = positions.length - 1;

    const pos = positions[positionIdx];
    const baseFret = pos.baseFret || 1;

    const isUku = instrument === 'UKU';
    const stringsCount = isUku ? 4 : 6;
    const stringNames = isUku ? ['G', 'C', 'E', 'A'] : ['E', 'A', 'D', 'G', notation === 'CZ' ? 'H' : 'B', 'E'];

    const stringSpacing = 13;
    const fretSpacing = 16;
    const fretboardWidth = (stringsCount - 1) * stringSpacing;
    const width = 120;
    const height = 160;

    const startX = ((width - fretboardWidth) / 2) + 3;
    const startY = 30;

    let svgHtml = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background: transparent; font-family: var(--font-mono, monospace),serif; color: var(--text-main);">`;

    // 1. Název akordu nahoře
    svgHtml += `<text x="${width / 2}" y="15" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--primary-color)">${name}</text>`;

    // 2. Nultý pražec / Označení pražce
    if (baseFret === 1) {
      svgHtml += `<line x1="${startX}" y1="${startY}" x2="${startX + fretboardWidth}" y2="${startY}" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`;
    } else {
      svgHtml += `<line x1="${startX}" y1="${startY}" x2="${startX + fretboardWidth}" y2="${startY}" stroke="currentColor" stroke-width="1"/>`;
      svgHtml += `<text x="${startX - 9}" y="${startY + 11}" text-anchor="end" font-size="9" font-weight="normal" fill="currentColor">${baseFret}fr</text>`;
    }

    // 3. Mřížka pražců
    for (let i = 1; i <= 5; i++) {
      const y = startY + i * fretSpacing;
      svgHtml += `<line x1="${startX}" y1="${y}" x2="${startX + fretboardWidth}" y2="${y}" stroke="currentColor" stroke-width="1" opacity="0.4"/>`;
    }

    // 4. Struny
    for (let i = 0; i < stringsCount; i++) {
      const x = startX + i * stringSpacing;
      svgHtml += `<line x1="${x}" y1="${startY}" x2="${x}" y2="${startY + 5 * fretSpacing}" stroke="currentColor" stroke-width="1"/>`;
    }

    // MAPOVÁNÍ BARRÉ PRSTOKLADU
    const barres = Array.isArray(pos.barres) ? pos.barres : (pos.barres ? [pos.barres] : []);
    const barreStringsMap: { [stringIdx: number]: number } = {};

    // 5. BARRÉ ČÁRA (Průsvitný obdélníček s opacity 0.45)
    barres.forEach((barreFret: number) => {
      let activeStringsForBarre: number[] = [];
      for (let s = 0; s < stringsCount; s++) {
        if (pos.frets[s] === barreFret) {
          activeStringsForBarre.push(s);
          // Uložíme si, že na této struně drží barré hmat (prst č. 1)
          barreStringsMap[s] = pos.fingers ? (pos.fingers[s] || 1) : 1;
        }
      }
      if (activeStringsForBarre.length > 1) {
        const fromString = Math.min(...activeStringsForBarre);
        const toString = Math.max(...activeStringsForBarre);
        if (barreFret >= 1 && barreFret <= 5) {
          const cy = startY + (barreFret - 0.5) * fretSpacing;
          const x1 = startX + fromString * stringSpacing;
          const x2 = startX + toString * stringSpacing;
          svgHtml += `<rect x="${x1 - 4.5}" y="${cy - 4.5}" width="${(x2 - x1) + 9}" height="9" rx="4.5" ry="4.5" fill="var(--primary-color)" opacity="0.45"/>`;
        }
      }
    });

    // 6. KŘÍŽKY, KOLEČKA A KULIČKY S ČÍSLEM PRSTU
    for (let i = 0; i < stringsCount; i++) {
      const fretValue = pos.frets[i];
      let fingerValue = pos.fingers ? pos.fingers[i] : 0;
      const x = startX + i * stringSpacing;
      const symbolY = startY - 7;

      if (fretValue === 'x' || fretValue === -1) {
        svgHtml += `
          <g stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
            <line x1="${x - 3}" y1="${symbolY - 3}" x2="${x + 3}" y2="${symbolY + 3}" />
            <line x1="${x + 3}" y1="${symbolY - 3}" x2="${x - 3}" y2="${symbolY + 3}" />
          </g>`;
      } else if (fretValue === 0) {
        svgHtml += `<circle cx="${x}" cy="${symbolY}" r="3" stroke="currentColor" stroke-width="1.2" fill="none"/>`;
      } else {
        const relativeFret = fretValue;
        if (relativeFret >= 1 && relativeFret <= 5) {
          const cy = startY + (relativeFret - 0.5) * fretSpacing;

          // Pokud je to barré struna a neměla zadaný prstoklad, dáme 1
          if (fingerValue === 0 && barreStringsMap[i]) {
            fingerValue = barreStringsMap[i];
          }

          // Modrá kulička
          svgHtml += `<circle cx="${x}" cy="${cy}" r="5.5" fill="var(--primary-color)"/>`;

          // Číslo prstu uvnitř
          if (fingerValue > 0) {
            svgHtml += `<text x="${x}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="8.5" font-weight="bold" fill="#ffffff">${fingerValue}</text>`;
          }
        }
      }
    }

    // 7. NÁZVY STRUN POD MŘÍŽKOU (E, A, D, G, H, E)
    const stringsY = startY + 5 * fretSpacing + 13;
    for (let i = 0; i < stringsCount; i++) {
      const x = startX + i * stringSpacing;
      svgHtml += `<text x="${x}" y="${stringsY}" text-anchor="middle" font-size="9" font-weight="bold" fill="currentColor" opacity="0.75">${stringNames[i]}</text>`;
    }

    // 8. OVLÁDACÍ LIŠTA DOLE (< 1/4 >)
    if (positions.length > 1) {
      const controlsY = stringsY + 13;
      svgHtml += `
      <g style="cursor: pointer;">
        <text x="30" y="${controlsY}" font-size="13" font-weight="bold" class="nav-arrow" data-dir="-1" fill="var(--primary-color)">&lt;</text>
        <text x="${width / 2}" y="${controlsY - 1}" text-anchor="middle" font-size="10" font-weight="normal" fill="currentColor">${positionIdx + 1}/${positions.length}</text>
        <text x="${width - 30}" y="${controlsY}" font-size="13" font-weight="bold" class="nav-arrow" data-dir="1" fill="var(--primary-color)">&gt;</text>
      </g>`;
    }

    svgHtml += `</svg>`;
    return svgHtml;
  }
}
