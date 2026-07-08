export type SessionType   = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
export type SessionStatus = 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface PomodoroResponse {
  id: string;
  taskId: string | null;
  taskTitle: string | null;
  sessionType: SessionType;
  status: SessionStatus;
  startTime: string;
  endTime: string | null;
  plannedDurationMinutes: number;
  actualDurationMinutes: number | null;
  completed: boolean;
}

export interface CreateSessionRequest {
  sessionType: SessionType;
  plannedDurationMinutes: number;
  taskId?: string;
}

export interface UpdateSessionRequest {
  status: SessionStatus;
}

export interface PomodoroSummaryResponse {
  date: string;
  completedSessions: number;
  cancelledSessions: number;
  totalFocusMinutes: number;
  totalBreakMinutes: number;
}