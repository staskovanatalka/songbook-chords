import { Component, inject, output, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../core/services/theme.service';
import { MetronomeService } from '../../core/services/metronome.service';
import { SongService } from '../../core/services/song.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="w-full px-4 border-b border-[var(--border-color)] py-2 bg-[var(--bg-card)]">
      <div class="flex justify-between items-center gap-2">

        <!-- VLEVO: Navigace a správa obsahu -->
        <div class="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            class="btn-icon"
            title="Schovat/Zobrazit panel"
            (click)="songService.toggleSidebar()"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
            class="btn-icon"
            title="Přidat novou písničku do katalogu"
            (click)="openConverter.emit()"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>

        <!-- VPRAVO: Pomůcky | Systémové prvky -->
        <div class="flex items-center gap-1.5 shrink-0">

          <!-- 1. METRONOM -->
          <div class="flex items-center gap-1.5">
            @if (isMetronomeBarOpen()) {
              <div class="inline-flex items-center gap-1 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-0.5 h-[31px] font-mono text-xs shadow-xs animate-fade-in">
                <button
                  type="button"
                  (click)="metronomeService.setBpm(-5)"
                  class="h-6 w-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] font-bold cursor-pointer transition-colors"
                  title="Zpomalit (-5 BPM)"
                >–</button>

                <div class="px-2 h-6 flex items-center justify-center font-bold text-[var(--primary-color)] text-xs min-w-[58px]">
                  {{ metronomeService.bpm() }} <span class="text-[10px] ml-0.5 opacity-70 font-normal">BPM</span>
                </div>

                <button
                  type="button"
                  (click)="metronomeService.setBpm(5)"
                  class="h-6 w-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] font-bold cursor-pointer transition-colors"
                  title="Zrychlit (+5 BPM)"
                >+</button>

                <button
                  type="button"
                  (click)="metronomeService.toggle()"
                  [class.bg-emerald-600]="metronomeService.isPlaying()"
                  class="btn-primary h-6 px-2.5 text-[11px] ml-0.5"
                >
                  @if (metronomeService.isPlaying()) {
                    <span>STOP</span>
                  } @else {
                    <span>START</span>
                  }
                </button>
              </div>
            }

            <button
              type="button"
              (click)="isMetronomeBarOpen.set(!isMetronomeBarOpen())"
              class="btn-icon"
              [class.btn-active]="isMetronomeBarOpen() || metronomeService.isPlaying()"
              title="Metronom"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </button>
          </div>

          <!-- 2. LADIČKA -->
          <button
            type="button"
            class="btn-icon"
            title="Otevřít ladičku"
            (click)="openTuner.emit()"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </button>

          <!-- Oddělovač -->
          <div class="h-4 w-[1px] bg-[var(--border-color)] mx-1"></div>

          <!-- 3. REŽIM (LIGHT / DARK) -->
          <button
            type="button"
            class="btn-icon"
            title="Přepnout tmavý/světlý režim"
            (click)="themeService.toggleTheme()"
          >
            @if (themeService.theme() === 'light') {
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
            } @else {
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            }
          </button>

          <!-- 4. NASTAVENÍ A PROFIL -->
          <div class="relative flex items-center settings-container">
            <button
              type="button"
              (click)="toggleMenu($event)"
              class="btn-icon"
              [class.btn-active]="isMenuOpen()"
              title="Nastavení a účet"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>

            <!-- DROPDOWN MENU -->
            @if (isMenuOpen()) {
              <div class="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl p-2 z-[100] font-sans">

                <!-- 1. PROFILOVKA, JMÉNO A E-MAIL V HORNÍ ČÁSTI -->
                @if (authService.currentUser(); as user) {
                  <div class="flex items-center gap-3 p-2 border-b border-[var(--border-color)] pb-2.5 mb-1.5">
                    @if (user.photoURL) {
                      <img
                        [src]="user.photoURL"
                        referrerpolicy="no-referrer"
                        class="w-10 h-10 min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px] rounded-xl object-cover border border-[var(--border-color)] shrink-0"
                      />
                    } @else {
                      <div class="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-[var(--primary-color-alpha)] text-[var(--primary-color)] flex items-center justify-center text-sm font-bold font-mono shrink-0">
                        {{ user.displayName?.charAt(0) || user.email?.charAt(0) || 'U' }}
                      </div>
                    }

                    <div class="min-w-0 flex-1 text-left">
                      <p class="text-xs font-bold text-[var(--text-main)] truncate leading-tight">
                        {{ user.displayName || 'Uživatel' }}
                      </p>
                      <p class="text-[11px] text-[var(--text-muted)] truncate font-mono mt-0.5 leading-tight">
                        {{ user.email }}
                      </p>
                    </div>
                  </div>
                }

                <div class="space-y-1">
                  <!-- 2. NASTAVENÍ -->
                  <button
                    type="button"
                    (click)="openSettingsModal()"
                    class="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--text-muted)]">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    <span>Nastavení</span>
                  </button>

                  <div class="my-1 border-t border-[var(--border-color)]"></div>

                  <!-- 3. ODHLÁSIT SE -->
                  <button
                    type="button"
                    (click)="handleLogout()"
                    class="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span>Odhlásit se</span>
                  </button>
                </div>

              </div>
            }
          </div>

        </div>
      </div>
    </header>

    <!-- MODAL NASTAVENÍ -->
    @if (isSettingsOpen()) {
      <div class="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
        <div class="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-sm shadow-2xl p-5 overflow-hidden">

          <div class="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border-color)]">
            <h3 class="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Nastavení
            </h3>
            <button
              type="button"
              (click)="isSettingsOpen.set(false)"
              class="h-7 w-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] transition-colors cursor-pointer text-base"
            >
              ✕
            </button>
          </div>

          <div class="space-y-4">
            <!-- NÁSTROJ -->
            <div>
              <label class="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                Nástroj pro akordy
              </label>
              <div class="segmented-control h-8">
                <button
                  type="button"
                  (click)="songService.setInstrument('GTR')"
                  class="segmented-item font-mono"
                  [class.segmented-item-active]="songService.currentInstrument() === 'GTR'"
                >
                  🎸 Kytara (GTR)
                </button>
                <button
                  type="button"
                  (click)="songService.setInstrument('UKU')"
                  class="segmented-item font-mono"
                  [class.segmented-item-active]="songService.currentInstrument() === 'UKU'"
                >
                  🪕 Ukulele (UKU)
                </button>
              </div>
            </div>

            <!-- NOTACE -->
            <div>
              <label class="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                Systém notace akordů
              </label>
              <div class="segmented-control h-8">
                <button
                  type="button"
                  (click)="songService.setNotation('CZ')"
                  class="segmented-item font-mono"
                  [class.segmented-item-active]="songService.currentNotation() === 'CZ'"
                >
                  Česká (H, B)
                </button>
                <button
                  type="button"
                  (click)="songService.setNotation('EN')"
                  class="segmented-item font-mono"
                  [class.segmented-item-active]="songService.currentNotation() === 'EN'"
                >
                  Anglická (B, Bb)
                </button>
              </div>
            </div>

            <!-- BARVA AKCENTU -->
            <div>
              <label class="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                Barva motivu
              </label>
              <div class="flex items-center justify-between p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)]">
                <div class="flex items-center gap-2.5">
                  <div
                    class="w-6 h-6 rounded-lg border border-[var(--border-color)] shadow-xs"
                    [style.backgroundColor]="themeService.accentColor()"
                  ></div>
                  <span class="text-xs font-mono font-medium text-[var(--text-main)]">
                    {{ themeService.accentColor() }}
                  </span>
                </div>
                <div class="relative">
                  <button type="button" class="btn-text text-xs">Změnit barvu</button>
                  <input
                    type="color"
                    [ngModel]="themeService.accentColor()"
                    (ngModelChange)="themeService.setAccentColor($event)"
                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  >
                </div>
              </div>
            </div>
          </div>

          <div class="mt-5 pt-3 border-t border-[var(--border-color)] flex justify-end">
            <button
              type="button"
              (click)="isSettingsOpen.set(false)"
              class="btn-primary w-full"
            >
              Hotovo
            </button>
          </div>

        </div>
      </div>
    }
  `
})
export class HeaderComponent {
  themeService: ThemeService = inject(ThemeService);
  metronomeService: MetronomeService = inject(MetronomeService);
  songService: SongService = inject(SongService);
  authService: AuthService = inject(AuthService);
  private elementRef = inject(ElementRef);

  openConverter = output<void>();
  openTuner = output<void>();

  isMenuOpen = signal<boolean>(false);
  isSettingsOpen = signal<boolean>(false);
  isMetronomeBarOpen = signal<boolean>(false);

  toggleMenu(event: MouseEvent) {
    event.stopPropagation();
    this.isMetronomeBarOpen.set(false);
    this.isMenuOpen.update(v => !v);
  }

  openSettingsModal() {
    this.isMenuOpen.set(false);
    this.isSettingsOpen.set(true);
  }

  handleLogout() {
    this.isMenuOpen.set(false);
    this.authService.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isMenuOpen.set(false);
      this.isMetronomeBarOpen.set(false);
    }
  }
}
