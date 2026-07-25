import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../core/services/theme.service';
import { MetronomeService } from '../../core/services/metronome.service';
import { TunerService } from '../../core/services/tuner.service';
import { SongService } from '../../core/services/song.service';
import { Instrument } from '../../core/models/song.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="w-full px-4 border-b border-[var(--border-color)] mb-3 py-2 bg-[var(--bg-card)]">
      <div class="flex justify-between items-center gap-2">

        <!-- VLEVO: Tlačítka Sidebar a Přidat -->
        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            class="h-8 w-8 flex items-center justify-center rounded border bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
            title="Schovat/Zobrazit panel"
            (click)="songService.toggleSidebar()"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" ry="3"></rect>
              @if (songService.isSidebarCollapsed()) {
                <line x1="7" y1="6.5" x2="7" y2="17.5"></line>
              } @else {
                <rect x="5" y="5.5" width="4.5" height="13" rx="1.5" fill="currentColor" stroke="none"></rect>
              }
            </svg>
          </button>

          <button
            type="button"
            class="h-8 w-8 flex items-center justify-center rounded border bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
            title="Přidat novou písničku"
            (click)="openConverter.emit()"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>

        <!-- VPRAVO: Nástroje, Metronom, Akcent a Téma -->
        <div class="flex items-center gap-2 shrink-0">

          <!-- Výběr barvy -->
          <div class="relative flex items-center justify-center h-8 w-8">
            <button
              type="button"
              class="h-full w-full flex items-center justify-center rounded border bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] transition-colors"
              title="Změnit hlavní barvu"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 11.17 21.3 10.5 20.43 10.5H18.5C17.67 10.5 17 9.83 17 9V6.5C17 4.57 15.43 3 13.5 3H12C6.47715 3 2 7.47715 2 12C2 17.5228 6.47715 22 12 22Z"></path>
                <circle cx="7.5" cy="10.5" r="1.5" fill="currentColor"></circle>
                <circle cx="11.5" cy="7.5" r="1.5" fill="currentColor"></circle>
                <circle cx="16.5" cy="9.5" r="1.5" fill="currentColor"></circle>
                <circle cx="15.5" cy="14.5" r="1.5" fill="currentColor"></circle>
              </svg>
            </button>
            <input
              type="color"
              [ngModel]="themeService.accentColor()"
              (ngModelChange)="themeService.setAccentColor($event)"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
          </div>

          <!-- METRONOM -->
          <div class="flex items-center gap-1">
            <div class="flex items-center h-8 rounded overflow-hidden border bg-[var(--bg-card)] border-[var(--border-color)]">
              <button
                type="button"
                class="h-full px-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] font-mono text-sm cursor-pointer"
                (click)="metronomeService.setBpm(-5)"
                title="Zpomalit (-5 BPM)"
              >–</button>

              <div class="flex items-center justify-center px-2 h-full min-w-[68px] border-x border-[var(--border-color)] font-mono">
                <span class="font-bold text-xs mr-1 text-[var(--text-main)]">{{ metronomeService.bpm() }}</span>
                <span class="text-[10px] text-[var(--text-muted)] opacity-75">BPM</span>
                <div
                  class="w-1.5 h-1.5 rounded-full ml-1.5 transition-opacity"
                  [style.background-color]="metronomeService.isPlaying() ? 'var(--primary-color, #2563eb)' : '#aaa'"
                  [style.opacity]="metronomeService.isPlaying() ? '1' : '0.4'"
                ></div>
              </div>

              <button
                type="button"
                class="h-full px-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] font-mono text-sm cursor-pointer"
                (click)="metronomeService.setBpm(5)"
                title="Zrychlit (+5 BPM)"
              >+</button>
            </div>

            <!-- Start / Stop Metronom -->
            <button
              type="button"
              class="h-8 w-8 flex items-center justify-center rounded border bg-[var(--bg-card)] border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
              (click)="metronomeService.toggle()"
              title="Spustit/Zastavit metronom"
            >
              @if (!metronomeService.isPlaying()) {
                <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--primary-color, #2563eb)" stroke="var(--primary-color, #2563eb)" stroke-width="2">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              } @else {
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#dc3545" stroke="#dc3545" stroke-width="2">
                  <rect x="4" y="4" width="16" height="16" rx="2"></rect>
                </svg>
              }
            </button>
          </div>

          <!-- LADIČKA -->
          <button
            type="button"
            class="h-8 px-2 flex items-center justify-center rounded border bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
            title="Otevřít ladičku"
            (click)="openTuner.emit()"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </button>

          <!-- NÁSTROJ -->
          <button
            type="button"
            class="h-8 px-2 flex items-center justify-center rounded border bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] font-mono font-bold text-xs transition-colors cursor-pointer"
            title="Změnit nástroj"
            (click)="songService.toggleInstrument()"
          >
            {{ songService.currentInstrument() }}
          </button>

          <!-- NOTACE -->
          <button
            type="button"
            class="h-8 px-2 flex items-center justify-center rounded border bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] font-mono font-bold text-xs transition-colors cursor-pointer"
            title="Změnit notaci akordů"
            (click)="songService.toggleNotation()"
          >
            {{ songService.currentNotation() }}
          </button>

          <!-- DARK / LIGHT REŽIM -->
          <button
            type="button"
            class="h-8 px-2 flex items-center justify-center rounded border bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
            title="Přepnout tmavý/světlý režim"
            (click)="themeService.toggleTheme()"
          >
            @if (themeService.theme() === 'light') {
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            } @else {
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            }
          </button>

        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  themeService: ThemeService = inject(ThemeService);
  metronomeService: MetronomeService = inject(MetronomeService);
  tunerService: TunerService = inject(TunerService);
  songService: SongService = inject(SongService);

  openConverter = output<void>();
  openTuner = output<void>();

}
