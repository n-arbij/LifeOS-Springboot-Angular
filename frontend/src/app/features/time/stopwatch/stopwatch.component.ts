import { CommonModule } from '@angular/common';
import { Component, computed, OnDestroy, signal } from '@angular/core';

@Component({
  selector: 'app-stopwatch',
  imports: [CommonModule],
  templateUrl: './stopwatch.component.html',
  styleUrl: './stopwatch.component.css',
})
export class StopwatchComponent implements OnDestroy{
    private intervalId: ReturnType<typeof setInterval> | null = null;

    running = signal(false);
    totalMs = signal(0);
    laps    = signal<string[]>([]);

    hours = computed(() => Math.floor(this.totalMs() / 3600000));
    minutes = computed(() => Math.floor((this.totalMs() % 3600000) / 60000));
    seconds = computed(() => Math.floor((this.totalMs() % 60000) / 1000));
    millis  = computed(() => Math.floor((this.totalMs() % 1000) / 10));

    displayTime = computed(() => {
        const h = String(this.hours()).padStart(2, '0');
        const m = String(this.minutes()).padStart(2, '0');
        const s = String(this.seconds()).padStart(2, '0');
        const ms = String(this.millis()).padStart(2, '0');
        return `${h}:${m}:${s}.${ms}`;
    });

    ngOnDestroy(): void {
        this.clearTick();
    }

    start(): void {
        this.running.set(true);
        const startTime = Date.now() - this.totalMs();
        this.intervalId = setInterval(() => {
        this.totalMs.set(Date.now() - startTime);
        }, 10);
    }

    pause(): void {
        this.running.set(false);
        this.clearTick();
    }

    lap(): void {
        this.laps.update(laps => [this.displayTime(), ...laps]);
    }

    reset(): void {
        this.clearTick();
        this.running.set(false);
        this.totalMs.set(0);
        this.laps.set([]);
    }

    private clearTick(): void {
        if (this.intervalId !== null) {
        clearInterval(this.intervalId);
        this.intervalId = null;
        }
    }
}
