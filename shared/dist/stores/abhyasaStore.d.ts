import type { Habit, HabitLog, Goal, Milestone, QuickWin } from '../types';
type AbhyasaState = {
    habits: Habit[];
    habitLogs: HabitLog[];
    goals: Goal[];
    milestones: Milestone[];
    quickWins: QuickWin[];
    loading: boolean;
    error: string | null;
    fetchAbhyasaData: () => Promise<void>;
    addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => Promise<void>;
    updateHabit: (habitId: string, updates: Partial<Habit>) => Promise<void>;
    deleteHabit: (habitId: string) => Promise<void>;
    addHabitLog: (log: Omit<HabitLog, 'id'>) => Promise<void>;
    updateHabitLog: (logId: string, updates: Partial<HabitLog>) => Promise<void>;
    deleteHabitLog: (logId: string) => Promise<void>;
    addGoal: (goal: Omit<Goal, 'id' | 'startDate'>) => Promise<void>;
    updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;
    deleteGoal: (goalId: string) => Promise<void>;
    addMilestone: (milestone: Omit<Milestone, 'id'>) => Promise<void>;
    updateMilestone: (milestoneId: string, updates: Partial<Milestone>) => Promise<void>;
    deleteMilestone: (milestoneId: string) => Promise<void>;
    addQuickWin: (win: Omit<QuickWin, 'id' | 'createdAt'>) => Promise<void>;
    updateQuickWin: (winId: string, updates: Partial<QuickWin>) => Promise<void>;
    deleteQuickWin: (winId: string) => Promise<void>;
};
export declare const useAbhyasaStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AbhyasaState>, "setState" | "devtools"> & {
    setState(partial: AbhyasaState | Partial<AbhyasaState> | ((state: AbhyasaState) => AbhyasaState | Partial<AbhyasaState>), replace?: false | undefined, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    setState(state: AbhyasaState | ((state: AbhyasaState) => AbhyasaState), replace: true, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    devtools: {
        cleanup: () => void;
    };
}>;
export {};
