declare const useRootStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<unknown>, "setState" | "devtools"> & {
    setState(partial: unknown, replace?: false | undefined, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    setState(state: unknown, replace: true, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    devtools: {
        cleanup: () => void;
    };
}>;
export default useRootStore;
