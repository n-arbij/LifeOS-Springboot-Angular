import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { EventService } from '../../core/services/event.service';
import { EventResponse, EventSummaryResponse } from '../../core/models/event.model';

@Component({
  selector: 'app-event',
  imports: [CommonModule],
  templateUrl: './event.component.html',
  styleUrl: './event.component.css',
})
export class EventComponent implements OnInit{
    private eventService = inject(EventService)

    currentDate  = signal(new Date());
    selectedDate = signal<string | null>(null);
    selectedEvent = signal<EventResponse | null>(null);

    eventsByDate = signal<Record<string, EventSummaryResponse[]>>({});
    loading = signal(false);

    readonly weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    monthYearLabel = computed(() =>
        this.currentDate().toLocaleString('default', { month: 'long', year: 'numeric' })
    );

    calendarDays = computed(() => {
        const date     = this.currentDate();
        const year     = date.getFullYear();
        const month    = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayKey = this.toDateKey(new Date());
        const map      = this.eventsByDate();

        const days: Array<{
        day: number;
        dateKey: string;
        isToday: boolean;
        isSelected: boolean;
        events: EventSummaryResponse[];
        } | null> = [];

        for (let i = 0; i < firstDay; i++) days.push(null);

        for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = this.buildDateKey(year, month, day);
        days.push({
            day,
            dateKey,
            isToday:    dateKey === todayKey,
            isSelected: dateKey === this.selectedDate(),
            events:     map[dateKey] ?? []
        });
        }

        return days;
    });
    
    selectedDayEvents = computed(() => {
        const key = this.selectedDate();
        if (!key) return [];
        return this.eventsByDate()[key] ?? [];
    });

    selectedDateObj = computed(() => {
        const key = this.selectedDate();
        if (!key) return null;
        return new Date(key);
    });

    ngOnInit(): void {
        const today = new Date();
        this.selectedDate.set(this.toDateKey(today));
        this.loadMonth();
    }

    prevMonth(): void {
        const d = this.currentDate();
        this.currentDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
        this.loadMonth();
    }

    nextMonth(): void {
        const d = this.currentDate();
        this.currentDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
        this.loadMonth();
    }

    selectDay(dateKey: string): void {
        this.selectedDate.set(dateKey);
        this.selectedEvent.set(null);
    }

    selectEvent(event: EventSummaryResponse): void {
        this.eventService.getById(event.id).subscribe({
        next: full => this.selectedEvent.set(full),
        error: () => this.selectedEvent.set(null)
        });
    }

    formatTime(instant: string): string {
        return new Date(instant).toLocaleTimeString('default', {
        hour: '2-digit',
        minute: '2-digit'
        });
    }

    private loadMonth(): void {
        const d     = this.currentDate();
        const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        this.loading.set(true);
        this.eventService.getAll(month).subscribe({
        next: events => {
            const map: Record<string, EventSummaryResponse[]> = {};
            events.forEach(event => {
            const dateKey = event.startTime.split('T')[0];
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(event);
            });
            this.eventsByDate.set(map);
            this.loading.set(false);
        },
        error: () => this.loading.set(false)
        });
    }

    private toDateKey(date: Date): string {
        return this.buildDateKey(date.getFullYear(), date.getMonth(), date.getDate());
    }

    private buildDateKey(year: number, month: number, day: number): string {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
}
