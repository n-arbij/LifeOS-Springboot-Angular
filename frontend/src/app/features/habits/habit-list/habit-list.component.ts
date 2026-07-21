import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HabitCardComponent } from '../habit-card/habit-card.component';
import { HabitDrawerComponent } from '../habit-drawer/habit-drawer.component';
import { HabitService } from '../../../core/services/habit.service';
import { HabitPayload, HabitResponse, LogHabitRequest } from '../../../core/models/habit.model';

interface WeekDay {
  date: string; // ISO yyyy-MM-dd
  label: string;
}

@Component({
  selector: 'app-habit-list-page',
  standalone: true,
  imports: [CommonModule, HabitCardComponent, HabitDrawerComponent],
  templateUrl: './habit-list.component.html',
  styleUrl: './habit-list.component.css',
})
export class HabitListComponent implements OnInit {
  private habitService = inject(HabitService);

  habits = signal<HabitResponse[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  page = signal(0);
  pageSize = 10;
  totalPages = signal(0);

  weekDays: WeekDay[] = this.buildWeekDays();
  todayKey = this.toIsoDate(new Date());

  drawerOpen = signal(false);
  drawerHabit = signal<HabitResponse | null>(null);

  ngOnInit() {
    this.fetchHabits();
  }

  private buildWeekDays(): WeekDay[] {
    const today = new Date();
    const dayOfWeek = (today.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek);

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return { date: this.toIsoDate(d), label: labels[i] };
    });
  }

  private toIsoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  fetchHabits() {
    this.loading.set(true);
    this.error.set(null);

    this.habitService.getAll(this.page(), this.pageSize).subscribe({
      next: (res) => {
        this.habits.set(res.content);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load habits. Please try again.');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  // ============ DRAWER ============
  openCreate() {
    this.drawerHabit.set(null);
    this.drawerOpen.set(true);
  }

  openEdit(habit: HabitResponse) {
    this.drawerHabit.set(habit);
    this.drawerOpen.set(true);
  }

  closeDrawer() {
    this.drawerOpen.set(false);
  }

  onSaved(payload: HabitPayload) {
    const isEdit = !!payload.id;
    const request$ = isEdit
      ? this.habitService.update(payload.id!, payload)
      : this.habitService.create(payload);

    request$.subscribe({
      next: () => {
        this.drawerOpen.set(false);
        this.fetchHabits();
      },
      error: (err) => {
        this.error.set(isEdit ? 'Failed to update habit.' : 'Failed to create habit.');
        console.error(err);
      },
    });
  }

  onDeleted(id: string) {
    this.habitService.delete(id).subscribe({
      next: () => {
        this.drawerOpen.set(false);
        this.habits.update((list) => list.filter((h) => h.id !== id));
      },
      error: (err) => {
        this.error.set('Failed to delete habit.');
        console.error(err);
      },
    });
  }

  onLogged(habitId: string) {
        this.fetchHabits();
    }
}