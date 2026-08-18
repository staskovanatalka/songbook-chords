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
      [class.w-64]="!songService.isSidebarCollapsed()"
      [class.w-0]="songService.isSidebarCollapsed()"
      [class.border-r-0]="songService.isSidebarCollapsed()"
    >
      <div class="px-3 pt-3 pb-3 flex flex-col h-full font-sans w-64">

        <div class="flex flex-col gap-2 mb-3 shrink-0">

          <!-- HLAVNÍ PŘEPÍNAČ: MŮJ ZPĚVNÍK VS KATALOG -->
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
              Katalog ({{ songService.songs().length }})
            </button>
          </div>

          <!-- VYHLEDÁVÁNÍ A ŘAZENÍ -->
          <div class="flex gap-1.5 items-center">
            <!-- HLEDAT INPUT (napojen přímo na songService.searchQuery) -->
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

            <!-- TLAČÍTKO FILTRU / ŘAZENÍ -->
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

              <!-- VYSKAKOVACÍ MENU ŘAZENÍ -->
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

          <!-- PŘEPÍNAČ PODKATEGORIÍ -->
          <div class="flex h-7 p-0.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-color)]">
            <button
              type="button"
              (click)="activeTab.set('songs'); selectedArtist.set(null); selectedTag.set(null)"
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
            <button
              type="button"
              (click)="activeTab.set('tags')"
              [class.bg-[var(--bg-card)]]="activeTab() === 'tags'"
              [class.text-[var(--text-main)]]="activeTab() === 'tags'"
              [class.shadow-sm]="activeTab() === 'tags'"
              class="flex-1 text-[11px] font-medium rounded-md text-[var(--text-muted)] transition-all cursor-pointer flex items-center justify-center"
            >
              Štítky
            </button>
          </div>
        </div>

        <!-- REŽIM 1: SEZNAM PÍSNIČEK -->
        @if (activeTab() === 'songs') {
          @if (selectedArtist()) {
            <div class="flex items-center justify-between px-2 py-1 mb-2 rounded-md bg-[var(--bg-hover)] text-xs border border-[var(--border-color)] shrink-0">
              <span class="truncate font-medium text-[var(--text-main)]">Autor: {{ selectedArtist() }}</span>
              <button (click)="selectedArtist.set(null)" class="text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer">&times;</button>
            </div>
          }

          @if (selectedTag()) {
            <div class="flex items-center justify-between px-2 py-1 mb-2 rounded-md bg-[var(--bg-hover)] text-xs border border-[var(--border-color)] shrink-0">
              <span class="truncate font-medium text-[var(--text-main)]">
                {{ selectedTag() === '__UNTAGGED__' ? '#bez-štítku' : '#' + selectedTag() }}
              </span>
              <button (click)="selectedTag.set(null)" class="text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer">&times;</button>
            </div>
          }

          <div class="overflow-y-auto flex-1 pr-1 space-y-0.5">
            @for (song of displayedSongs(); track song.id) {
              <div
                class="group relative flex items-center rounded-md transition-all"
                [class.sidebar-item-active]="song.id === songService.activeSong()?.id"
                [class.hover:bg-[var(--bg-hover)]]="song.id !== songService.activeSong()?.id"
              >
                <!-- Klikací název písně -->
                <button
                  type="button"
                  (click)="songService.selectSong(song)"
                  class="flex-1 text-left px-2.5 py-1.5 text-xs text-[var(--text-main)] font-medium cursor-pointer truncate"
                >
                  <div class="truncate">{{ song.title }}</div>
                </button>

                <div class="flex items-center gap-0.5 pr-1.5 shrink-0">
                  <!-- Tlačítko přidání/odebrání do zpěvníku -->
                  <button
                    type="button"
                    (click)="$event.stopPropagation(); songService.toggleSaveSong(song.id!)"
                    class="p-1 rounded text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors cursor-pointer"
                    [title]="songService.isSavedByMe(song) ? 'Odebrat ze zpěvníku' : 'Uložit do mého zpěvníku'"
                  >
                    @if (songService.isSavedByMe(song)) {
                      <svg width="13" height="13" fill="currentColor" class="text-[var(--primary-color)]" viewBox="0 0 24 24">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                      </svg>
                    } @else {
                      <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                      </svg>
                    }
                  </button>

                  <!-- Správa štítků -->
                  <div class="relative">
                    <button
                      type="button"
                      (click)="activeTagMenuId.set(activeTagMenuId() === song.id ? null : song.id!)"
                      class="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-opacity cursor-pointer rounded"
                      title="Spravovat štítky"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2H2v10l11 11 10-10L12 2z"></path>
                        <circle cx="7" cy="7" r="1.5"></circle>
                      </svg>
                    </button>

                    @if (activeTagMenuId() === song.id) {
                      <div class="fixed inset-0 z-40" (click)="activeTagMenuId.set(null)"></div>
                      <div class="absolute right-0 top-6 z-50 w-44 p-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-xl space-y-1.5 text-xs">
                        <div class="font-semibold text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1 px-1">
                          Moje štítky písničky
                        </div>
                        <div class="max-h-36 overflow-y-auto space-y-1">
                          @for (tag of songService.customTags(); track tag) {
                            <button
                              type="button"
                              (click)="songService.toggleSongTag(song.id!, tag)"
                              class="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-[var(--bg-hover)] text-left cursor-pointer"
                            >
                              <span>#{{ tag }}</span>
                              @if (songService.getMyTags(song).includes(tag)) {
                                <span class="text-[var(--primary-color)] font-bold">✓</span>
                              }
                            </button>
                          }
                        </div>
                        <div class="pt-1.5 border-t border-[var(--border-color)] flex gap-1">
                          <input
                            #newTagInput
                            type="text"
                            placeholder="Nový tag..."
                            (keydown.enter)="songService.addGlobalTag(newTagInput.value); newTagInput.value=''"
                            class="w-full px-1.5 py-0.5 text-[11px] rounded border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-main)]"
                          >
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            } @empty {
              <div class="p-4 text-center text-xs text-[var(--text-muted)]">
                @if (songService.activeTab() === 'my-songs') {
                  Ve zpěvníku zatím nic nemáš.<br>Přepni nahoře na <strong>Katalog</strong>!
                } @else {
                  Žádná písnička nenalezena.
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
                class="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-main)] cursor-pointer"
              >
                <span class="font-medium truncate">{{ artist.name }}</span>
                <span class="text-[11px] text-[var(--text-muted)] opacity-60 font-mono">
                  {{ artist.count }}
                </span>
              </button>
            }
          </div>
        }

        <!-- REŽIM 3: SEZNAM ŠTÍTKŮ -->
        @if (activeTab() === 'tags') {
          <div class="overflow-y-auto flex-1 pr-1 space-y-0.5">

            <!-- POLOŽKA: #bez-štítku -->
            <button
              type="button"
              (click)="filterByTag('__UNTAGGED__')"
              class="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-main)] cursor-pointer"
            >
              <span class="font-medium truncate text-[var(--text-muted)]">#bez-štítku</span>
              <span class="text-[11px] text-[var(--text-muted)] opacity-60 font-mono">
                {{ untaggedCount() }}
              </span>
            </button>

            <div class="h-px bg-[var(--border-color)] my-1.5 mx-1"></div>

            @for (tag of tagList(); track tag.name) {
              <div class="group flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-main)]">
                <div class="flex items-center gap-1.5 truncate flex-1 mr-2">
                  <button
                    type="button"
                    (click)="filterByTag(tag.name)"
                    class="text-left font-medium truncate cursor-pointer py-0.5"
                  >
                    #{{ tag.name }}
                  </button>

                  <button
                    type="button"
                    (click)="deleteGlobalTag(tag.name, $event)"
                    class="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--text-muted)] hover:text-red-500 transition-opacity cursor-pointer rounded shrink-0"
                    title="Smazat štítek"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>

                <span class="text-[11px] text-[var(--text-muted)] opacity-60 font-mono shrink-0">
                  {{ tag.count }}
                </span>
              </div>
            }
          </div>

          <!-- SPODNÍ PŘIDÁVÁNÍ ŠTÍTKU -->
          <div class="pt-2 mt-2 border-t border-[var(--border-color)] shrink-0">
            <div class="relative w-full">
              <input
                #tabNewTagInput
                type="text"
                placeholder="Vytvořit nový štítek..."
                (keydown.enter)="addTagFromTab(tabNewTagInput)"
                class="w-full h-8 pl-2.5 pr-8 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-color)] transition-all"
              >
              <button
                type="button"
                (click)="addTagFromTab(tabNewTagInput)"
                class="absolute right-1 top-1 h-6 w-6 flex items-center justify-center text-xs rounded text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                title="Přidat štítek"
              >
                +
              </button>
            </div>
          </div>
        }

      </div>
    </aside>
  `
})
export class SidebarComponent {
  isSortMenuOpen = signal<boolean>(false);
  songService = inject(SongService);

  activeTab = signal<'songs' | 'artists' | 'tags'>('songs');
  selectedArtist = signal<string | null>(null);
  selectedTag = signal<string | null>(null);
  activeTagMenuId = signal<string | null>(null);

  currentScopedSongs = computed(() => {
    const tab = this.songService.activeTab();
    const all = this.songService.songs();
    if (tab === 'my-songs') {
      return all.filter(s => this.songService.isSavedByMe(s));
    }
    return all;
  });

  untaggedCount = computed(() => {
    return this.currentScopedSongs().filter(s => this.songService.getMyTags(s).length === 0).length;
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

  tagList = computed(() => {
    const counts = new Map<string, number>();
    const q = this.songService.searchQuery().toLowerCase().trim().replace(/^#/, '');

    this.songService.customTags().forEach(tag => {
      if (!q || tag.toLowerCase().includes(q)) {
        counts.set(tag, 0);
      }
    });

    this.currentScopedSongs().forEach(song => {
      const myTags = this.songService.getMyTags(song);
      myTags.forEach(tag => {
        if (counts.has(tag)) {
          counts.set(tag, (counts.get(tag) || 0) + 1);
        }
      });
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

    if (this.selectedTag()) {
      if (this.selectedTag() === '__UNTAGGED__' || this.selectedTag() === 'bez-štítku') {
        songs = songs.filter(s => this.songService.getMyTags(s).length === 0);
      } else {
        songs = songs.filter(s => this.songService.getMyTags(s).includes(this.selectedTag()!));
      }
    }

    return songs;
  });

  filterByArtist(artistName: string) {
    this.selectedArtist.set(artistName);
    this.selectedTag.set(null);
    this.activeTab.set('songs');
  }

  filterByTag(tagName: string) {
    this.selectedTag.set(tagName);
    this.selectedArtist.set(null);
    this.activeTab.set('songs');
  }

  addTagFromTab(inputEl: HTMLInputElement) {
    const val = inputEl.value;
    if (val.trim()) {
      this.songService.addGlobalTag(val);
      inputEl.value = '';
    }
  }

  deleteGlobalTag(tagName: string, event: Event) {
    event.stopPropagation();
    if (confirm(`Opravdu chceš smazat štítek #${tagName}?`)) {
      this.songService.removeGlobalTag(tagName);
      if (this.selectedTag() === tagName) {
        this.selectedTag.set(null);
      }
    }
  }
}
