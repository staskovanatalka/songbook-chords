import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-strumming-pattern',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (strokes().length > 0) {
      <div class="p-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded shadow-lg">
        <svg
          [attr.width]="svgWidth()"
          height="70"
          [attr.viewBox]="'0 0 ' + svgWidth() + ' 70'"
          class="font-mono text-[var(--primary-color)]"
        >
          @for (stroke of strokes(); track $index) {
            <!-- Text doby (pr - vá - dru - há...) -->
            <text
              [attr.x]="padding + ($index * strokeWidth) + (strokeWidth / 2)"
              y="16"
              text-anchor="middle"
              font-size="10"
              font-weight="700"
              fill="#6c757d"
            >{{ beatNames[$index] || '' }}</text>

            <!-- Taktové čáry pro celé doby -->
            @if ($index > 0 && $index % 2 === 0) {
              <line
                [attr.x1]="padding + ($index * strokeWidth)"
                y1="4"
                [attr.x2]="padding + ($index * strokeWidth)"
                y2="52"
                stroke="var(--border-color)"
                stroke-width="1.2"
              />
            }

            <!-- Grafické symboly úderů -->
            <g>
              <!-- Šipka DOLŮ (v / d) -->
              @if (stroke.type === 'down') {
                <line
                  [attr.x1]="getX($index)" y1="24"
                  [attr.x2]="getX($index)" y2="46"
                  stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                />
                <path
                  [attr.d]="'M ' + (getX($index) - 4) + ' 40 L ' + getX($index) + ' 47 L ' + (getX($index) + 4) + ' 40'"
                  fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                />
              }

              <!-- Šipka NAHORU (^ / u) -->
              @if (stroke.type === 'up') {
                <line
                  [attr.x1]="getX($index)" y1="46"
                  [attr.x2]="getX($index)" y2="24"
                  stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                />
                <path
                  [attr.d]="'M ' + (getX($index) - 4) + ' 30 L ' + getX($index) + ' 23 L ' + (getX($index) + 4) + ' 30'"
                  fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                />
              }

              <!-- Tlumený úder (x) -->
              @if (stroke.type === 'mute') {
                <line
                  [attr.x1]="getX($index) - 4" y1="31"
                  [attr.x2]="getX($index) + 4" y2="41"
                  stroke="#dc3545" stroke-width="2.5" stroke-linecap="round"
                />
                <line
                  [attr.x1]="getX($index) + 4" y1="31"
                  [attr.x2]="getX($index) - 4" y2="41"
                  stroke="#dc3545" stroke-width="2.5" stroke-linecap="round"
                />
              }

              <!-- Pauza (-) -->
              @if (stroke.type === 'pause') {
                <line
                  [attr.x1]="getX($index) - 3" y1="35"
                  [attr.x2]="getX($index) + 3" y2="35"
                  stroke="#adb5bd" stroke-width="2" stroke-linecap="round"
                />
              }
            </g>
          }
        </svg>
      </div>
    }
  `
})
export class StrummingPatternComponent {
  pattern = input<string>('');

  strokeWidth = 30;
  padding = 10;
  beatNames = ["pr", "vá", "dru", "há", "tře", "tí", "čtvr", "tá", "pá", "tá"];

  strokes = computed(() => {
    const raw = this.pattern().replace(/[\[\]\s]/g, '');
    if (!raw) return [];

    return raw.split('').map(char => {
      const c = char.toLowerCase();
      if (c === 'v' || c === 'd') return { type: 'down' };
      if (c === '^' || c === 'u') return { type: 'up' };
      if (c === 'x') return { type: 'mute' };
      return { type: 'pause' };
    });
  });

  svgWidth = computed(() => {
    return (this.strokes().length * this.strokeWidth) + (this.padding * 2);
  });

  getX(index: number): number {
    return this.padding + (index * this.strokeWidth) + (this.strokeWidth / 2);
  }
}
