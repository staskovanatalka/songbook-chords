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
        </div>

        <!-- VPRAVO: Nástroje, Téma a Profilové Menu -->
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

          <!-- Tlačítko Nástroj -->
          <button
            type="button"
            (click)="songService.toggleInstrument()"
            class="h-8 px-2.5 rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] text-xs font-mono font-medium hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          >
            {{ songService.currentInstrument() }}
          </button>

          <!-- Tlačítko Notace -->
          <button
            type="button"
            (click)="songService.toggleNotation()"
            class="h-8 px-2.5 rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] text-xs font-mono font-medium hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
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

          <!-- PROFILOVÉ TLAČÍTKO S DROPDOWN MENU -->
          @if (authService.currentUser(); as user) {
            <div class="relative pl-2 border-l border-[var(--border-color)] flex items-center">

              <!-- Kulaté tlačítko s fotkou -->
              <button
                type="button"
                (click)="toggleUserMenu($event)"
                class="w-8 h-8 rounded-full border border-[var(--border-color)] overflow-hidden flex items-center justify-center bg-[var(--bg-card)] hover:ring-2 hover:ring-[var(--primary-color)] transition-all cursor-pointer p-0 shrink-0 select-none"
                title="{{ user.displayName || user.email }}"
              >
                @if (user.photoURL) {
                  <img
                    [src]="user.photoURL"
                    [alt]="user.displayName || 'Profil'"
                    referrerpolicy="no-referrer"
                    class="w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] object-cover rounded-full"
                  />
                } @else {
                  <div class="w-full h-full bg-[var(--primary-color-alpha)] text-[var(--primary-color)] flex items-center justify-center text-xs font-bold font-mono">
                    {{ user.displayName?.charAt(0) || user.email?.charAt(0) || 'U' }}
                  </div>
                }
              </button>

              <!-- Rozbalovací nabídka (Dropdown) -->
              @if (isUserMenuOpen()) {
                <div class="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl p-3 z-[100] font-sans">

                  <!-- Hlavička uživatele -->
                  <div class="flex items-center gap-3 pb-3 border-b border-[var(--border-color)]">
                    @if (user.photoURL) {
                      <img
                        [src]="user.photoURL"
                        referrerpolicy="no-referrer"
                        class="w-10 h-10 min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px] rounded-full object-cover border border-[var(--border-color)] shrink-0"
                      />
                    } @else {
                      <div class="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-[var(--primary-color-alpha)] text-[var(--primary-color)] flex items-center justify-center text-sm font-bold font-mono shrink-0">
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

                  <!-- Tlačítko odhlášení -->
                  <div class="pt-2">
                    <button
                      type="button"
                      (click)="handleLogout()"
                      class="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
          }
        </div>
      </div>
    </header>
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

  isUserMenuOpen = signal<boolean>(false);

  toggleUserMenu(event: MouseEvent) {
    event.stopPropagation();
    this.isUserMenuOpen.update(v => !v);
  }

  handleLogout() {
    this.isUserMenuOpen.set(false);
    this.authService.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isUserMenuOpen.set(false);
    }
  }
}
