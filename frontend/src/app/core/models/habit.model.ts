export type HabitType      = 'BOOLEAN' | 'QUANTITATIVE';
export type FrequencyType  = 'DAILY' | 'WEEKLY' | 'CUSTOM_DAYS';

export interface HabitResponse {
  id: string;
  name: string;
  description: string | null;
  habitType: HabitType;
  frequencyType: FrequencyType;
  customDayMask: number | null;
  targetValue: number | null;
  unit: string | null;
  startDate: string;
  endDate: string | null;
  active: boolean;
  color: string | null;
  currentStreak: number;
  longestStreak: number;
}

export interface CreateHabitRequest {
  name: string;
  description?: string;
  habitType: HabitType;
  frequencyType: FrequencyType;
  targetValue?: number;
  customDayMask?: number;
  unit?: string;
  startDate: string;
  endDate?: string;
  color?: string;
}

export interface UpdateHabitRequest {
  name?: string;
  description?: string;
  frequencyType?: FrequencyType;
  customDayMask?: number;
  targetValue?: number;
  unit?: string;
  endDate?: string;
  active?: boolean;
  color?: string;
}

export interface LogHabitRequest {
  logDate: string;
  completed?: boolean;
  value?: number;
  notes?: string;
}

export interface HabitLogResponse {
  id: string;
  habitId: string;
  logDate: string;
  completed: boolean;
  value: number | null;
  notes: string | null;
  loggedAt: string;
}

export interface HabitWeekSummary {
  weekStart: string;
  weekEnd: string;
  days: HabitDaySummary[];
}

export interface HabitDaySummary {
  date: string;
  scheduled: boolean;
  completed: boolean;
  value: number | null;
}