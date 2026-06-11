export interface FocusSession {
  sessionId: string;
  studentId: string;
  targetMinutes: number;
  status: 'completed' | 'failed';
  failReason?: 'give_up' | 'app_switch';
  startedAt: string;
  endedAt: string;
  syncedAt?: string;
  rewardGranted: boolean;
  notificationSent: boolean;
}

export interface Task {
  taskId: string;
  studentId: string;
  subject: string;
  chapter: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'done';
  updatedAt: string;  // logical clock, not wall clock
  deviceId: string;
  deleted?: boolean;
}

export interface StudentState {
  studentId: string;
  coins: number;
  streak: number;
  lastFocusDate: string;
  todayFocusMinutes: number;
}

// In-memory store
export const db = {
  sessions: new Map<string, FocusSession>(),
  tasks: new Map<string, Task>(),
  students: new Map<string, StudentState>(),
  processedSessions: new Set<string>(), // for idempotency
};

// Default student
db.students.set('student_1', {
  studentId: 'student_1',
  coins: 0,
  streak: 0,
  lastFocusDate: '',
  todayFocusMinutes: 0,
});