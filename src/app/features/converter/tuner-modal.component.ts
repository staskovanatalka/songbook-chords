import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TunerService } from '../../core/services/tuner.service';
import { Instrument } from '../../core/models/song.model';

@Component({
  selector: 'app-tuner-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
         style="background: rgba(0,0,0,0.4); z-index: 2000; backdrop-filter: blur(2px);"
         (click)="onBackdropClick($event)">
      <div class="card shadow-lg" style="width: 340px; max-width: 90%; border-radius: 12px !important;">
        <div class="card-body p-4 position-relative text-center">

          <button class="position-absolute top-0 end-0 m-3 btn btn-sm btn-outline-secondary border-0 text-muted"
                  style="font-size: 1.1rem; line-height: 1;"
                  (click)="closeModal()">✕</button>

          <h5 class="card-title mb-1 fw-bold">Ladička</h5>
          <div class="small text-muted mb-3 font-monospace" style="font-size: 0.78rem;">
            {{ tunerService.statusMessage() }}
          </div>

          <!-- Pohyblivá stupnice -->
          <div class="position-relative my-3 border rounded-3 overflow-hidden bg-body-tertiary" style="height: 250px;">
            <div class="position-absolute top-0 start-0 w-100 pt-3" style="height: 55px; border-bottom: 1px solid rgba(0,0,0,0.08);">
              <div class="position-absolute start-50 top-0 bottom-0 bg-secondary opacity-25" style="width: 1px;"></div>
              <div class="position-absolute start-50 top-0" style="width: 3px; height: 10px; background-color: var(--primary-color); transform: translateX(-50%);"></div>

              <!-- Pohyblivá kulička -->
              <div class="position-absolute top-50 rounded-circle"
                   [style.left.%]="tunerService.tunerResult()?.percentage ?? 50"
                   [style.background]="tunerService.tunerResult()?.isCentered ? '#00c853' : (tunerService.isListening() ? '#ff9800' : '#6c757d')"
                   style="width: 12px; height: 12px; transform: translate(-50%, -50%); transition: left 0.1s ease;"></div>
            </div>

            <!-- Silueta kytary/ukulele -->
            <div class="position-absolute bottom-0 start-0 w-100 d-flex justify-content-center align-items-center" style="top: 55px;">
              <svg width="200" height="195" viewBox="0 0 200 195">
                <path d="M75,195 L75,160 L65,140 L65,25 Q100,5 135,25 L135,140 L125,160 L125,195 Z" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.25"/>
                <rect x="75" y="165" width="50" height="30" fill="currentColor" opacity="0.1" />
              </svg>
            </div>
          </div>

          <button class="btn btn-sm w-100 py-2 fw-bold text-white"
                  [style.background-color]="tunerService.isListening() ? '#dc3545' : 'var(--primary-color)'"
                  (click)="tunerService.toggleMic(instrument())">
            {{ tunerService.isListening() ? 'Zastavit ladičku' : 'Tap to tune' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class TunerModalComponent {
  tunerService = inject(TunerService);
  instrument = input<Instrument>('GTR');
  close = output<void>();

  closeModal() {
    this.tunerService.stopMic();
    this.close.emit();
  }

  onBackdropClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('position-fixed')) {
      this.closeModal();
    }
  }
}
