import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { PomodoroResponse, SessionType } from '../../../core/models/pomodoro.model';
import { CommonModule } from '@angular/common';
import { PomodoroService } from '../../../core/services/pomodoro.service';

type PomodoroPhase = 'idle' | 'running' | 'paused';

interface SessionConfig {
  type: SessionType;
  label: string;
  minutes: number;
}

@Component({
  selector: 'app-pomodoro',
  imports: [CommonModule],
  templateUrl: './pomodoro.component.html',
  styleUrl: './pomodoro.component.css',
})
export class PomodoroComponent implements OnInit, OnDestroy{
     private pomodoroService = inject(PomodoroService);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  // Session configs
  readonly sessions: SessionConfig[] = [
    { type: 'FOCUS',       label: 'Focus',       minutes: 25 },
    { type: 'SHORT_BREAK', label: 'Short break',  minutes: 5  },
    { type: 'LONG_BREAK',  label: 'Long break',   minutes: 15 }
  ];

  // State
  activeSession  = signal<PomodoroResponse | null>(null);
  selectedConfig = signal<SessionConfig>(this.sessions[0]);
  phase          = signal<PomodoroPhase>('idle');
  secondsLeft    = signal<number>(this.sessions[0].minutes * 60);
  completedCount = signal<number>(0);
  loading        = signal(false);

  // Derived
  minutes = computed(() => Math.floor(this.secondsLeft() / 60));
  seconds = computed(() => this.secondsLeft() % 60);

  progress = computed(() => {
    const total = this.selectedConfig().minutes * 60;
    return ((total - this.secondsLeft()) / total) * 100;
  });

  displayTime = computed(() => {
    const m = String(this.minutes()).padStart(2, '0');
    const s = String(this.seconds()).padStart(2, '0');
    return `${m}:${s}`;
  });

  ngOnInit(): void {
    // Restore any running session from backend
    this.pomodoroService.getActive().subscribe({
      next: session => {
        if (!session) return;
        this.activeSession.set(session);
        this.phase.set('running');

        // Compute remaining seconds from when it started
        const elapsed = Math.floor(
          (Date.now() - new Date(session.startTime).getTime()) / 1000
        );
        const total = session.plannedDurationMinutes * 60;
        const remaining = Math.max(0, total - elapsed);

        const config = this.sessions.find(s => s.type === session.sessionType)
          ?? this.sessions[0];

        this.selectedConfig.set(config);
        this.secondsLeft.set(remaining);
        this.startTick();
      }
    });
  }

  ngOnDestroy(): void {
    this.clearTick();
  }

  selectConfig(config: SessionConfig): void {
    if (this.phase() !== 'idle') return;
    this.selectedConfig.set(config);
    this.secondsLeft.set(config.minutes * 60);
  }

  start(): void {
    this.loading.set(true);
    this.pomodoroService.start({
      sessionType: this.selectedConfig().type,
      plannedDurationMinutes: this.selectedConfig().minutes
    }).subscribe({
      next: session => {
        this.activeSession.set(session);
        this.phase.set('running');
        this.secondsLeft.set(this.selectedConfig().minutes * 60);
        this.startTick();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  pause(): void {
    const session = this.activeSession();
    if (!session) return;

    this.clearTick();
    this.pomodoroService.update(session.id, { status: 'PAUSED' }).subscribe({
      next: updated => {
        this.activeSession.set(updated);
        this.phase.set('paused');
      }
    });
  }

  resume(): void {
    // Start a fresh session with the remaining time
    this.loading.set(true);
    this.pomodoroService.start({
      sessionType: this.selectedConfig().type,
      plannedDurationMinutes: Math.ceil(this.secondsLeft() / 60)
    }).subscribe({
      next: session => {
        this.activeSession.set(session);
        this.phase.set('running');
        this.startTick();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  cancel(): void {
    const session = this.activeSession();
    if (!session) return;

    this.clearTick();
    this.pomodoroService.update(session.id, { status: 'CANCELLED' }).subscribe({
      next: () => this.reset()
    });
  }

  private complete(): void {
    const session = this.activeSession();
    if (!session) return;

    this.clearTick();
    this.pomodoroService.update(session.id, { status: 'COMPLETED' }).subscribe({
      next: () => {
        if (this.selectedConfig().type === 'FOCUS') {
          this.completedCount.update(n => n + 1);
        }
        this.reset();
      }
    });
  }

  private startTick(): void {
    this.clearTick();
    this.intervalId = setInterval(() => {
      this.secondsLeft.update(s => {
        if (s <= 1) {
          this.complete();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  private clearTick(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private reset(): void {
    this.activeSession.set(null);
    this.phase.set('idle');
    this.secondsLeft.set(this.selectedConfig().minutes * 60);
  }
}
