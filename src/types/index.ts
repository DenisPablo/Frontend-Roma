export type TaskKind = 'task' | 'event';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'not_done';

export interface Category {
  id: number;
  name: string;
  createdAt: string;
}

export interface TaskReminder {
  id: number;
  offsetMinutes: number;
  dueAt: string;
  sentAt?: string | null;
}

export interface TaskItem {
  id: number;
  title: string;
  day: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  categoryId: number;
  kind: TaskKind;
  status: TaskStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  durationSeconds?: number | null;
  formattedDuration?: string | null;
  dayClosedAt?: string | null;
  reminderSentAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reminders?: TaskReminder[] | null;
}

export interface CreateTaskPayload {
  title: string;
  day: string;
  scheduledTime: string;
  categoryId: number;
  kind?: TaskKind;
  reminders?: string[]; // e.g. ["-1d", "-2h", "0"]
  durationSeconds?: number | null;
  isCompleted?: boolean;
}

export interface UpdateTaskPayload {
  title?: string;
  day?: string;
  scheduledTime?: string;
  categoryId?: number;
  durationSeconds?: number | null;
}

export interface CompleteTaskResult {
  id: number;
  durationSeconds: number;
  formattedDuration: string;
}

export interface WorkoutSession {
  id: number;
  date: string; // YYYY-MM-DD
  targetMuscleGroup: string;
  rpe: number; // 1-10 (Borg CR10)
  feeling: number; // 1-5
  recoveryScore: number; // 1-5
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkoutSessionPayload {
  date: string;
  targetMuscleGroup: string;
  rpe: number;
  feeling: number;
  recoveryScore: number;
  notes?: string | null;
}

export type TabType = 'tasks' | 'events' | 'gym' | 'categories' | 'dashboard';

export interface PeriodStats {
  from: string;
  to: string;
  month?: string | null;
}

export interface MuscleGroupCount {
  muscleGroup: string;
  count: number;
}

export interface WorkoutStats {
  totalSessions: number;
  distinctDaysCount: number;
  averageRpe: number;
  sessionDates: string[];
  byMuscleGroup: MuscleGroupCount[];
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  notDoneTasks: number;
  completionRate: number;
  totalDurationSeconds: number;
  formattedTotalDuration: string;
}

export interface CategoryStats {
  categoryId: number;
  categoryName: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  totalDurationSeconds: number;
  formattedTotalDuration: string;
}

export interface DailyActivityStats {
  date: string;
  tasksTotal: number;
  tasksCompleted: number;
  tasksPending: number;
  hadWorkout: boolean;
  workoutCount: number;
}

export interface DashboardStats {
  period: PeriodStats;
  workouts: WorkoutStats;
  tasks: TaskStats;
  categories: CategoryStats[];
  dailyActivity: DailyActivityStats[];
}
