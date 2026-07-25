import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'songbook_theme';
  private readonly COLOR_KEY = 'songbook_accent_color';

  // Načtení uložených hodnot z localStorage (výchozí: 'light' a modrá barva)
  private savedTheme = (localStorage.getItem(this.THEME_KEY) as ThemeMode) || 'light';
  private savedColor = localStorage.getItem(this.COLOR_KEY) || '#1a73e8';

  theme = signal<ThemeMode>(this.savedTheme);
  accentColor = signal<string>(this.savedColor);

  constructor() {
    // Aplikujeme načtené hodnoty hned při startu aplikace
    this.applyTheme(this.theme());
    this.applyAccentColor(this.accentColor());
  }

  toggleTheme() {
    const nextTheme: ThemeMode = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(nextTheme);
    localStorage.setItem(this.THEME_KEY, nextTheme);
    this.applyTheme(nextTheme);
  }

  setAccentColor(color: string) {
    this.accentColor.set(color);
    localStorage.setItem(this.COLOR_KEY, color);
    this.applyAccentColor(color);
  }

  private applyTheme(theme: ThemeMode) {
    const htmlEl = document.documentElement;
    htmlEl.setAttribute('data-bs-theme', theme);

    if (theme === 'dark') {
      htmlEl.classList.add('dark');
    } else {
      htmlEl.classList.remove('dark');
    }
  }

  private applyAccentColor(color: string) {
    const htmlEl = document.documentElement;
    htmlEl.style.setProperty('--primary-color', color);

    // Výpočet průhlednosti pro alpha variantu tlačítka -1/+1
    const r = parseInt(color.slice(1, 3), 16) || 26;
    const g = parseInt(color.slice(3, 5), 16) || 115;
    const b = parseInt(color.slice(5, 7), 16) || 232;
    htmlEl.style.setProperty('--primary-color-alpha', `rgba(${r}, ${g}, ${b}, 0.15)`);
  }
}
