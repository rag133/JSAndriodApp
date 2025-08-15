import { doc, updateDoc, deleteDoc, collection, addDoc, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from './firebase';
import { HabitLogStatus } from '../types';
// Helper function to get current user
const getCurrentUser = () => {
    return auth.currentUser;
};
// Helper function to get user collection reference
const getUserCollection = (collectionName) => {
    const user = getCurrentUser();
    if (!user)
        throw new Error('User not authenticated');
    return collection(db, 'users', user.uid, collectionName);
};
// Helper function to convert Firestore timestamps to Date objects
const convertTimestamps = (data) => {
    if (data && typeof data === 'object') {
        Object.keys(data).forEach(key => {
            if (data[key] && typeof data[key] === 'object' && data[key].toDate) {
                data[key] = data[key].toDate();
            }
            else if (data[key] && typeof data[key] === 'object') {
                data[key] = convertTimestamps(data[key]);
            }
        });
    }
    return data;
};
export const taskService = {
    add: async (taskData) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const taskToAdd = {
            ...taskData,
            createdAt: new Date(),
            userId: user.uid,
            parentId: taskData.parentId || null,
            completionDate: taskData.completionDate || null,
            dueDate: taskData.dueDate || null,
            reminder: taskData.reminder || false,
            tags: taskData.tags || [],
            description: taskData.description || '',
            priority: taskData.priority || null,
            source: taskData.source || null,
        };
        const docRef = await addDoc(getUserCollection('tasks'), taskToAdd);
        return docRef.id;
    },
    update: async (taskId, updates) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
        return updateDoc(taskRef, updates);
    },
    delete: async (taskId) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
        return deleteDoc(taskRef);
    },
    getAll: async () => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const q = query(getUserCollection('tasks'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }));
    },
    subscribe: (callback) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const q = query(getUserCollection('tasks'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const tasks = snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }));
            callback(tasks);
        });
    },
};
export const listService = {
    add: async (listData) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const listToAdd = {
            ...listData,
            createdAt: new Date(),
            userId: user.uid,
            folderId: listData.folderId || null,
        };
        const docRef = await addDoc(getUserCollection('lists'), listToAdd);
        return docRef.id;
    },
    update: async (listId, updates) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const listRef = doc(db, 'users', user.uid, 'lists', listId);
        return updateDoc(listRef, updates);
    },
    delete: async (listId) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const listRef = doc(db, 'users', user.uid, 'lists', listId);
        return deleteDoc(listRef);
    },
    getAll: async () => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const q = query(getUserCollection('lists'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }));
    },
    subscribe: (callback) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const q = query(getUserCollection('lists'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const lists = snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }));
            callback(lists);
        });
    },
};
export const tagService = {
    add: async (tagData) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const docRef = await addDoc(getUserCollection('tags'), {
            ...tagData,
            createdAt: new Date(),
            userId: user.uid,
        });
        return docRef.id;
    },
    update: async (tagId, updates) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const tagRef = doc(db, 'users', user.uid, 'tags', tagId);
        return updateDoc(tagRef, updates);
    },
    delete: async (tagId) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const tagRef = doc(db, 'users', user.uid, 'tags', tagId);
        return deleteDoc(tagRef);
    },
    getAll: async () => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const q = query(getUserCollection('tags'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }));
    },
    subscribe: (callback) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const q = query(getUserCollection('tags'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const tags = snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }));
            callback(tags);
        });
    },
};
export const listFolderService = {
    add: async (folderData) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const docRef = await addDoc(getUserCollection('listFolders'), {
            ...folderData,
            userId: user.uid,
        });
        return docRef.id;
    },
    update: async (folderId, updates) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const folderRef = doc(db, 'users', user.uid, 'listFolders', folderId);
        return updateDoc(folderRef, updates);
    },
    delete: async (folderId) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const folderRef = doc(db, 'users', user.uid, 'listFolders', folderId);
        return deleteDoc(folderRef);
    },
    getAll: async () => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const snapshot = await getDocs(getUserCollection('listFolders'));
        return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || 'Unnamed Folder',
                ...data
            };
        });
    },
    subscribe: (callback) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const q = query(getUserCollection('listFolders'));
        return onSnapshot(q, (snapshot) => {
            const folders = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || 'Unnamed Folder',
                    ...data
                };
            });
            callback(folders);
        });
    },
};
export const tagFolderService = {
    add: async (folderData) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const docRef = await addDoc(getUserCollection('tagFolders'), {
            ...folderData,
            userId: user.uid,
        });
        return docRef.id;
    },
    update: async (folderId, updates) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const folderRef = doc(db, 'users', user.uid, 'tagFolders', folderId);
        return updateDoc(folderRef, updates);
    },
    delete: async (folderId) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const folderRef = doc(db, 'users', user.uid, 'tagFolders', folderId);
        return deleteDoc(folderRef);
    },
    getAll: async () => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const snapshot = await getDocs(getUserCollection('tagFolders'));
        return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || 'Unnamed Folder',
                ...data
            };
        });
    },
    subscribe: (callback) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const q = query(getUserCollection('tagFolders'));
        return onSnapshot(q, (snapshot) => {
            const folders = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || 'Unnamed Folder',
                    ...data
                };
            });
            callback(folders);
        });
    },
};
export const logService = {
    add: async (logData) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const docRef = await addDoc(getUserCollection('logs'), {
            ...logData,
            createdAt: new Date(),
            userId: user.uid,
        });
        return docRef.id;
    },
    update: async (logId, updates) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const logRef = doc(db, 'users', user.uid, 'logs', logId);
        return updateDoc(logRef, updates);
    },
    delete: async (logId) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const logRef = doc(db, 'users', user.uid, 'logs', logId);
        return deleteDoc(logRef);
    },
    getAll: async () => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const q = query(getUserCollection('logs'), orderBy('logDate', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }));
    },
    subscribe: (callback) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const q = query(getUserCollection('logs'), orderBy('logDate', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const logs = snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }));
            callback(logs);
        });
    },
};
export const logTemplateService = {
    add: async (templateData) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const templateToAdd = {
            ...templateData,
            userId: user.uid,
            checklist: templateData.checklist || null,
            rating: templateData.rating || null,
        };
        const docRef = await addDoc(getUserCollection('logTemplates'), templateToAdd);
        return docRef.id;
    },
    update: async (templateId, updates) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const templateRef = doc(db, 'users', user.uid, 'logTemplates', templateId);
        return updateDoc(templateRef, updates);
    },
    delete: async (templateId) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const templateRef = doc(db, 'users', user.uid, 'logTemplates', templateId);
        return deleteDoc(templateRef);
    },
    getAll: async () => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const snapshot = await getDocs(getUserCollection('logTemplates'));
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    },
    subscribe: (callback) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const q = query(getUserCollection('logTemplates'));
        return onSnapshot(q, (snapshot) => {
            const templates = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            callback(templates);
        });
    },
};
export const focusService = {
    add: async (focusData) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const docRef = await addDoc(getUserCollection('foci'), {
            ...focusData,
            userId: user.uid,
        });
        return docRef.id;
    },
    update: async (focusId, updates) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const focusRef = doc(db, 'users', user.uid, 'foci', focusId);
        return updateDoc(focusRef, updates);
    },
    delete: async (focusId) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const focusRef = doc(db, 'users', user.uid, 'foci', focusId);
        return deleteDoc(focusRef);
    },
    getAll: async () => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const snapshot = await getDocs(getUserCollection('foci'));
        const foci = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return foci;
    },
    subscribe: (callback) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const q = query(getUserCollection('foci'));
        return onSnapshot(q, (snapshot) => {
            const foci = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            callback(foci);
        });
    },
};
// ============= ABHYASA MODULE =============
export const goalService = {
    add: async (goalData) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const goalToAdd = {
            ...goalData,
            startDate: new Date(),
            userId: user.uid,
            targetEndDate: goalData.targetEndDate || null,
        };
        const docRef = await addDoc(getUserCollection('goals'), goalToAdd);
        return docRef.id;
    },
    update: async (goalId, updates) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const goalRef = doc(db, 'users', user.uid, 'goals', goalId);
        return updateDoc(goalRef, updates);
    },
    delete: async (goalId) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const goalRef = doc(db, 'users', user.uid, 'goals', goalId);
        return deleteDoc(goalRef);
    },
    getAll: async () => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const q = query(getUserCollection('goals'), orderBy('startDate', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }));
    },
    subscribe: (callback) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const q = query(getUserCollection('goals'), orderBy('startDate', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const goals = snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }));
            callback(goals);
        });
    },
};
export const milestoneService = {
    add: async (milestoneData) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const milestoneToAdd = {
            ...milestoneData,
            userId: user.uid,
            description: milestoneData.description || '',
            targetEndDate: milestoneData.targetEndDate || null,
            focusAreaId: milestoneData.focusAreaId || null,
        };
        const docRef = await addDoc(getUserCollection('milestones'), milestoneToAdd);
        return docRef.id;
    },
    update: async (milestoneId, updates) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const milestoneRef = doc(db, 'users', user.uid, 'milestones', milestoneId);
        return updateDoc(milestoneRef, updates);
    },
    delete: async (milestoneId) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const milestoneRef = doc(db, 'users', user.uid, 'milestones', milestoneId);
        return deleteDoc(milestoneRef);
    },
    getAll: async () => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const q = query(getUserCollection('milestones'), orderBy('startDate', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }));
    },
    subscribe: (callback) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const q = query(getUserCollection('milestones'), orderBy('startDate', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const milestones = snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }));
            callback(milestones);
        });
    },
};
export const quickWinService = {
    add: async (quickWinData) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const docRef = await addDoc(getUserCollection('quickWins'), {
            ...quickWinData,
            createdAt: new Date(),
            userId: user.uid,
        });
        return docRef.id;
    },
    update: async (quickWinId, updates) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const quickWinRef = doc(db, 'users', user.uid, 'quickWins', quickWinId);
        return updateDoc(quickWinRef, updates);
    },
    delete: async (quickWinId) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const quickWinRef = doc(db, 'users', user.uid, 'quickWins', quickWinId);
        return deleteDoc(quickWinRef);
    },
    getAll: async () => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const q = query(getUserCollection('quickWins'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }));
    },
    subscribe: (callback) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const q = query(getUserCollection('quickWins'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const quickWins = snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }));
            callback(quickWins);
        });
    },
};
export const habitService = {
    add: async (habitData) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const habitToAdd = {
            ...habitData,
            createdAt: new Date(),
            userId: user.uid,
            dailyTarget: habitData.dailyTarget || null,
            dailyTargetComparison: habitData.dailyTargetComparison || null,
            totalTarget: habitData.totalTarget || null,
            totalTargetComparison: habitData.totalTargetComparison || null,
            checklist: habitData.checklist || [],
            milestoneId: habitData.milestoneId || null,
            goalId: habitData.goalId || null,
            focusAreaId: habitData.focusAreaId || null,
            endDate: habitData.endDate || null,
            reminders: habitData.reminders || [],
        };
        const docRef = await addDoc(getUserCollection('habits'), habitToAdd);
        return docRef.id;
    },
    update: async (habitId, updates) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const habitRef = doc(db, 'users', user.uid, 'habits', habitId);
        const cleanedUpdates = {};
        for (const key in updates) {
            const value = updates[key];
            if (value !== undefined) {
                cleanedUpdates[key] = value;
            }
        }
        return updateDoc(habitRef, cleanedUpdates);
    },
    delete: async (habitId) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const habitRef = doc(db, 'users', user.uid, 'habits', habitId);
        return deleteDoc(habitRef);
    },
    getAll: async () => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const q = query(getUserCollection('habits'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }));
    },
    subscribe: (callback) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const q = query(getUserCollection('habits'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const habits = snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }));
            callback(habits);
        });
    },
};
export const habitLogService = {
    add: async (habitLogData) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const habitLogToAdd = {
            ...habitLogData,
            userId: user.uid,
            value: habitLogData.value || null,
            completedChecklistItems: habitLogData.completedChecklistItems || [],
            count: habitLogData.count || 1, // Default count for backward compatibility
            status: habitLogData.status || HabitLogStatus.DONE, // Default status
            notes: habitLogData.notes || null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const docRef = await addDoc(getUserCollection('habitLogs'), habitLogToAdd);
        return docRef.id;
    },
    update: async (habitLogId, updates) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const habitLogRef = doc(db, 'users', user.uid, 'habitLogs', habitLogId);
        // Add updatedAt timestamp
        const updatesWithTimestamp = {
            ...updates,
            updatedAt: new Date(),
        };
        return updateDoc(habitLogRef, updatesWithTimestamp);
    },
    delete: async (habitLogId) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const habitLogRef = doc(db, 'users', user.uid, 'habitLogs', habitLogId);
        return deleteDoc(habitLogRef);
    },
    getAll: async () => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const q = query(getUserCollection('habitLogs'), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }));
    },
    subscribe: (callback) => {
        const user = getCurrentUser();
        if (!user)
            throw new Error('User not authenticated');
        const q = query(getUserCollection('habitLogs'), orderBy('date', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const habitLogs = snapshot.docs.map((doc) => convertTimestamps({ id: doc.id, ...doc.data() }));
            callback(habitLogs);
        });
    },
};
// ============= BULK OPERATIONS =============
export const initializeUserData = async () => {
    const user = getCurrentUser();
    if (!user)
        throw new Error('User not authenticated');
    // Check if user data already exists to prevent duplicate initialization
    const existingHabits = await habitService.getAll();
    const existingGoals = await goalService.getAll();
    // If user already has data, skip initialization
    if (existingHabits.length > 0 || existingGoals.length > 0) {
        console.log('User data already exists, skipping initialization');
        return;
    }
    console.log('Initializing user data for new user:', user.uid);
    // TODO: Implement data initialization when initial data is available
    console.log('User data initialization not implemented yet');
};
// ============= UTILITY FUNCTIONS =============
export const getAllUserData = async () => {
    const user = getCurrentUser();
    if (!user)
        throw new Error('User not authenticated');
    const [tasks, logs, habits, goals, milestones, quickWins, logTemplates, lists, tags, foci, listFolders, tagFolders,] = await Promise.all([
        taskService.getAll(),
        logService.getAll(),
        habitService.getAll(),
        goalService.getAll(),
        milestoneService.getAll(),
        quickWinService.getAll(),
        logTemplateService.getAll(),
        listService.getAll(),
        tagService.getAll(),
        focusService.getAll(),
        listFolderService.getAll(),
        tagFolderService.getAll(),
    ]);
    return {
        tasks,
        logs,
        habits,
        goals,
        milestones,
        quickWins,
        logTemplates,
        lists,
        tags,
        foci,
        listFolders,
        tagFolders,
    };
};
