import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { HabitDaySummary, HabitResponse, HabitWeekSummary } from '../../../core/models/habit.model';
import { HabitService } from '../../../core/services/habit.service';

@Component({
  selector: 'app-habit-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './habit-card.component.html',
  styleUrl: './habit-card.component.css'
})
export class HabitCardComponent implements OnInit {
    @Input({ required: true }) habit!: HabitResponse;
    @Input({ required: true }) weekDays!: { label: string; date: string }[];
    @Output() logged = new EventEmitter<string>();
    @Output() editRequested = new EventEmitter<void>();

    private habitService = inject(HabitService);

    weekSummary = signal<HabitWeekSummary | null>(null);
    logging     = signal<string | null>(null);

    readonly today = this.toDateKey(new Date());

    ngOnInit(): void {
        this.loadWeekSummary();
    }

    getDaySummary(dateKey: string): HabitDaySummary | null {
        return this.weekSummary()?.days.find(d => d.date === dateKey) ?? null;
    }

    toggleDay(dateKey: string): void {
        const summary = this.getDaySummary(dateKey);

        // Only allow logging today or past days
        if (dateKey > this.today) return;

        // Only allow logging scheduled days
        if (summary && !summary.scheduled) return;

        const completed = summary ? !summary.completed : true;

        this.logging.set(dateKey);
        this.habitService.log(this.habit.id, {
        logDate:   dateKey,
        completed,
        value:     completed && this.habit.targetValue ? this.habit.targetValue : undefined
        }).subscribe({
        next: () => {
            this.loadWeekSummary();
            this.logged.emit(this.habit.id);
            this.logging.set(null);
        },
        error: () => this.logging.set(null)
        });
    }

    getDayState(dateKey: string): 'completed' | 'missed' | 'scheduled' | 'unscheduled' | 'future' {
        if (dateKey > this.today) return 'future';
        const summary = this.getDaySummary(dateKey);
        if (!summary || !summary.scheduled) return 'unscheduled';
        if (summary.completed) return 'completed';
        if (dateKey < this.today) return 'missed';
        return 'scheduled';
    }

    private loadWeekSummary(): void {
        const weekStart = this.weekDays[0].date;
        this.habitService.getWeekSummary(this.habit.id, weekStart).subscribe({
        next: summary => this.weekSummary.set(summary)
        });
    }

    private toDateKey(date: Date): string {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
}