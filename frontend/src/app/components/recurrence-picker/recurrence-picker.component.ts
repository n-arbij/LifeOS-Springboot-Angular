import { Component, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

type Frequency = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
type EndType = 'NEVER' | 'UNTIL' | 'COUNT';

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

@Component({
  selector: 'app-recurrence-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recurrence-picker.component.html',
  styleUrl: './recurrence-picker.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RecurrencePickerComponent),
      multi: true,
    },
  ],
})
export class RecurrencePickerComponent implements ControlValueAccessor {
  readonly dayCodes = DAY_CODES;
  readonly dayLabels = DAY_LABELS;
  readonly dayFull = DAY_FULL;

  frequency = signal<Frequency>('NONE');
  interval = signal<number>(1);
  selectedDays = signal<Set<string>>(new Set());
  endType = signal<EndType>('NEVER');
  untilDate = signal<string>('');
  count = signal<number>(10);

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};
  private disabled = false;

  // ---- Human-readable summary ----
  summary = computed(() => {
    const freq = this.frequency();
    if (freq === 'NONE') return 'Does not repeat';

    const n = this.interval();
    const unitMap: Record<Frequency, [string, string]> = {
      NONE: ['', ''],
      DAILY: ['day', 'days'],
      WEEKLY: ['week', 'weeks'],
      MONTHLY: ['month', 'months'],
      YEARLY: ['year', 'years'],
    };
    const [singular, plural] = unitMap[freq];
    let text = `Every ${n === 1 ? singular : `${n} ${plural}`}`;

    if (freq === 'WEEKLY' && this.selectedDays().size > 0) {
      const days = this.dayCodes
        .filter((d) => this.selectedDays().has(d))
        .map((d) => this.dayFull[this.dayCodes.indexOf(d)]);
      text += ` on ${days.join(', ')}`;
    }

    const end = this.endType();
    if (end === 'UNTIL' && this.untilDate()) {
      const d = new Date(this.untilDate());
      text += `, until ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (end === 'COUNT') {
      text += `, ${this.count()} time${this.count() === 1 ? '' : 's'}`;
    }

    return text;
  });

  // ---- UI actions ----
  setFrequency(freq: Frequency) {
    this.frequency.set(freq);
    if (freq !== 'WEEKLY') this.selectedDays.set(new Set());
    this.emit();
  }

  setInterval(val: number) {
    this.interval.set(Math.max(1, val || 1));
    this.emit();
  }

  toggleDay(code: string) {
    const days = new Set(this.selectedDays());
    days.has(code) ? days.delete(code) : days.add(code);
    this.selectedDays.set(days);
    this.emit();
  }

  setEndType(type: EndType) {
    this.endType.set(type);
    this.emit();
  }

  setUntilDate(val: string) {
    this.untilDate.set(val);
    this.emit();
  }

  setCount(val: number) {
    this.count.set(Math.max(1, val || 1));
    this.emit();
  }

  // ---- Build RRULE string ----
  private buildRRule(): string | null {
    const freq = this.frequency();
    if (freq === 'NONE') return null;

    const parts = [`FREQ=${freq}`];

    if (this.interval() > 1) {
      parts.push(`INTERVAL=${this.interval()}`);
    }

    if (freq === 'WEEKLY' && this.selectedDays().size > 0) {
      const days = this.dayCodes.filter((d) => this.selectedDays().has(d));
      parts.push(`BYDAY=${days.join(',')}`);
    }

    const end = this.endType();
    if (end === 'UNTIL' && this.untilDate()) {
      const compact = this.untilDate().replace(/-/g, '');
      parts.push(`UNTIL=${compact}`);
    } else if (end === 'COUNT') {
      parts.push(`COUNT=${this.count()}`);
    }

    return parts.join(';');
  }

  private emit() {
    this.onChange(this.buildRRule());
    this.onTouched();
  }

  // ---- Parse incoming RRULE string (edit mode) ----
  private parseRRule(rrule: string) {
    const parts = rrule.split(';').reduce((acc, pair) => {
      const [key, value] = pair.split('=');
      if (key && value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    if (parts['FREQ']) this.frequency.set(parts['FREQ'] as Frequency);
    if (parts['INTERVAL']) this.interval.set(Number(parts['INTERVAL']));
    if (parts['BYDAY']) {
      this.selectedDays.set(new Set(parts['BYDAY'].split(',')));
    }
    if (parts['UNTIL']) {
      const raw = parts['UNTIL'];
      const iso = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
      this.untilDate.set(iso);
      this.endType.set('UNTIL');
    } else if (parts['COUNT']) {
      this.count.set(Number(parts['COUNT']));
      this.endType.set('COUNT');
    } else {
      this.endType.set('NEVER');
    }
  }

  // ---- ControlValueAccessor ----
  writeValue(value: string | null): void {
    if (value) {
      this.parseRRule(value);
    } else {
      this.frequency.set('NONE');
      this.interval.set(1);
      this.selectedDays.set(new Set());
      this.endType.set('NEVER');
      this.untilDate.set('');
      this.count.set(10);
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}