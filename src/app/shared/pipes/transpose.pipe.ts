import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'transpose',
  standalone: true
})
export class TransposePipe implements PipeTransform {
  private scaleCZ = ["C", "C#", "D", "Es", "E", "F", "F#", "G", "As", "A", "B", "H"];
  private scaleEN = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

  transform(chord: string, semitones: number, notation: 'CZ' | 'EN'): string {
    // Logika transpozice přebraná ze stávajícího projektu
    if (semitones === 0 && notation === 'CZ') return chord;
    // ... transpoziční logika ...
    return chord;
  }
}
