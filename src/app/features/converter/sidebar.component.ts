import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SongService } from '../../core/services/song.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <aside
      class="h-full bg-[var(--bg-card)] transition-all duration-200 ease-in-out overflow-hidden shrink-0 flex flex-col border-r border-[var(--border-color)]"
      [class.w-72]="!songService.isSidebarCollapsed()"
      [class.w-0]="songService.isSidebarCollapsed()"
      [class.border-r-0]="songService.isSidebarCollapsed()"
    >
      <div class="px-3 pt-3 pb-3 flex flex-col h-full font-sans w-72">

        <!-- HORNÍ OVLÁDACÍ PRVKY -->
        <div class="flex flex-col gap-2 mb-3 shrink-0">

          <!-- 1. PŘEPÍNAČ: MŮJ ZPĚVNÍK VS KATALOG (BEZ POČTŮ) -->
          <div class="flex h-8 p-0.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)]">
            <button
              type="button"
              (click)="songService.activeTab.set('my-songs')"
              [class.bg-[var(--bg-card)]]="songService.activeTab() === 'my-songs'"
              [class.text-[var(--primary-color)]]="songService.activeTab() === 'my-songs'"
              [class.font-bold]="songService.activeTab() === 'my-songs'"
              [class.shadow-sm]="songService.activeTab() === 'my-songs'"
              class="flex-1 text-[11px] rounded-md text-[var(--text-muted)] transition-all cursor-pointer flex items-center justify-center"
            >
              Můj zpěvník
            </button>
            <button
              type="button"
              (click)="songService.activeTab.set('all-songs')"
              [class.bg-[var(--bg-card)]]="songService.activeTab() === 'all-songs'"
              [class.text-[var(--primary-color)]]="songService.activeTab() === 'all-songs'"
              [class.font-bold]="songService.activeTab() === 'all-songs'"
              [class.shadow-sm]="songService.activeTab() === 'all-songs'"
              class="flex-1 text-[11px] rounded-md text-[var(--text-muted)] transition-all cursor-pointer flex items-center justify-center"
            >
              Katalog
            </button>
          </div>

          <!-- 2. HLEDÁNÍ A ŘAZENÍ -->
          <div class="flex gap-1.5 items-center">
            <div class="relative flex-1">
              <input
                type="text"
                [placeholder]="songService.activeTab() === 'my-songs' ? 'Hledat ve zpěvníku...' : 'Hledat v katalogu...'"
                [ngModel]="songService.searchQuery()"
                (ngModelChange)="songService.searchQuery.set($event)"
                class="w-full h-8 pl-8 pr-2.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-color)] transition-all"
              >
              <svg class="absolute left-2.5 top-2 text-[var(--text-muted)] opacity-60 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>

            <!-- Tlačítko řazení -->
            <div class="relative shrink-0">
              <button
                type="button"
                (click)="isSortMenuOpen.set(!isSortMenuOpen())"
                class="h-8 w-8 flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer"
                title="Možnosti řazení"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6"></line>
                  <line x1="4" y1="12" x2="14" y2="12"></line>
                  <line x1="4" y1="18" x2="8" y2="18"></line>
                </svg>
              </button>

              @if (isSortMenuOpen()) {
                <div class="fixed inset-0 z-40" (click)="isSortMenuOpen.set(false)"></div>
                <div class="absolute right-0 top-9 z-50 w-36 p-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-xl space-y-0.5 text-xs">
                  <div class="font-semibold text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1 px-2 pt-1">
                    Řadit podle
                  </div>

                  <button
                    type="button"
                    (click)="songService.sortBy.set('title-asc'); isSortMenuOpen.set(false)"
                    [class.bg-[var(--bg-hover)]]="songService.sortBy() === 'title-asc'"
                    [class.font-semibold]="songService.sortBy() === 'title-asc'"
                    class="w-full text-left px-2 py-1 rounded text-[var(--text-main)] hover:bg-[var(--bg-hover)] cursor-pointer flex justify-between items-center"
                  >
                    <span>Název A-Z</span>
                    @if (songService.sortBy() === 'title-asc') { <span>✓</span> }
                  </button>

                  <button
                    type="button"
                    (click)="songService.sortBy.set('title-desc'); isSortMenuOpen.set(false)"
                    [class.bg-[var(--bg-hover)]]="songService.sortBy() === 'title-desc'"
                    [class.font-semibold]="songService.sortBy() === 'title-desc'"
                    class="w-full text-left px-2 py-1 rounded text-[var(--text-main)] hover:bg-[var(--bg-hover)] cursor-pointer flex justify-between items-center"
                  >
                    <span>Název Z-A</span>
                    @if (songService.sortBy() === 'title-desc') { <span>✓</span> }
                  </button>

                  <button
                    type="button"
                    (click)="songService.sortBy.set('artist-asc'); isSortMenuOpen.set(false)"
                    [class.bg-[var(--bg-hover)]]="songService.sortBy() === 'artist-asc'"
                    [class.font-semibold]="songService.sortBy() === 'artist-asc'"
                    class="w-full text-left px-2 py-1 rounded text-[var(--text-main)] hover:bg-[var(--bg-hover)] cursor-pointer flex justify-between items-center"
                  >
                    <span>Autor A-Z</span>
                    @if (songService.sortBy() === 'artist-asc') { <span>✓</span> }
                  </button>

                  <button
                    type="button"
                    (click)="songService.sortBy.set('artist-desc'); isSortMenuOpen.set(false)"
                    [class.bg-[var(--bg-hover)]]="songService.sortBy() === 'artist-desc'"
                    [class.font-semibold]="songService.sortBy() === 'artist-desc'"
                    class="w-full text-left px-2 py-1 rounded text-[var(--text-main)] hover:bg-[var(--bg-hover)] cursor-pointer flex justify-between items-center"
                  >
                    <span>Autor Z-A</span>
                    @if (songService.sortBy() === 'artist-desc') { <span>✓</span> }
                  </button>
                </div>
              }
            </div>
          </div>

          <!-- 3. DVĚ ZÁLOŽKY: PÍSNIČKY / AUTOŘI -->
          <div class="flex h-7 p-0.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)]">
            <button
              type="button"
              (click)="activeTab.set('songs'); selectedArtist.set(null)"
              [class.bg-[var(--bg-card)]]="activeTab() === 'songs'"
              [class.text-[var(--text-main)]]="activeTab() === 'songs'"
              [class.shadow-sm]="activeTab() === 'songs'"
              class="flex-1 text-[11px] font-medium rounded-md text-[var(--text-muted)] transition-all cursor-pointer flex items-center justify-center"
            >
              Písničky
            </button>
            <button
              type="button"
              (click)="activeTab.set('artists')"
              [class.bg-[var(--bg-card)]]="activeTab() === 'artists'"
              [class.text-[var(--text-main)]]="activeTab() === 'artists'"
              [class.shadow-sm]="activeTab() === 'artists'"
              class="flex-1 text-[11px] font-medium rounded-md text-[var(--text-muted)] transition-all cursor-pointer flex items-center justify-center"
            >
              Autoři
            </button>
          </div>
        </div>

        <!-- REŽIM 1: SEZNAM PÍSNIČEK -->
        @if (activeTab() === 'songs') {
          @if (selectedArtist()) {
            <div class="flex items-center justify-between px-2 py-1 mb-2 rounded-md bg-[var(--bg-hover)] text-xs border border-[var(--border-color)] shrink-0">
              <span class="truncate font-medium text-[var(--text-main)]">Autor: {{ selectedArtist() }}</span>
              <button (click)="selectedArtist.set(null)" class="text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer text-sm font-bold">&times;</button>
            </div>
          }

          <div class="overflow-y-auto flex-1 pr-1 space-y-1">
            @for (song of displayedSongs(); track song.id) {
              <div
                class="group relative flex items-center justify-between p-2 rounded-lg transition-all border border-transparent"
                [class.bg-[var(--primary-color-alpha)]]="song.id === songService.activeSong()?.id"
                [class.border-[var(--primary-color)]]="song.id === songService.activeSong()?.id"
                [class.hover:bg-[var(--bg-hover)]]="song.id !== songService.activeSong()?.id"
              >
                <!-- Název písně a autor pod ním -->
                <button
                  type="button"
                  (click)="songService.selectSong(song)"
                  class="flex-1 text-left min-w-0 cursor-pointer"
                >
                  <div class="text-xs font-semibold text-[var(--text-main)] truncate leading-tight">
                    {{ song.title }}
                  </div>
                  <div class="text-[11px] text-[var(--text-muted)] truncate mt-0.5 opacity-80">
                    {{ song.artist || 'Neznámý autor' }}
                  </div>
                </button>

                <!-- Ikona záložky -->
                <button
                  type="button"
                  (click)="$event.stopPropagation(); songService.toggleSaveSong(song.id!)"
                  class="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors cursor-pointer shrink-0 ml-1"
                  [title]="songService.isSavedByMe(song) ? 'Odebrat ze zpěvníku' : 'Uložit do mého zpěvníku'"
                >
                  @if (songService.isSavedByMe(song)) {
                    <svg width="15" height="15" fill="currentColor" class="text-[var(--primary-color)]" viewBox="0 0 24 24">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                  } @else {
                    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                  }
                </button>
              </div>
            } @empty {
              <div class="p-6 text-center text-xs text-[var(--text-muted)] leading-relaxed">
                @if (songService.activeTab() === 'my-songs') {
                  Ve tvém zpěvníku zatím nic není.<br>
                  Přepni nahoře na <strong>Katalog</strong> a přidej si písničky záložkou!
                } @else {
                  Žádná písnička nebyla nalezena.
                }
              </div>
            }
          </div>
        }

        <!-- REŽIM 2: SEZNAM AUTORŮ -->
        @if (activeTab() === 'artists') {
          <div class="overflow-y-auto flex-1 pr-1 space-y-0.5">
            @for (artist of artistList(); track artist.name) {
              <button
                type="button"
                (click)="filterByArtist(artist.name)"
                class="w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-main)] cursor-pointer transition-colors"
              >
                <span class="font-medium truncate">{{ artist.name }}</span>
                <span class="text-[11px] text-[var(--text-muted)] opacity-70 font-mono ml-2">
                  {{ artist.count }}
                </span>
              </button>
            } @empty {
              <div class="p-4 text-center text-xs text-[var(--text-muted)]">
                Žádní autoři.
              </div>
            }
          </div>
        }

      </div>
    </aside>
  `
})
export class SidebarComponent {
  isSortMenuOpen = signal<boolean>(false);
  songService = inject(SongService);

  activeTab = signal<'songs' | 'artists'>('songs');
  selectedArtist = signal<string | null>(null);

  currentScopedSongs = computed(() => {
    const tab = this.songService.activeTab();
    const all = this.songService.songs();
    if (tab === 'my-songs') {
      return all.filter(s => this.songService.isSavedByMe(s));
    }
    return all;
  });

  artistList = computed(() => {
    const counts = new Map<string, number>();
    const q = this.songService.searchQuery().toLowerCase().trim();

    this.currentScopedSongs().forEach(song => {
      const name = song.artist || 'Neznámý autor';
      if (!q || name.toLowerCase().includes(q)) {
        counts.set(name, (counts.get(name) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'cs'));
  });

  displayedSongs = computed(() => {
    let songs = this.songService.filteredSongs();

    if (this.selectedArtist()) {
      songs = songs.filter(s => (s.artist || 'Neznámý autor') === this.selectedArtist());
    }

    return songs;
  });

  filterByArtist(artistName: string) {
    this.selectedArtist.set(artistName);
    this.activeTab.set('songs');
  }
}
