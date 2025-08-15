import type { Habit, HabitLog } from '../types/abhyasa';
import { HabitLogStatus } from '../types/abhyasa';
export interface HabitStats {
    currentStreak: number;
    bestStreak: number;
    completionRate: number;
    daysCompleted: number;
    goalProgress: number;
}
export interface CalculatedStatus {
    status: HabitLogStatus;
    progress: number;
    isComplete: boolean;
}
export declare const calculateHabitStatus: (habit: Habit, log: HabitLog | null) => CalculatedStatus;
export declare const shouldShowHabitOnDate: (habit: Habit, date: Date) => boolean;
export declare const getLogForDate: (logs: HabitLog[], date: Date) => HabitLog | null;
export declare const calculateHabitStats: (habit: Habit, allHabitLogs: HabitLog[], today?: Date) => HabitStats;
