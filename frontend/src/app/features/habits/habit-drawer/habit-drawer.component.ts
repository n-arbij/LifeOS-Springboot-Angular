import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FrequencyType, HabitPayload, HabitResponse, HabitType } from '../../../core/models/habit.model';

const COLOR_OPTIONS = ['#7C6EF8', '#FF6B6B', '#74B9FF', '#88D498', '#FFD23F', '#FFA552'];
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']; // Mon → Sun, bit 0 → bit 6

@Component({
  selector: 'app-habit-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './habit-drawer.component.html',
  styleUrl: './habit-drawer.component.css',
})
export class HabitDrawerComponent implements OnChanges {
  private fb = inject(FormBuilder);
  @Input() open = false;
  @Input() habit: HabitResponse | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<HabitPayload>();
  @Output() deleted = new EventEmitter<string>();

  readonly colorOptions = COLOR_OPTIONS;
  readonly dayLabels = DAY_LABELS;
  readonly dayIndices = [0, 1, 2, 3, 4, 5, 6];

  loading = signal(false);
  error = signal<string | null>(null);
  selectedDayBits = signal<Set<number>>(new Set());

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    description: [''],
    habitType: ['BOOLEAN' as HabitType, Validators.required],
    frequencyType: ['DAILY' as FrequencyType, Validators.required],
    targetValue: [null as number | null],
    unit: [''],
    color: [COLOR_OPTIONS[0], Validators.required],
    startDate: [this.todayIso(), Validators.required],
    endDate: [null as string | null],
    active: [true],
  });

  isQuantitative = computed(() => this.form.get('habitType')?.value === 'QUANTITATIVE');
  isCustomDays = computed(() => this.form.get('frequencyType')?.value === 'CUSTOM_DAYS');

  get isEditMode() {
    return !!this.habit?.id;
  }

  get title() {
    return this.isEditMode ? 'Edit habit' : 'New habit';
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['habit'] || changes['open']) {
      if (this.habit) {
        this.form.patchValue({
          name: this.habit.name,
          description: this.habit.description ?? '',
          habitType: this.habit.habitType,
          frequencyType: this.habit.frequencyType,
          targetValue: this.habit.targetValue,
          unit: this.habit.unit ?? '',
          color: this.habit.color ?? COLOR_OPTIONS[0],
          startDate: this.habit.startDate?.slice(0, 10) ?? this.todayIso(),
          endDate: this.habit.endDate?.slice(0, 10) ?? null,
          active: this.habit.active,
        });
        this.selectedDayBits.set(this.maskToSet(this.habit.customDayMask ?? 0));
      } else {
        this.form.reset({
          name: '',
          description: '',
          habitType: 'BOOLEAN',
          frequencyType: 'DAILY',
          targetValue: null,
          unit: '',
          color: COLOR_OPTIONS[0],
          startDate: this.todayIso(),
          endDate: null,
          active: true,
        });
        this.selectedDayBits.set(new Set());
      }
      this.error.set(null);
    }
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private maskToSet(mask: number): Set<number> {
    const set = new Set<number>();
    for (let i = 0; i < 7; i++) {
      if (mask & (1 << i)) set.add(i);
    }
    return set;
  }

  private setToMask(set: Set<number>): number {
    let mask = 0;
    set.forEach((bit) => (mask |= 1 << bit));
    return mask;
  }

  selectColor(color: string) {
    this.form.patchValue({ color });
  }

  toggleDayBit(bit: number) {
    const bits = new Set(this.selectedDayBits());
    bits.has(bit) ? bits.delete(bit) : bits.add(bit);
    this.selectedDayBits.set(bits);
  }

  close() {
    this.closed.emit();
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const v = this.form.getRawValue();

    const payload: HabitPayload = {
      id: this.habit?.id,
      name: v.name!,
      description: v.description || null,
      habitType: v.habitType!,
      frequencyType: v.frequencyType!,
      customDayMask: v.frequencyType === 'CUSTOM_DAYS' ? this.setToMask(this.selectedDayBits()) : null,
      targetValue: v.habitType === 'QUANTITATIVE' ? v.targetValue : null,
      unit: v.habitType === 'QUANTITATIVE' ? (v.unit || null) : null,
      startDate: v.startDate!,
      endDate: v.endDate || null,
      active: v.active!,
      color: v.color!,
    };

    this.saved.emit(payload);
    this.loading.set(false);
  }

  confirmDelete() {
    if (this.habit?.id && confirm(`Delete "${this.habit.name}"? This can't be undone.`)) {
      this.deleted.emit(this.habit.id);
    }
  }
}