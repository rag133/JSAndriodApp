export * from './habitStats';
export declare const formatDate: (date: Date) => string;
export declare const formatTime: (date: Date) => string;
export declare const isValidEmail: (email: string) => boolean;
export declare const debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => ((...args: Parameters<T>) => void);
