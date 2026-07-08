import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, signal, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateEventRequest, EventResponse, UpdateEventRequest } from '../../../core/models/event.model';
import { EventService } from '../../../core/services/event.service';

@Component({
  selector: 'app-event-drawer',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './event-drawer.component.html',
  styleUrl: './event-drawer.component.css',
})
export class EventDrawerComponent {
    @Input() event: EventResponse | null = null;
    @Input() open = false;

    @Output() closed = new EventEmitter<void>();
    @Output() saved = new EventEmitter<EventResponse>();
    @Output() deleted = new EventEmitter<string>();

    private fb = inject(FormBuilder);
    private eventService = inject(EventService);

    loading = signal(false);
    error   = signal<string | null>(null);

    readonly colorOptions = [
        '#7C6EF8', '#EB5E28', '#4ECCA3',
        '#e87575', '#F4C430', '#4A90D9'
    ];

    readonly reminderOptions = [5, 10, 15, 30, 60, 120]

    readonly statusOptions: { value: string; label: string }[] = [
        { value: 'ACTIVE',    label: 'Active'    },
        { value: 'CANCELLED', label: 'Cancelled' }
    ];

    form = this.fb.group({
        title:           ['', Validators.required],
        description:     [''],
        allDay:          [false],
        startDateTime:   [''],
        endDateTime:     [''],
        startDate:       [''],
        endDate:         [''],
        location:        [''],
        color:           ['#7C6EF8'],
        recurrenceRule:  [''],
        removeRecurrence:[false],
        status:          ['ACTIVE'],
        reminderMinutes: this.fb.array([])
    });


    get isEditMode(): boolean {
        return this.event !== null;
    }

    get title(): string {
        return this.isEditMode ? 'Edit event' : 'New event';
    }

    get allDay() {
        return this.form.get('allDay');
    }

    get remindersArray(): FormArray {
        return this.form.get('reminderMinutes') as FormArray;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['open'] && this.open) {
        this.error.set(null);
        this.event ? this.patchForm(this.event) : this.resetForm();
        }
    }

    selectColor(color: string): void {
        this.form.patchValue({ color });
    }

    toggleReminder(minutes: number): void {
        const index = this.remindersArray.controls
        .findIndex(c => c.value === minutes);

        if (index >= 0) {
        this.remindersArray.removeAt(index);
        } else {
        this.remindersArray.push(this.fb.control(minutes));
        }
    }

    isReminderSelected(minutes: number): boolean {
        return this.remindersArray.controls.some(c => c.value === minutes);
    }

    submit(): void {
        if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
        }

        this.loading.set(true);
        this.error.set(null);

        const request$ = this.isEditMode
        ? this.eventService.update(this.event!.id, this.buildUpdateRequest())
        : this.eventService.create(this.buildCreateRequest());

        request$.subscribe({
        next: response => {
            this.loading.set(false);
            this.saved.emit(response);
            this.close();
        },
        error: err => {
            this.error.set(err.error?.message ?? 'Something went wrong.');
            this.loading.set(false);
        }
        });
    }

    confirmDelete(): void {
        if (!this.event) return;
        if (!confirm('Delete this event?')) return;

        this.loading.set(true);
        this.eventService.delete(this.event.id).subscribe({
        next: () => {
            this.loading.set(false);
            this.deleted.emit(this.event!.id);
            this.close();
        },
        error: err => {
            this.error.set(err.error?.message ?? 'Could not delete event.');
            this.loading.set(false);
        }
        });
    }

    close(): void {
        this.closed.emit();
    }

    private buildCreateRequest(): CreateEventRequest {
        const v = this.form.value;
        const allDay = v.allDay ?? false;

        return {
        title:           v.title!,
        description:     v.description || undefined,
        allDay,
        startDateTime:   !allDay && v.startDateTime
                            ? new Date(v.startDateTime).toISOString()
                            : undefined,
        endDateTime:     !allDay && v.endDateTime
                            ? new Date(v.endDateTime).toISOString()
                            : undefined,
        startDate:       allDay ? v.startDate || undefined : undefined,
        endDate:         allDay ? v.endDate   || undefined : undefined,
        location:        v.location   || undefined,
        color:           v.color      || undefined,
        recurrenceRule:  v.recurrenceRule || undefined,
        status:          (v.status as any) || 'ACTIVE',
        reminderMinutes: this.remindersArray.value
        };
    }

    private buildUpdateRequest(): UpdateEventRequest {
        const v = this.form.value;
        const allDay = v.allDay ?? false;

        return {
        title:            v.title      || undefined,
        description:      v.description || undefined,
        allDay,
        startDateTime:    !allDay && v.startDateTime
                            ? new Date(v.startDateTime).toISOString()
                            : undefined,
        endDateTime:      !allDay && v.endDateTime
                            ? new Date(v.endDateTime).toISOString()
                            : undefined,
        startDate:        allDay ? v.startDate || undefined : undefined,
        endDate:          allDay ? v.endDate   || undefined : undefined,
        location:         v.location      || undefined,
        color:            v.color         || undefined,
        recurrenceRule:   v.recurrenceRule || undefined,
        removeRecurrence: v.removeRecurrence ?? false,
        reminderMinutes:  this.remindersArray.value,
        editScope:        'ALL'
        };
    }

    private patchForm(event: EventResponse): void {
        this.remindersArray.clear();

        this.form.patchValue({
        title:          event.title,
        description:    event.description ?? '',
        allDay:         event.allDay,
        startDateTime:  event.startTime
                            ? this.toDateTimeLocal(event.startTime)
                            : '',
        endDateTime:    event.endTime
                            ? this.toDateTimeLocal(event.endTime)
                            : '',
        location:       event.location ?? '',
        color:          event.color ?? '#7C6EF8',
        recurrenceRule: event.recurrenceRule ?? '',
        status:         event.status
        });

        event.remindMinutes?.forEach(m =>
        this.remindersArray.push(this.fb.control(m))
        );
    }

    private resetForm(): void {
        this.remindersArray.clear();
        this.form.reset({
        title:           '',
        description:     '',
        allDay:          false,
        startDateTime:   '',
        endDateTime:     '',
        startDate:       '',
        endDate:         '',
        location:        '',
        color:           '#7C6EF8',
        recurrenceRule:  '',
        removeRecurrence: false,
        status:          'ACTIVE'
        });
    }

    // Converts ISO Instant string to datetime-local input format
    private toDateTimeLocal(instant: string): string {
        const d = new Date(instant);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
}

