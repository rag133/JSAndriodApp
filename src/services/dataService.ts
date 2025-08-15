import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Task, List, Tag, ListFolder, TagFolder } from '../types/kary';
import { Habit, HabitLog, Goal, Milestone, QuickWin } from '../types/abhyasa';
import { Log, LogTemplate, Focus } from '../types/dainandini';
import { dateToString } from '../utils/habitUtils';

// Helper function to get current user
const getCurrentUser = () => {
  const user = auth().currentUser;
  if (!user) throw new Error('User not authenticated');
  return user;
};

// Helper function to get user collection reference
const getUserCollection = (collectionName: string) => {
  const user = getCurrentUser();
  return firestore().collection('users').doc(user.uid).collection(collectionName);
};

// Helper to convert Firestore timestamps to dates
const convertTimestamps = (data: any): any => {
  if (!data) return data;
  
  const converted = { ...data };
  Object.keys(converted).forEach((key) => {
    if (converted[key]?.toDate) {
      // This is a Firestore timestamp
      converted[key] = converted[key].toDate();
    } else if (converted[key] && typeof converted[key] === 'object' && converted[key].constructor.name === 'Timestamp') {
      // Handle other timestamp formats
      try {
        converted[key] = converted[key].toDate();
      } catch (error) {
        console.warn(`Failed to convert timestamp for key ${key}:`, error);
        converted[key] = new Date(); // Fallback to current date
      }
    } else if (Array.isArray(converted[key])) {
      converted[key] = converted[key].map((item: any) =>
        typeof item === 'object' ? convertTimestamps(item) : item
      );
    }
  });
  
  return converted;
};

// ============= KARY MODULE (Task Management) =============

export const taskService = {
  add: async (taskData: Omit<Task, 'id'>): Promise<string> => {
    const user = getCurrentUser();
    
    // Clean up undefined values to prevent Firebase errors
    const cleanTaskData = Object.fromEntries(
      Object.entries(taskData).filter(([_, value]) => value !== undefined)
    );
    
    const taskToAdd = {
      ...cleanTaskData,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: user.uid,
      parentId: taskData.parentId || null,
      completionDate: taskData.completionDate || null,
      dueDate: taskData.dueDate || null,
      reminder: taskData.reminder || false,
      tags: taskData.tags || [],
      description: taskData.description || '',
      priority: taskData.priority || 3,
    };

    const docRef = await getUserCollection('tasks').add(taskToAdd);
    return docRef.id;
  },

  update: async (taskId: string, updates: Partial<Task>): Promise<void> => {
    // Clean up undefined values to prevent Firebase errors
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    // Add updatedAt timestamp
    const updatesWithTimestamp = {
      ...cleanUpdates,
      updatedAt: new Date(),
    };
    
    return getUserCollection('tasks').doc(taskId).update(updatesWithTimestamp);
  },

  delete: async (taskId: string): Promise<void> => {
    return getUserCollection('tasks').doc(taskId).delete();
  },

  getAll: async (): Promise<Task[]> => {
    const snapshot = await getUserCollection('tasks')
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((doc) => 
      convertTimestamps({ id: doc.id, ...doc.data() }) as Task
    );
  },

  subscribe: (callback: (tasks: Task[]) => void) => {
    return getUserCollection('tasks')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        const tasks = snapshot.docs.map((doc) => 
          convertTimestamps({ id: doc.id, ...doc.data() }) as Task
        );
        callback(tasks);
      });
  },
};

export const listService = {
  add: async (listData: Omit<List, 'id'>): Promise<string> => {
    const user = getCurrentUser();
    const listToAdd = { ...listData, userId: user.uid };
    const docRef = await getUserCollection('lists').add(listToAdd);
    return docRef.id;
  },

  update: async (listId: string, updates: Partial<List>): Promise<void> => {
    return getUserCollection('lists').doc(listId).update(updates);
  },

  delete: async (listId: string): Promise<void> => {
    return getUserCollection('lists').doc(listId).delete();
  },

  getAll: async (): Promise<List[]> => {
    const snapshot = await getUserCollection('lists').get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as List);
  },

  subscribe: (callback: (lists: List[]) => void) => {
    return getUserCollection('lists').onSnapshot((snapshot) => {
      const lists = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as List);
      callback(lists);
    });
  },
};

