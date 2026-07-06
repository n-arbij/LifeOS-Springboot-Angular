import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { HabitCardComponent } from '../habit-card/habit-card.component';
import { HabitService } from '../../../core/services/habit.service';
import { HabitResponse } from '../../../core/models/habit.model';

@Component({
  selector: 'app-habit-list',
  standalone: true,
  imports: [CommonModule, HabitCardComponent],
  templateUrl: './habit-list.component.html',
  styleUrl: './habit-list.component.css'
})
export class HabitListComponent implements OnInit {
    private habitService = inject(HabitService);
    readonly todayKey = this.toDateKey(new Date());

    habits  = signal<HabitResponse[]>([]);
    loading = signal(false);
    error   = signal<string | null>(null);

    readonly weekDays = this.buildWeekDays();

    ngOnInit(): void {
        this.loadHabits();
    }

    onLogged(habitId: string): void {
        this.habitService.getById(habitId).subscribe({
        next: updated => {
            this.habits.update(habits =>
            habits.map(h => h.id === habitId ? updated : h)
            );
        }
        });
    }

    private loadHabits(): void {
        this.loading.set(false);
        this.habitService.getAll().subscribe({
        next: () => {
            this.loading.set(false);
        },
        error: () => {
            this.error.set('Could not load habits.');
            this.loading.set(false);
        }
        });
    }

    private buildWeekDays(): { label: string; date: string }[] {
        const days = [];
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

        for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        days.push({
            label: d.toLocaleDateString('default', { weekday: 'short' }),
            date:  this.toDateKey(d)
        });
        }
        return days;
    }

    private toDateKey(date: Date): string {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
}