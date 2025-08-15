// Temporary local copy of types - will be replaced with proper shared package import once monorepo is fixed
// Icon type - each platform can define their own icon system
// This allows web and mobile to use their own icon naming conventions
export type IconName = string;

// --- Habit Types ---
export enum HabitType {
  BINARY = 'binary',
  COUNT = 'count',
  DURATION = 'duration',
  CHECKLIST = 'checklist',
}

export enum HabitFrequencyType {
  DAILY = 'daily',
  WEEKLY = 'weekly', // x times per week
  MONTHLY = 'monthly', // x times per month
  SPECIFIC_DAYS = 'specific_days',
}

export type HabitFrequency =
  | { type: HabitFrequencyType.DAILY }
  | { type: HabitFrequencyType.WEEKLY; times: number }
  | { type: HabitFrequencyType.MONTHLY; times: number }
  | { type: HabitFrequencyType.SPECIFIC_DAYS; days: number[] }; // 0=Sun, 1=Mon, ...

export interface HabitChecklistItem {
  id: string;
  text: string;
}

// Unified comparison types that work for both web and mobile
export enum HabitTargetComparison {
  // Primary comparison types
  GREATER_THAN = 'greater_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN = 'less_than',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  EQUAL = 'equal',
  
  // Aliases for backward compatibility
  AT_LEAST = 'at_least', // Alias for GREATER_THAN_OR_EQUAL
  EXACTLY = 'exactly',   // Alias for EQUAL
  ANY_VALUE = 'any_value', // Special case for any non-zero value
  
  // Legacy mobile app aliases
  'at-least' = 'at_least',
  'less-than' = 'less_than',
  'exactly' = 'exactly',
  'any-value' = 'any_value'
}

// Unified habit status that works for both web and mobile
export enum HabitStatus {
  // Primary status types (web app standard)
  YET_TO_START = 'Yet to Start',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  ABANDONED = 'Abandoned',
  
  // Mobile app status types (aliases for compatibility)
  ACTIVE = 'In Progress', // Alias for IN_PROGRESS
  PAUSED = 'Yet to Start', // Alias for YET_TO_START
  ARCHIVED = 'Abandoned', // Alias for ABANDONED
}

export interface Habit {
  id: string;
  createdAt: Date;
  title: string;
  description?: string;
  icon: IconName;
  color: string; // e.g., 'blue-500'
  frequency: HabitFrequency;
  type: HabitType;
  status: HabitStatus;
  // Daily Target
  dailyTarget?: number;
  dailyTargetComparison?: HabitTargetComparison;
  // Total Target (over the entire habit duration)
  totalTarget?: number;
  totalTargetComparison?: HabitTargetComparison;
  checklist?: HabitChecklistItem[]; // For CHECKLIST
  milestoneId?: string;
  goalId?: string;
  focusAreaId?: string;
  startDate: Date;
  endDate?: Date;
  reminders?: string[];
  userId?: string; // For mobile app compatibility
}

// Unified habit log status that works for both web and mobile
export enum HabitLogStatus {
  // Primary status types (web app standard)
  DONE = 'done',
  PARTIAL = 'partial',
  NONE = 'none', // Default when no log is entered for that day
  
  // Legacy status aliases for backward compatibility
  COMPLETED = 'done', // Alias for DONE
  PARTIALLY_COMPLETED = 'partial', // Alias for PARTIAL
  NOT_DONE = 'none', // Alias for NONE
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: Date;
  status: HabitLogStatus;
  value?: number; // For COUNT and DURATION types
  notes?: string;
  completedItems?: string[]; // For CHECKLIST type
  userId?: string; // For mobile app compatibility
}

// Focus Area Types
export interface FocusArea {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: IconName;
  userId?: string;
}

// Goal Types
export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetDate?: Date;
  status: 'active' | 'completed' | 'abandoned';
  focusAreaId?: string;
  userId?: string;
}

// Milestone Types
export interface Milestone {
  id: string;
  title: string;
  description?: string;
  targetDate?: Date;
  status: 'pending' | 'completed' | 'overdue';
  goalId?: string;
  userId?: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    notifications?: boolean;
    timezone?: string;
  };
}

// Analytics Types
export interface HabitAnalytics {
  habitId: string;
  totalDays: number;
  completedDays: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  averageValue?: number; // For COUNT and DURATION types
}

// TODO: Add more types as needed for the mobile app
