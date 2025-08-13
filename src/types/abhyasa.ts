export enum HabitLogStatus {
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  FAILED = 'failed',
}

export enum QuickWinStatus {
  PLANNED = 'planned',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

export enum MilestoneStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum HabitStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  status: GoalStatus;
  startDate: Date;
  targetEndDate?: Date;
  actualEndDate?: Date;
  priority?: 1 | 2 | 3 | 4;
  category?: string;
  userId: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  goalId?: string;
  status: MilestoneStatus;
  targetDate?: Date;
  completionDate?: Date;
  priority?: 1 | 2 | 3 | 4;
  userId: string;
}

export interface QuickWin {
  id: string;
  title: string;
  description?: string;
  status: QuickWinStatus;
  targetDate?: Date;
  completionDate?: Date;
  priority?: 1 | 2 | 3 | 4;
  userId: string;
  createdAt: Date;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  goalId?: string;
  milestoneId?: string;
  status: HabitStatus;
  startDate: Date;
  endDate?: Date;
  frequency: {
    type: 'daily' | 'weekly' | 'custom';
    value?: number; // For custom frequency
    days?: number[]; // For weekly: 0=Sunday, 1=Monday, etc.
  };
  targetValue?: number;
  unit?: string;
  reminderTime?: string;
  category?: string;
  userId: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: Date;
  status: HabitLogStatus;
  value?: number;
  notes?: string;
  userId: string;
}

export type AbhyasaSelection =
  | { type: 'calendar' }
  | { type: 'habits' }
  | { type: 'goals' }
  | { type: 'milestones' }
  | { type: 'quick-wins' };
