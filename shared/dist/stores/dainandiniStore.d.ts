import type { Log, LogTemplate, Focus } from '../types';
type DainandiniState = {
    logs: Log[];
    logTemplates: LogTemplate[];
    foci: Focus[];
    loading: boolean;
    error: string | null;
    fetchDainandiniData: () => Promise<void>;
    addLog: (log: Omit<Log, 'id' | 'createdAt'>) => Promise<void>;
    updateLog: (logId: string, updates: Partial<Log>) => Promise<void>;
    deleteLog: (logId: string) => Promise<void>;
    addLogTemplate: (template: Omit<LogTemplate, 'id'>) => Promise<void>;
    updateLogTemplate: (templateId: string, updates: Partial<LogTemplate>) => Promise<void>;
    deleteLogTemplate: (templateId: string) => Promise<void>;
    addFocus: (focus: Omit<Focus, 'id'>) => Promise<void>;
    updateFocus: (focusId: string, updates: Partial<Focus>) => Promise<void>;
    deleteFocus: (focusId: string) => Promise<void>;
};
export declare const useDainandiniStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<DainandiniState>, "setState" | "devtools"> & {
    setState(partial: DainandiniState | Partial<DainandiniState> | ((state: DainandiniState) => DainandiniState | Partial<DainandiniState>), replace?: false | undefined, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    setState(state: DainandiniState | ((state: DainandiniState) => DainandiniState), replace: true, action?: (string | {
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
