export type IconName = string;
export declare enum HabitType {
    BINARY = "binary",
    COUNT = "count",
    DURATION = "duration",
    CHECKLIST = "checklist"
}
export declare enum HabitFrequencyType {
    DAILY = "daily",
    WEEKLY = "weekly",// x times per week
    MONTHLY = "monthly",// x times per month
    SPECIFIC_DAYS = "specific_days"
}
export type HabitFrequency = {
    type: HabitFrequencyType.DAILY;
} | {
    type: HabitFrequencyType.WEEKLY;
    times: number;
} | {
    type: HabitFrequencyType.MONTHLY;
    times: number;
} | {
    type: HabitFrequencyType.SPECIFIC_DAYS;
    days: number[];
};
export interface HabitChecklistItem {
    id: string;
    text: string;
}
export declare enum HabitTargetComparison {
    GREATER_THAN = "greater_than",
    GREATER_THAN_OR_EQUAL = "greater_than_or_equal",
    LESS_THAN = "less_than",
    LESS_THAN_OR_EQUAL = "less_than_or_equal",
    EQUAL = "equal",
    AT_LEAST = "at_least",// Alias for GREATER_THAN_OR_EQUAL
    EXACTLY = "exactly",// Alias for EQUAL
    ANY_VALUE = "any_value",// Special case for any non-zero value
    'at-least' = "at_least",
    'less-than' = "less_than",
    'exactly' = "exactly",
    'any-value' = "any_value"
}
export declare enum HabitStatus {
    YET_TO_START = "Yet to Start",
    IN_PROGRESS = "In Progress",
    COMPLETED = "Completed",
    ABANDONED = "Abandoned",
    ACTIVE = "In Progress",// Alias for IN_PROGRESS
    PAUSED = "Yet to Start",// Alias for YET_TO_START
    ARCHIVED = "Abandoned"
}
export interface Habit {
    id: string;
    createdAt: Date;
    title: string;
    description?: string;
    icon: IconName;
    color: string;
    frequency: HabitFrequency;
    type: HabitType;
    status: HabitStatus;
    dailyTarget?: number;
    dailyTargetComparison?: HabitTargetComparison;
    totalTarget?: number;
    totalTargetComparison?: HabitTargetComparison;
    checklist?: HabitChecklistItem[];
    milestoneId?: string;
    goalId?: string;
    focusAreaId?: string;
    startDate: Date;
    endDate?: Date;
    reminders?: string[];
    userId?: string;
}
export declare enum HabitLogStatus {
    DONE = "done",
    PARTIAL = "partial",
    NONE = "none",// Default when no log is entered for that day
    COMPLETED = "done",// Alias for DONE
    SKIPPED = "none",// Alias for NONE
    FAILED = "none"
}
export interface HabitLog {
    id: string;
    habitId: string;
    date: string;
    value?: number;
    completedChecklistItems?: string[];
    notes?: string;
    userId?: string;
    createdAt?: Date;
    updatedAt?: Date;
    count?: number;
    status?: HabitLogStatus;
}
export declare enum GoalStatus {
    NOT_STARTED = "Not Started",
    IN_PROGRESS = "In Progress",
    COMPLETED = "Completed",
    ABANDONED = "Abandoned",
    ACTIVE = "In Progress",// Alias for IN_PROGRESS
    PAUSED = "Not Started",// Alias for NOT_STARTED
    CANCELLED = "Abandoned"
}
export interface Goal {
    id: string;
    title: string;
    description?: string;
    startDate: Date;
    targetEndDate?: Date;
    status: GoalStatus;
    icon: IconName;
    focusAreaId?: string;
    userId?: string;
}
export declare enum MilestoneStatus {
    NOT_STARTED = "Not Started",
    IN_PROGRESS = "In Progress",
    COMPLETED = "Completed",
    ABANDONED = "Abandoned",
    PLANNED = "Not Started",// Alias for NOT_STARTED
    CANCELLED = "Abandoned"
}
export interface Milestone {
    id: string;
    title: string;
    description?: string;
    parentGoalId: string;
    startDate: Date;
    targetEndDate?: Date;
    status: MilestoneStatus;
    focusAreaId?: string;
    userId?: string;
}
export declare enum QuickWinStatus {
    PENDING = "Pending",
    COMPLETED = "Completed",
    PLANNED = "Pending",// Alias for PENDING
    CANCELLED = "Pending"
}
export interface QuickWin {
    id: string;
    title: string;
    description?: string;
    dueDate?: Date;
    status: QuickWinStatus;
    createdAt: Date;
    userId?: string;
}
export type AbhyasaSelection = {
    type: 'goals';
} | {
    type: 'milestones';
} | {
    type: 'calendar';
} | {
    type: 'all-habits';
} | {
    type: 'quick-wins';
} | {
    type: 'habits';
};
