export type EventStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type Status = 'ACTIVE' | 'CANCELLED';
export type RecurrenceEditScope = 'ALL';

export interface EventResponse {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string | null;
  color: string | null;
  status: Status;
  eventStatus: EventStatus;
  recurrenceRule: string | null;
  createdAt: string;
  updatedAt: string;
  remindMinutes: number[];
}

export interface EventSummaryResponse {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  color: string | null;
  allDay: boolean;
}

export interface EventOccurrenceResponse {
  seriesId: string;
  title: string;
  description: string | null;
  startDateTime: string;
  endDateTime: string;
  allDay: boolean;
  location: string | null;
  color: string | null;
  isRecurring: boolean;
  eventStatus: EventStatus;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  startDate?: string;
  endDate?: string;
  allDay: boolean;
  location?: string;
  color?: string;
  recurrenceRule?: string;
  status?: Status;
  reminderMinutes?: number[];
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  startDate?: string;
  endDate?: string;
  allDay?: boolean;
  location?: string;
  color?: string;
  recurrenceRule?: string;
  removeRecurrence?: boolean;
  reminderMinutes?: number[];
  editScope?: RecurrenceEditScope;
}