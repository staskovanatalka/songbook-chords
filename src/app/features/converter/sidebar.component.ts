import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SongService } from '../../core/services/song.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="h-full bg-[var(--bg-card)] border-r border-[var(--border-color)] transition-all duration-200 ease-in-out overflow-hidden"
      [class.w-0]="songService.isSidebarCollapsed()"
      [class.w-64]="!songService.isSidebarCollapsed()"
    >
      <div class="w-64 p-3 flex flex-col h-full font-sans">

        <!-- VYHLEDÁVÁNÍ A ŘAZENÍ -->
        <div class="flex flex-col gap-2 mb-3 shrink-0">
          <input
            type="text"
            placeholder="Hledat písničku..."
            [ngModel]="songService.searchQuery()"
            (ngModelChange)="songService.searchQuery.set($event)"
            class="w-full px-2.5 py-1.5 text-xs rounded border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-color)]"
          >
          <select
            [ngModel]="songService.sortBy()"
            (ngModelChange)="songService.sortBy.set($event)"
            class="w-full px-2 py-1.5 text-xs rounded border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-color)] cursor-pointer"
          >
            <option value="title-asc">Název: A-Z</option>
            <option value="title-desc">Název: Z-A</option>
            <option value="artist-asc">Autor: A-Z</option>
            <option value="artist-desc">Autor: Z-A</option>
          </select>
        </div>

        <!-- SEZNAM PÍSNIČEK (Předěláno na čistý Tailwind) -->
        <div class="overflow-y-auto flex-1 pr-1">
          @if (songService.isLoading()) {
            <p class="text-xs text-[var(--text-muted)] p-2">Načítám z Firebase...</p>
          } @else {
            <ul class="space-y-1">
              @for (song of songService.filteredSongs(); track song.id) {
                <li>
                  <button
                    type="button"
                    (click)="songService.selectSong(song)"
                    [class.sidebar-item-active]="song.id === songService.activeSong()?.id"
                    class="w-full text-left px-3 py-1.5 rounded-r-xl text-xs truncate text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] transition-all cursor-pointer block"
                  >
                    <span class="font-medium text-[var(--text-main)]">{{ song.title }}</span>
                    <span class="text-[var(--text-muted)] opacity-75 ml-1.5">— {{ song.artist }}</span>
                  </button>
                </li>
              } @empty {
                <li class="text-xs text-[var(--text-muted)] p-2 italic">Žádné písničky nenalezeny</li>
              }
            </ul>
          }
        </div>

      </div>
    </div>
  `
})
export class SidebarComponent {
  songService = inject(SongService);
}
