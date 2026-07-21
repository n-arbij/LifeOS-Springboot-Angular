import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HabitDrawerComponent } from '../habit-drawer/habit-drawer.component';
import { HabitService } from '../../../core/services/habit.service';
import { HabitPayload, HabitResponse } from '../../../core/models/habit.model';

@Component({
  selector: 'app-habit-manage',
  standalone: true,
  imports: [CommonModule, HabitDrawerComponent],
  templateUrl: './habit-manage.component.html',
  styleUrl: './habit-manage.component.css',
})
export class HabitManageComponent implements OnInit {
  private habitService = inject(HabitService);

  habits = signal<HabitResponse[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  page = signal(0);
  pageSize = 20; // larger page size for a management view
  totalPages = signal(0);

  drawerOpen = signal(false);
  drawerHabit = signal<HabitResponse | null>(null);

  selectMode = signal(false);
  selectedIds = signal<Set<string>>(new Set());
  deleting = signal(false);

  selectedCount = computed(() => this.selectedIds().size);
  allSelected = computed(() =>
    this.habits().length > 0 && this.selectedIds().size === this.habits().length
  );

  ngOnInit() {
    this.fetchHabits();
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
    if (this.selectMode()) {
      this.toggleSelect(habit.id);
      return;
    }
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

  // ============ SELECT MODE / BULK DELETE ============
  toggleSelectMode() {
    this.selectMode.update((v) => !v);
    this.selectedIds.set(new Set());
  }

  toggleSelect(id: string) {
    const ids = new Set(this.selectedIds());
    ids.has(id) ? ids.delete(id) : ids.add(id);
    this.selectedIds.set(ids);
  }

  toggleSelectAll() {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.habits().map((h) => h.id)));
    }
  }

  deleteSelected() {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} habit${ids.length === 1 ? '' : 's'}? This can't be undone.`)) {
      return;
    }

    this.deleting.set(true);
    this.error.set(null);

    let completed = 0;
    let failed = 0;

    ids.forEach((id) => {
      this.habitService.delete(id).subscribe({
        next: () => {
          completed++;
          this.checkBulkDeleteDone(ids.length, completed, failed);
        },
        error: (err) => {
          failed++;
          console.error(err);
          this.checkBulkDeleteDone(ids.length, completed, failed);
        },
      });
    });
  }

  private checkBulkDeleteDone(total: number, completed: number, failed: number) {
    if (completed + failed === total) {
      this.deleting.set(false);
      this.selectedIds.set(new Set());
      this.selectMode.set(false);
      if (failed > 0) {
        this.error.set(`${failed} of ${total} habits couldn't be deleted.`);
      }
      this.fetchHabits();
    }
  }
}