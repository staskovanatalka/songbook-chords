import { Instrument, ChordNotation } from './song.model';

// 1. Reprezentace pozice akordu pro SVG diagram (odpovídá struktuře chords-db)
export interface ChordPosition {
  frets: (number | 'x')[];    // Pražce pro jednotlivé struny (např. [-1, 0, 2, 2, 1, 0] nebo [1, 2, 3, 4])
  fingers: number[];          // Prstoklad (1 = ukazováček, 2 = prostředníček, atd.)
  baseFret: number;           // Od kterého pražce diagram začíná (např. 1, 3, 5)
  barres?: number | number[]; // Případný barré hmat
}

// 2. Definice akordu v databázi pro konkrétní klíč a příponu (dur, moll, 7...)
export interface ChordDefinition {
  key: string;               // Základní tón (C, Csharp, D...)
  suffix: string;            // Typ akordu (major, minor, 7, m7...)
  positions: ChordPosition[];// Všechny dostupné hmaty/pozice akordu
}

// 3. Stav pro modal/tooltip akordového diagramu
export interface ActiveChordState {
  name: string;              // Zobrazený název (např. "Ami" nebo "Am")
  positions: ChordPosition[];// Seznam nalezených pozic
  currentPositionIndex: number; // Která varianta hmatu se právě zobrazuje (1/3)
  instrument: Instrument;    // GTR nebo UKU
  notation: ChordNotation;   // CZ nebo EN
}

// 4. Parsovaný akord extrahovaný z textu písně
export interface ParsedChord {
  originalText: string;      // Původní řetězec z [závorek]
  transposedText: string;    // Výsledný akord po transpozici
  baseNote: string;          // Základní tón (C, D, E...)
  suffix: string;            // Přípona (m, 7, maj7...)
}
