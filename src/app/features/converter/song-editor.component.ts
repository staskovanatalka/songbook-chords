import { Component, inject, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SongService } from '../../core/services/song.service';
import { Song } from '../../core/models/song.model';

@Component({
  selector: 'app-song-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card shadow-sm mb-4">
      <div class="card-body">
        <div class="row g-2 mb-2">
          <div class="col-md-6">
            <label class="form-label small fw-bold">Název:</label>
            <input type="text" [(ngModel)]="title" class="form-control form-control-sm">
          </div>
          <div class="col-md-6">
            <label class="form-label small fw-bold">Autor:</label>
            <input type="text" [(ngModel)]="artist" class="form-control form-control-sm">
          </div>
        </div>

        <div class="row g-2 mb-2">
          <div class="col-md-6">
            <label class="form-label small fw-bold">Capo:</label>
            <input type="text" [(ngModel)]="capo" class="form-control form-control-sm" placeholder="Žádné">
          </div>
          <div class="col-md-6">
            <label class="form-label small fw-bold">Rytmus:</label>
            <input type="text" [(ngModel)]="strumming" class="form-control form-control-sm" placeholder="Výchozí">
          </div>
        </div>

        <div class="mb-2">
          <label class="form-label small fw-bold">Poznámky:</label>
          <input type="text" [(ngModel)]="notes" class="form-control form-control-sm">
        </div>

        <div class="mb-3">
          <label class="form-label small fw-bold">Text s akordy v [závorkách]:</label>
          <textarea [(ngModel)]="text" class="form-control font-monospace form-control-sm" rows="12"></textarea>
        </div>

        <div class="d-flex gap-2 flex-wrap">
          <button (click)="save()" class="btn btn-primary flex-grow-1">Uložit změny</button>
          <button (click)="cancel.emit()" class="btn btn-outline-secondary">Zrušit</button>
        </div>
      </div>
    </div>
  `
})
export class SongEditorComponent implements OnInit {
  private songService = inject(SongService);

  song = input<Song | null>(null);
  cancel = output<void>();

  title = '';
  artist = '';
  capo = '';
  strumming = '';
  notes = '';
  text = '';

  ngOnInit() {
    const s = this.song();
    if (s) {
      this.title = s.title;
      this.artist = s.artist;
      this.capo = s.capo || '';
      this.strumming = s.strumming || '';
      this.notes = s.notes || '';
      this.text = s.text;
    }
  }

  async save() {
    const s = this.song();
    if (!s?.id) return;

    await this.songService.updateSong(s.id, {
      title: this.title.trim() || 'Bez názvu',
      artist: this.artist.trim() || 'Neznámý autor',
      capo: this.capo.trim(),
      strumming: this.strumming.trim(),
      notes: this.notes.trim(),
      text: this.text
    });

    this.cancel.emit();
  }
}
