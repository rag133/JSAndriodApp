import * as Icons from '../components/Icons';
export declare enum LogType {
    TEXT = "text",
    CHECKLIST = "checklist",
    RATING = "rating"
}
export declare const logTypeDetails: Record<LogType, {
    name: string;
    icon: keyof typeof Icons;
}>;
export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
}
export interface Focus {
    id: string;
    name: string;
    description?: string;
    icon: keyof typeof Icons;
    color: string;
    allowedLogTypes: LogType[];
    defaultTemplateId?: string;
}
export interface Log {
    id: string;
    focusId: string;
    logType: LogType;
    title: string;
    description?: string;
    checklist?: ChecklistItem[];
    rating?: number;
    logDate: Date;
    createdAt: Date;
    habitId?: string;
    milestoneId?: string;
    goalId?: string;
    taskId?: string;
    completed?: boolean;
    taskCompletionDate?: Date;
}
export interface LogTemplate {
    id: string;
    name: string;
    icon: keyof typeof Icons;
    focusId: string;
    logType: LogType;
    title: string;
    description?: string;
    checklist?: Pick<ChecklistItem, 'text' | 'completed'>[];
    rating?: number;
}
export type DainandiniSelection = {
    type: 'today';
} | {
    type: 'calendar';
    date?: string;
} | {
    type: 'focus';
    id: string;
} | {
    type: 'template';
    id: string;
};
export type GroupedLogs = Map<string, Log[]>;
