import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SongService } from './core/services/song.service';
import { HeaderComponent } from './shared/components/header.component';
import { SidebarComponent } from './features/converter/sidebar.component';
import { SongDetailComponent } from './shared/components/song-detail.component';
import { SongConverterComponent, NewSongData } from './shared/components/song-converter.component';
import { Song } from './core/models/song.model';
import { TunerComponent } from './shared/components/tuner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    SidebarComponent,
    SongDetailComponent,
    SongConverterComponent,
    TunerComponent
  ],
  template: `
    <div class="min-h-screen bg-[var(--bg-body)] text-[var(--text-main)]">

      <!-- HORNÍ LIŠTA -->
      <app-header
        (openConverter)="openNewSongConverter()"
        (openTuner)="isTunerOpen.set(true)"
      ></app-header>

      <!-- MODÁLNÍ OKNO LADIČKY -->
      @if (isTunerOpen()) {
        <app-tuner
          [instrument]="songService.currentInstrument()"
          (close)="isTunerOpen.set(false)"
        ></app-tuner>
      }

      <main class="p-4 max-w-7xl mx-auto flex gap-4 transition-all duration-200">

        <!-- BOČNÍ PANEL SE SEZNAMEM -->
        <app-sidebar></app-sidebar>

        <!-- HLAVNÍ OBSAH S PŘEPÍNÁNÍM POHLEDŮ -->
        <section class="flex-1 min-w-0 transition-all duration-200">
          @switch (activeView()) {
            @case ('detail') {
              <app-song-detail
                [song]="songService.activeSong()"
                [notation]="songService.currentNotation()"
                (editSong)="onEditSong()"
                (deleteSong)="onDeleteSong()"
              ></app-song-detail>
            }
            @case ('converter') {
              <app-song-converter
                [songToEdit]="editingSong()"
                (saveSong)="onSaveSong($event)"
                (cancel)="closeConverter()"
              ></app-song-converter>
            }
          }
        </section>

      </main>

    </div>
  `
})
export class AppComponent {
  songService = inject(SongService);

  editingSong = signal<Song | null>(null);
  activeView = signal<'detail' | 'converter'>('detail');
  isTunerOpen = signal<boolean>(false);

  // Spustí se při kliknutí na "Upravit písničku" v menu 3 teček
  onEditSong() {
    const current = this.songService.activeSong();
    if (current) {
      this.editingSong.set(current);
      this.activeView.set('converter');
    }
  }

  // Při přidávání nové písničky z hlavičky vyčistíme editační stav
  openNewSongConverter() {
    this.editingSong.set(null);
    this.activeView.set('converter');
  }

  // Zavření převodníku / návrat do detailu
  closeConverter() {
    this.editingSong.set(null);
    this.activeView.set('detail');
  }

  // Uložení (vytvoření nebo úprava)
  async onSaveSong(songData: NewSongData) {
    const currentEditing = this.editingSong();

    if (currentEditing) {
      // Úprava existující písničky
      await this.songService.updateSong({
        ...currentEditing,
        ...songData
      });
    } else {
      // Přidání nové písničky
      await this.songService.addSong(songData);
    }

    this.closeConverter();
  }

  // Smazání písničky
  async onDeleteSong() {
    const current = this.songService.activeSong();
    // Zkontrolujeme, že písnička existuje A má platné ID
    if (!current || !current.id) return;

    if (confirm(`Opravdu chceš smazat písničku "${current.title}"?`)) {
      await this.songService.deleteSong(current.id);
    }
  }
  // Odchytávání klávesových zkratek pro listování písničkami
  @HostListener('window:keydown', ['$event'])
  handleKeyboardNavigation(event: KeyboardEvent) {
    // Pokud uživatel zrovna píše do vyhledávání nebo v editoru, ignorujeme šipky
    const activeTag = (document.activeElement?.tagName || '').toLowerCase();
    if (activeTag === 'input' || activeTag === 'textarea') {
      return;
    }

    // Listujeme pouze pokud jsme v pohledu detailu písničky
    if (this.activeView() !== 'detail') return;

    const songs = this.songService.filteredSongs();
    const current = this.songService.activeSong();
    if (!songs.length || !current) return;

    const currentIndex = songs.findIndex(s => s.id === current.id);
    if (currentIndex === -1) return;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % songs.length;
      this.songService.selectSong(songs[nextIndex]);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      let prevIndex = currentIndex - 1;
      if (prevIndex < 0) prevIndex = songs.length - 1;
      this.songService.selectSong(songs[prevIndex]);
    }
  }
}
