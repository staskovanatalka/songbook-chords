import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SongService } from './core/services/song.service';
import { HeaderComponent } from './shared/components/header.component';
import { SidebarComponent } from './features/converter/sidebar.component';
import { SongConverterComponent, NewSongData } from './shared/components/song-converter.component';
import { Song } from './core/models/song.model';
import { TunerComponent } from './shared/components/tuner.component';
import { AuthService } from './core/services/auth.service';
import { SongDetailComponent } from './features/converter/song-detail.component';

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
    @if (authService.currentUser()) {
      <!-- HLAVNÍ APLIKACE PRO PŘIHLÁŠENÉHO UŽIVATELE -->
      <div
        class="h-screen w-screen flex flex-col overflow-hidden bg-[var(--bg-body)] text-[var(--text-main)] touch-pan-y"
        (touchstart)="onTouchStart($event)"
        (touchend)="onTouchEnd($event)"
      >

        <!-- HORNÍ LIŠTA (Skryje se při Fullscreenu) -->
        @if (!songService.isFullscreen()) {
          <app-header
            (openConverter)="openNewSongConverter()"
            (openTuner)="isTunerOpen.set(true)"
          ></app-header>
        }

        <!-- MODÁLNÍ OKNO LADIČKY -->
        @if (isTunerOpen()) {
          <app-tuner
            [instrument]="songService.currentInstrument()"
            (close)="isTunerOpen.set(false)"
          ></app-tuner>
        }

        <!-- HLAVNÍ PLOCHA POD HLAVIČKOU -->
        <div class="flex flex-1 min-h-0 w-full overflow-hidden relative">

          <!-- BOČNÍ PANEL SE SEZNAMEM (Skryje se při Fullscreenu) -->
          @if (!songService.isFullscreen()) {
            <app-sidebar></app-sidebar>
          }

          <!-- HLAVNÍ OBSAH S PÍSNIČKOU NEBO PŘEVODNÍKEM -->
          <main
            class="flex-1 overflow-y-auto min-w-0 transition-all duration-150"
            [class.p-0]="songService.isFullscreen()"
            [class.p-4]="!songService.isFullscreen()"
            [class.md:p-6]="!songService.isFullscreen()"
          >
            <div [class.max-w-6xl]="!songService.isFullscreen()" [class.mx-auto]="!songService.isFullscreen()" class="w-full h-full">
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
            </div>
          </main>

        </div>

      </div>
    } @else {
      <!-- PŘIHLAŠOVACÍ OBRAZOVKA -->
      <div class="h-screen w-screen bg-[var(--bg-body)] flex items-center justify-center p-4">
        <div class="max-w-sm w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8 shadow-xl text-center flex flex-col items-center">

          <div class="w-16 h-16 rounded-full bg-[var(--primary-color-alpha)] flex items-center justify-center mb-4 text-[var(--primary-color)]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>

          <h1 class="text-2xl font-bold text-[var(--text-main)] mb-2">
            Osobní Zpěvník
          </h1>
          <p class="text-sm text-[var(--text-muted)] mb-8">
            Přihlaste se pro přístup ke svým skladbám, tóninám a štítkům.
          </p>

          <button
            type="button"
            (click)="authService.loginWithGoogle()"
            class="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] font-semibold text-sm hover:bg-[var(--bg-hover)] transition-all cursor-pointer shadow-sm active:scale-[0.99]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Přihlásit se přes Google</span>
          </button>

        </div>
      </div>
    }
  `
})
export class AppComponent {
  songService = inject(SongService);
  authService = inject(AuthService);
  editingSong = signal<Song | null>(null);
  activeView = signal<'detail' | 'converter'>('detail');
  isTunerOpen = signal<boolean>(false);

  private touchStartX = 0;
  private touchStartY = 0;

  onEditSong() {
    const current = this.songService.activeSong();
    if (current) {
      this.editingSong.set(current);
      this.activeView.set('converter');
    }
  }

  openNewSongConverter() {
    this.editingSong.set(null);
    this.activeView.set('converter');
  }

  closeConverter() {
    this.editingSong.set(null);
    this.activeView.set('detail');
  }

  async onSaveSong(songData: NewSongData) {
    const currentEditing = this.editingSong();

    if (currentEditing) {
      await this.songService.updateSong({
        ...currentEditing,
        ...songData
      });
    } else {
      await this.songService.addSong(songData);
    }

    this.closeConverter();
  }

  async onDeleteSong() {
    const current = this.songService.activeSong();
    if (!current || !current.id) return;

    if (confirm(`Opravdu chceš smazat písničku "${current.title}"?`)) {
      await this.songService.deleteSong(current.id);
    }
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
    this.touchStartY = event.changedTouches[0].screenY;
  }

  onTouchEnd(event: TouchEvent) {
    if (this.activeView() !== 'detail') return;

    const touchEndX = event.changedTouches[0].screenX;
    const touchEndY = event.changedTouches[0].screenY;

    const diffX = touchEndX - this.touchStartX;
    const diffY = touchEndY - this.touchStartY;

    // Minimální délka gesta 50px a ověření, že šlo o horizontální tah
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        // Swipe doleva -> Další písnička
        this.navigateNext();
      } else {
        // Swipe doprava -> Předchozí písnička
        this.navigatePrev();
      }
    }
  }

  private navigateNext() {
    const songs = this.songService.filteredSongs();
    const current = this.songService.activeSong();
    if (!songs.length) return;

    if (!current) {
      this.songService.selectSong(songs[0]);
      return;
    }

    const currentIndex = songs.findIndex(s => s.id === current.id);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % songs.length;
    this.songService.selectSong(songs[nextIndex]);
  }

  private navigatePrev() {
    const songs = this.songService.filteredSongs();
    const current = this.songService.activeSong();
    if (!songs.length) return;

    if (!current) {
      this.songService.selectSong(songs[0]);
      return;
    }

    const currentIndex = songs.findIndex(s => s.id === current.id);
    const prevIndex = currentIndex <= 0 ? songs.length - 1 : currentIndex - 1;
    this.songService.selectSong(songs[prevIndex]);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardNavigation(event: KeyboardEvent) {
    const activeElement = document.activeElement as HTMLElement;
    const isInputActive = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA'
    );

    if (isInputActive) {
      if (event.key === 'Enter' || event.key === 'Escape') {
        activeElement.blur();
      }
      return;
    }

    if (event.key === 'Escape' && this.songService.isFullscreen()) {
      this.songService.toggleFullscreen();
      return;
    }

    if (this.activeView() !== 'detail') return;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.navigateNext();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.navigatePrev();
    }
  }
}
