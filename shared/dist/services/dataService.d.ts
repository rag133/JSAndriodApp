import type { Task, List, Tag, ListFolder, TagFolder, Goal, Habit, HabitLog, Milestone, QuickWin, Log as LogEntry, LogTemplate, Focus, FirestoreDoc } from '../types';
export declare const taskService: {
    add: (taskData: Omit<Task, "id">) => Promise<string>;
    update: (taskId: string, updates: Partial<Task>) => Promise<void>;
    delete: (taskId: string) => Promise<void>;
    getAll: () => Promise<FirestoreDoc<Task>[]>;
    subscribe: (callback: (tasks: FirestoreDoc<Task>[]) => void) => import("@firebase/firestore").Unsubscribe;
};
export declare const listService: {
    add: (listData: Omit<List, "id">) => Promise<string>;
    update: (listId: string, updates: Partial<List>) => Promise<void>;
    delete: (listId: string) => Promise<void>;
    getAll: () => Promise<FirestoreDoc<List>[]>;
    subscribe: (callback: (lists: FirestoreDoc<List>[]) => void) => import("@firebase/firestore").Unsubscribe;
};
export declare const tagService: {
    add: (tagData: Omit<Tag, "id">) => Promise<string>;
    update: (tagId: string, updates: Partial<Tag>) => Promise<void>;
    delete: (tagId: string) => Promise<void>;
    getAll: () => Promise<FirestoreDoc<Tag>[]>;
    subscribe: (callback: (tags: FirestoreDoc<Tag>[]) => void) => import("@firebase/firestore").Unsubscribe;
};
export declare const listFolderService: {
    add: (folderData: Omit<ListFolder, "id">) => Promise<string>;
    update: (folderId: string, updates: Partial<ListFolder>) => Promise<void>;
    delete: (folderId: string) => Promise<void>;
    getAll: () => Promise<FirestoreDoc<ListFolder>[]>;
    subscribe: (callback: (folders: FirestoreDoc<ListFolder>[]) => void) => import("@firebase/firestore").Unsubscribe;
};
export declare const tagFolderService: {
    add: (folderData: Omit<TagFolder, "id">) => Promise<string>;
    update: (folderId: string, updates: Partial<TagFolder>) => Promise<void>;
    delete: (folderId: string) => Promise<void>;
    getAll: () => Promise<FirestoreDoc<TagFolder>[]>;
    subscribe: (callback: (folders: FirestoreDoc<TagFolder>[]) => void) => import("@firebase/firestore").Unsubscribe;
};
export declare const logService: {
    add: (logData: Omit<LogEntry, "id" | "createdAt">) => Promise<string>;
    update: (logId: string, updates: Partial<LogEntry>) => Promise<void>;
    delete: (logId: string) => Promise<void>;
    getAll: () => Promise<FirestoreDoc<LogEntry>[]>;
    subscribe: (callback: (logs: FirestoreDoc<LogEntry>[]) => void) => import("@firebase/firestore").Unsubscribe;
};
export declare const logTemplateService: {
    add: (templateData: Omit<LogTemplate, "id">) => Promise<string>;
    update: (templateId: string, updates: Partial<LogTemplate>) => Promise<void>;
    delete: (templateId: string) => Promise<void>;
    getAll: () => Promise<FirestoreDoc<LogTemplate>[]>;
    subscribe: (callback: (templates: FirestoreDoc<LogTemplate>[]) => void) => import("@firebase/firestore").Unsubscribe;
};
export declare const focusService: {
    add: (focusData: Omit<Focus, "id">) => Promise<string>;
    update: (focusId: string, updates: Partial<Focus>) => Promise<void>;
    delete: (focusId: string) => Promise<void>;
    getAll: () => Promise<FirestoreDoc<Focus>[]>;
    subscribe: (callback: (foci: FirestoreDoc<Focus>[]) => void) => import("@firebase/firestore").Unsubscribe;
};
export declare const goalService: {
    add: (goalData: Omit<Goal, "id" | "startDate">) => Promise<string>;
    update: (goalId: string, updates: Partial<Goal>) => Promise<void>;
    delete: (goalId: string) => Promise<void>;
    getAll: () => Promise<FirestoreDoc<Goal>[]>;
    subscribe: (callback: (goals: FirestoreDoc<Goal>[]) => void) => import("@firebase/firestore").Unsubscribe;
};
export declare const milestoneService: {
    add: (milestoneData: Omit<Milestone, "id">) => Promise<string>;
    update: (milestoneId: string, updates: Partial<Milestone>) => Promise<void>;
    delete: (milestoneId: string) => Promise<void>;
    getAll: () => Promise<FirestoreDoc<Milestone>[]>;
    subscribe: (callback: (milestones: FirestoreDoc<Milestone>[]) => void) => import("@firebase/firestore").Unsubscribe;
};
export declare const quickWinService: {
    add: (quickWinData: Omit<QuickWin, "id" | "createdAt">) => Promise<string>;
    update: (quickWinId: string, updates: Partial<QuickWin>) => Promise<void>;
    delete: (quickWinId: string) => Promise<void>;
    getAll: () => Promise<FirestoreDoc<QuickWin>[]>;
    subscribe: (callback: (quickWins: FirestoreDoc<QuickWin>[]) => void) => import("@firebase/firestore").Unsubscribe;
};
export declare const habitService: {
    add: (habitData: Omit<Habit, "id" | "createdAt">) => Promise<string>;
    update: (habitId: string, updates: Partial<Habit>) => Promise<void>;
    delete: (habitId: string) => Promise<void>;
    getAll: () => Promise<FirestoreDoc<Habit>[]>;
    subscribe: (callback: (habits: FirestoreDoc<Habit>[]) => void) => import("@firebase/firestore").Unsubscribe;
};
export declare const habitLogService: {
    add: (habitLogData: Omit<HabitLog, "id">) => Promise<string>;
    update: (habitLogId: string, updates: Partial<HabitLog>) => Promise<void>;
    delete: (habitLogId: string) => Promise<void>;
    getAll: () => Promise<FirestoreDoc<HabitLog>[]>;
    subscribe: (callback: (habitLogs: FirestoreDoc<HabitLog>[]) => void) => import("@firebase/firestore").Unsubscribe;
};
export declare const initializeUserData: () => Promise<void>;
export declare const getAllUserData: () => Promise<{
    tasks: FirestoreDoc<Task>[];
    logs: FirestoreDoc<LogEntry>[];
    habits: FirestoreDoc<Habit>[];
    goals: FirestoreDoc<Goal>[];
    milestones: FirestoreDoc<Milestone>[];
    quickWins: FirestoreDoc<QuickWin>[];
    logTemplates: FirestoreDoc<LogTemplate>[];
    lists: FirestoreDoc<List>[];
    tags: FirestoreDoc<Tag>[];
    foci: FirestoreDoc<Focus>[];
    listFolders: FirestoreDoc<ListFolder>[];
    tagFolders: FirestoreDoc<TagFolder>[];
}>;
