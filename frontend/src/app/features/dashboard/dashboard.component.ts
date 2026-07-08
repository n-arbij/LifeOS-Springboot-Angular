import { Component, inject, signal } from '@angular/core';
import { EventService } from '../../core/services/event.service';
import { EventSummaryResponse } from '../../core/models/event.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PomodoroSummaryResponse } from '../../core/models/pomodoro.model';
import { PomodoroService } from '../../core/services/pomodoro.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
    readonly today = new Date();
    private eventService = inject(EventService);
    private pomodoroService = inject(PomodoroService);

    upcomingEvents = signal<EventSummaryResponse[]>([]);
    loading        = signal(false);
    error          = signal<string | null>(null);

    ngOnInit(): void {
        this.loadEvents();
        this.loadSummary();
    }

    formatTime(instant: string): string {
        return new Date(instant).toLocaleTimeString('default', {
        hour: '2-digit',
        minute: '2-digit'
        });
    }

    formatDate(instant: string): string {
        return new Date(instant).toLocaleDateString('default', {
        weekday: 'short',
        month:   'short',
        day:     'numeric'
        });
    }

    isToday(instant: string): boolean {
        const date  = new Date(instant);
        const today = new Date();
        return (
        date.getDate()     === today.getDate()     &&
        date.getMonth()    === today.getMonth()    &&
        date.getFullYear() === today.getFullYear()
        );
    }

    private loadEvents(): void {
        const now   = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        this.loading.set(true);
        this.eventService.getAll(month).subscribe({
        next: events => {
            // Only show upcoming — sort by startTime, cap at 5
            const upcoming = events
            .filter(e => new Date(e.startTime) >= now)
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .slice(0, 5);

            this.upcomingEvents.set(upcoming);
            this.loading.set(false);
        },
        error: () => {
            this.error.set('Could not load events.');
            this.loading.set(false);
        }
        });
    }

    summary = signal<PomodoroSummaryResponse | null>(null);

    private loadSummary(): void {
        const today = new Date().toISOString().split('T')[0];
        this.pomodoroService.getSummary(today).subscribe({
            next: s => this.summary.set(s)
        });
    }
}