export const tagService = {
  add: async (tagData: Omit<Tag, 'id'>): Promise<string> => {
    const user = getCurrentUser();
    const tagToAdd = { ...tagData, userId: user.uid };
    const docRef = await getUserCollection('tags').add(tagToAdd);
    return docRef.id;
  },

  update: async (tagId: string, updates: Partial<Tag>): Promise<void> => {
    return getUserCollection('tags').doc(tagId).update(updates);
  },

  delete: async (tagId: string): Promise<void> => {
    return getUserCollection('tags').doc(tagId).delete();
  },

  getAll: async (): Promise<Tag[]> => {
    const snapshot = await getUserCollection('tags').get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Tag);
  },

  subscribe: (callback: (tags: Tag[]) => void) => {
    return getUserCollection('tags').onSnapshot((snapshot) => {
      const tags = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Tag);
      callback(tags);
    });
  },
};

// ============= ABHYASA MODULE (Habits & Goals) =============

export const habitService = {
  add: async (habitData: Omit<Habit, 'id'>): Promise<string> => {
    const user = getCurrentUser();
    
    // Clean up undefined values to prevent Firebase errors
    const cleanHabitData = Object.fromEntries(
      Object.entries(habitData).filter(([_, value]) => value !== undefined)
    );
    
    const habitToAdd = {
      ...cleanHabitData,
      startDate: cleanHabitData.startDate || new Date(),
      userId: user.uid,
    };
    const docRef = await getUserCollection('habits').add(habitToAdd);
    return docRef.id;
  },

  update: async (habitId: string, updates: Partial<Habit>): Promise<void> => {
    // Clean up undefined values to prevent Firebase errors
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    return getUserCollection('habits').doc(habitId).update(cleanUpdates);
  },

  delete: async (habitId: string): Promise<void> => {
    return getUserCollection('habits').doc(habitId).delete();
  },

  getAll: async (): Promise<Habit[]> => {
    const snapshot = await getUserCollection('habits')
      .orderBy('startDate', 'desc')
      .get();
    return snapshot.docs.map((doc) => 
      convertTimestamps({ id: doc.id, ...doc.data() }) as Habit
    );
  },

  subscribe: (callback: (habits: Habit[]) => void) => {
    return getUserCollection('habits')
      .orderBy('startDate', 'desc')
      .onSnapshot((snapshot) => {
        const habits = snapshot.docs.map((doc) => 
          convertTimestamps({ id: doc.id, ...doc.data() }) as Habit
        );
        callback(habits);
      });
  },
};

export const habitLogService = {
  add: async (logData: Omit<HabitLog, 'id'>): Promise<string> => {
    const user = getCurrentUser();
    
    // Clean up undefined values to prevent Firebase errors
    const cleanLogData = Object.fromEntries(
      Object.entries(logData).filter(([_, value]) => value !== undefined)
    );
    
    // Convert date to string format for storage (shared types compatibility)
    const dateToStore = cleanLogData.date instanceof Date 
      ? dateToString(cleanLogData.date)
      : cleanLogData.date || dateToString(new Date());
    
    const logToAdd = { 
      ...cleanLogData, 
      date: dateToStore, // Store as string (YYYY-MM-DD format)
      userId: user.uid 
    };
    const docRef = await getUserCollection('habitLogs').add(logToAdd);
    return docRef.id;
  },

  update: async (logId: string, updates: Partial<HabitLog>): Promise<void> => {
    // Clean up undefined values to prevent Firebase errors
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    // Convert date to string format if it's a Date object
    if (cleanUpdates.date instanceof Date) {
      cleanUpdates.date = dateToString(cleanUpdates.date);
    }
    
    return getUserCollection('habitLogs').doc(logId).update(cleanUpdates);
  },

  delete: async (logId: string): Promise<void> => {
    return getUserCollection('habitLogs').doc(logId).delete();
  },

  getAll: async (): Promise<HabitLog[]> => {
    const snapshot = await getUserCollection('habitLogs')
      .orderBy('date', 'desc')
      .get();
    return snapshot.docs.map((doc) => {
      const data = convertTimestamps({ id: doc.id, ...doc.data() }) as HabitLog;
      // Ensure date is always a string (shared types compatibility)
      if (data.date instanceof Date) {
        data.date = dateToString(data.date);
      }
      return data;
    });
  },

  subscribe: (callback: (logs: HabitLog[]) => void) => {
    return getUserCollection('habitLogs')
      .orderBy('date', 'desc')
      .onSnapshot((snapshot) => {
        const logs = snapshot.docs.map((doc) => {
          const data = convertTimestamps({ id: doc.id, ...doc.data() }) as HabitLog;
          // Ensure date is always a string (shared types compatibility)
          if (data.date instanceof Date) {
            data.date = dateToString(data.date);
          }
          return data;
        });
        callback(logs);
      });
  },
};

