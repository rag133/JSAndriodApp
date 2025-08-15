export * from './kary';
export * from './dainandini';
export * from './abhyasa';
export interface Subtask {
    id: string;
    text: string;
    completed: boolean;
}
export type FirestoreDoc<T> = T & {
    id: string;
};
export type PartialFirestoreDoc<T> = Partial<T> & {
    id: string;
};
