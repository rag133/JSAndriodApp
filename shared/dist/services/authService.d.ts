import { User, UserCredential } from 'firebase/auth';
export declare const signUp: (email: string, password: string, displayName?: string) => Promise<UserCredential>;
export declare const signIn: (email: string, password: string) => Promise<UserCredential>;
export declare const signOutUser: () => Promise<void>;
export declare const onAuthStateChange: (callback: (user: User | null) => void) => import("@firebase/util").Unsubscribe;
export declare const getCurrentUser: () => User | null;
export declare const updateUserProfile: (user: User, updates: {
    displayName?: string;
    photoURL?: string;
}) => Promise<void>;