export const goalService = {
  add: async (goalData: Omit<Goal, 'id'>): Promise<string> => {
    const user = getCurrentUser();
    
    // Clean up undefined values to prevent Firebase errors
    const cleanGoalData = Object.fromEntries(
      Object.entries(goalData).filter(([_, value]) => value !== undefined)
    );
    
    const goalToAdd = {
      ...cleanGoalData,
      startDate: cleanGoalData.startDate || new Date(),
      userId: user.uid,
    };
    const docRef = await getUserCollection('goals').add(goalToAdd);
    return docRef.id;
  },

  update: async (goalId: string, updates: Partial<Goal>): Promise<void> => {
    // Clean up undefined values to prevent Firebase errors
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    return getUserCollection('goals').doc(goalId).update(cleanUpdates);
  },

  delete: async (goalId: string): Promise<void> => {
    return getUserCollection('goals').doc(goalId).delete();
  },

  getAll: async (): Promise<Goal[]> => {
    const snapshot = await getUserCollection('goals')
      .orderBy('startDate', 'desc')
      .get();
    return snapshot.docs.map((doc) => 
      convertTimestamps({ id: doc.id, ...doc.data() }) as Goal
    );
  },

  subscribe: (callback: (goals: Goal[]) => void) => {
    return getUserCollection('goals')
      .orderBy('startDate', 'desc')
      .onSnapshot((snapshot) => {
        const goals = snapshot.docs.map((doc) => 
          convertTimestamps({ id: doc.id, ...doc.data() }) as Goal
        );
        callback(goals);
      });
  },
};

// ============= DAINANDINI MODULE (Daily Logging) =============

export const logService = {
  add: async (logData: Omit<Log, 'id'>): Promise<string> => {
    const user = getCurrentUser();
    const logToAdd = {
      ...logData,
      date: logData.date || new Date(),
      userId: user.uid,
    };
    const docRef = await getUserCollection('logEntries').add(logToAdd);
    return docRef.id;
  },

  update: async (logId: string, updates: Partial<Log>): Promise<void> => {
    return getUserCollection('logEntries').doc(logId).update(updates);
  },

  delete: async (logId: string): Promise<void> => {
    return getUserCollection('logEntries').doc(logId).delete();
  },

  getAll: async (): Promise<Log[]> => {
    const snapshot = await getUserCollection('logEntries')
      .orderBy('date', 'desc')
      .get();
    return snapshot.docs.map((doc) => 
      convertTimestamps({ id: doc.id, ...doc.data() }) as Log
    );
  },

  subscribe: (callback: (logs: Log[]) => void) => {
    return getUserCollection('logEntries')
      .orderBy('date', 'desc')
      .onSnapshot((snapshot) => {
        const logs = snapshot.docs.map((doc) => 
          convertTimestamps({ id: doc.id, ...doc.data() }) as Log
        );
        callback(logs);
      });
  },
};

export const focusService = {
  add: async (focusData: Omit<Focus, 'id'>): Promise<string> => {
    const user = getCurrentUser();
    const focusToAdd = { ...focusData, userId: user.uid };
    const docRef = await getUserCollection('foci').add(focusToAdd);
    return docRef.id;
  },

  update: async (focusId: string, updates: Partial<Focus>): Promise<void> => {
    return getUserCollection('foci').doc(focusId).update(updates);
  },

  delete: async (focusId: string): Promise<void> => {
    return getUserCollection('foci').doc(focusId).delete();
  },

  getAll: async (): Promise<Focus[]> => {
    const snapshot = await getUserCollection('foci').get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Focus);
  },

  subscribe: (callback: (foci: Focus[]) => void) => {
    return getUserCollection('foci').onSnapshot((snapshot) => {
      const foci = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Focus);
      callback(foci);
    });
  },
};
