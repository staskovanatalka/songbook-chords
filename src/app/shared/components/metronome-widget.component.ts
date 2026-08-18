import { Component, signal, output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metronome-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed z-[9990] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl rounded-xl p-3 flex items-center gap-3 select-none cursor-move backdrop-blur-md"
      [style.left.px]="posX()"
      [style.top.px]="posY()"
      (mousedown)="startDrag($event)"
      (touchstart)="startDragTouch($event)"
    >
      <!-- IKONA A DRAG HANDLE -->
      <div class="text-[var(--text-muted)] cursor-grab active:cursor-grabbing px-1" title="Chyť a posuň">
        ⋮⋮
      </div>

      <!-- NASTAVENÍ BPM -->
      <div class="flex items-center border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--bg-body)]">
        <button
          type="button"
          (click)="changeBpm(-1)"
          class="w-8 h-8 flex items-center justify-center font-bold text-sm hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
        >-</button>

        <span class="px-3 font-mono font-bold text-sm min-w-[70px] text-center">
          {{ bpm() }} <span class="text-[10px] text-[var(--text-muted)] font-normal">BPM</span>
        </span>

        <button
          type="button"
          (click)="changeBpm(1)"
          class="w-8 h-8 flex items-center justify-center font-bold text-sm hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
        >+</button>
      </div>

      <!-- TLAČÍTKO PLAY / STOP -->
      <button
        type="button"
        (click)="togglePlay()"
        [class.bg-emerald-600]="isPlaying()"
        [class.bg-[var(--primary-color)]]="!isPlaying()"
        class="w-9 h-9 rounded-lg text-white flex items-center justify-center shadow transition-colors cursor-pointer"
      >
        @if (isPlaying()) {
          <!-- Pause Icon -->
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"/>
            <rect x="14" y="4" width="4" height="16"/>
          </svg>
        } @else {
          <!-- Play Icon -->
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        }
      </button>

      <!-- TLAČÍTKO ZAVŘÍT -->
      <button
        type="button"
        (click)="close.emit()"
        class="text-[var(--text-muted)] hover:text-[var(--text-main)] text-sm font-bold p-1 cursor-pointer ml-1"
        title="Zavřít metronom"
      >✕</button>
    </div>
  `
})
export class MetronomeWidgetComponent {
  close = output<void>();

  bpm = signal<number>(120);
  isPlaying = signal<boolean>(false);

  // Pozice na obrazovce (přednastaveno vpravo dole)
  posX = signal<number>(window.innerWidth - 280);
  posY = signal<number>(window.innerHeight - 90);

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private initialPosX = 0;
  private initialPosY = 0;

  changeBpm(delta: number) {
    this.bpm.update(b => Math.max(30, Math.min(250, b + delta)));
  }

  togglePlay() {
    this.isPlaying.update(p => !p);
  }

  // --- LOGIKA PRO PŘETAHOWÁNÍ MYŠÍ A DOTYKEM ---
  startDrag(e: MouseEvent) {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.initialPosX = this.posX();
    this.initialPosY = this.posY();
  }

  startDragTouch(e: TouchEvent) {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    this.isDragging = true;
    this.dragStartX = e.touches[0].clientX;
    this.dragStartY = e.touches[0].clientY;
    this.initialPosX = this.posX();
    this.initialPosY = this.posY();
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;
    const dx = e.clientX - this.dragStartX;
    const dy = e.clientY - this.dragStartY;
    this.posX.set(Math.max(10, Math.min(window.innerWidth - 260, this.initialPosX + dx)));
    this.posY.set(Math.max(10, Math.min(window.innerHeight - 70, this.initialPosY + dy)));
  }

  @HostListener('window:touchmove', ['$event'])
  onTouchMove(e: TouchEvent) {
    if (!this.isDragging) return;
    const dx = e.touches[0].clientX - this.dragStartX;
    const dy = e.touches[0].clientY - this.dragStartY;
    this.posX.set(Math.max(10, Math.min(window.innerWidth - 260, this.initialPosX + dx)));
    this.posY.set(Math.max(10, Math.min(window.innerHeight - 70, this.initialPosY + dy)));
  }

  @HostListener('window:mouseup')
  @HostListener('window:touchend')
  endDrag() {
    this.isDragging = false;
  }
}
