// Debounce utility for auto-save functionality
// Prevents excessive API calls by delaying execution until after a period of inactivity

export interface DebounceOptions {
  delay?: number;
  immediate?: boolean;
}

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified delay has passed since the last time it was invoked.
 * 
 * @param func - The function to debounce
 * @param delay - The delay in milliseconds (default: 2000ms)
 * @param immediate - Whether to invoke on the leading edge instead of trailing
 * @returns The debounced function with cancel method
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 2000,
  immediate: boolean = false
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastCallTime: number = 0;

  const debouncedFunction = (...args: Parameters<T>) => {
    const now = Date.now();
    lastCallTime = now;

    const later = () => {
      timeoutId = null;
      if (!immediate) {
        func.apply(null, args);
      }
    };

    const callNow = immediate && !timeoutId;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(later, delay);

    if (callNow) {
      func.apply(null, args);
    }
  };

  // Add cancel method to clear pending execution
  debouncedFunction.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFunction as T & { cancel: () => void };
}

/**
 * Creates a throttled function that only invokes the provided function
 * at most once per specified time period.
 * 
 * @param func - The function to throttle
 * @param delay - The delay in milliseconds (default: 1000ms)
 * @returns The throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 1000
): T {
  let lastCallTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return ((...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCallTime >= delay) {
      lastCallTime = now;
      func.apply(null, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        timeoutId = null;
        func.apply(null, args);
      }, delay - (now - lastCallTime));
    }
  }) as T;
}

/**
 * Auto-save manager for handling multiple debounced saves
 * Useful when you have multiple fields that need independent auto-save timers
 */
export class AutoSaveManager {
  private saveCallbacks: Map<string, ReturnType<typeof debounce>> = new Map();
  private defaultDelay: number;

  constructor(defaultDelay: number = 2000) {
    this.defaultDelay = defaultDelay;
  }

  /**
   * Registers a field for auto-save with its own debounced callback
   * @param fieldName - Unique identifier for the field
   * @param saveCallback - Function to call when saving
   * @param delay - Custom delay for this field (optional)
   */
  registerField<T extends (...args: any[]) => any>(
    fieldName: string,
    saveCallback: T,
    delay?: number
  ) {
    const debouncedSave = debounce(saveCallback, delay || this.defaultDelay);
    this.saveCallbacks.set(fieldName, debouncedSave);
    return debouncedSave;
  }

  /**
   * Triggers auto-save for a specific field
   * @param fieldName - The field to save
   * @param args - Arguments to pass to the save callback
   */
  triggerSave(fieldName: string, ...args: any[]) {
    const callback = this.saveCallbacks.get(fieldName);
    if (callback) {
      callback(...args);
    }
  }

  /**
   * Cancels pending save for a specific field
   * @param fieldName - The field to cancel
   */
  cancelSave(fieldName: string) {
    const callback = this.saveCallbacks.get(fieldName);
    if (callback && 'cancel' in callback) {
      callback.cancel();
    }
  }

  /**
   * Cancels all pending saves
   */
  cancelAllSaves() {
    this.saveCallbacks.forEach((callback) => {
      if ('cancel' in callback) {
        callback.cancel();
      }
    });
  }

  /**
   * Removes a field from auto-save management
   * @param fieldName - The field to remove
   */
  unregisterField(fieldName: string) {
    this.cancelSave(fieldName);
    this.saveCallbacks.delete(fieldName);
  }

  /**
   * Clears all registered fields
   */
  clear() {
    this.cancelAllSaves();
    this.saveCallbacks.clear();
  }
}

/**
 * Hook-like function to create an auto-save manager instance
 * @param defaultDelay - Default delay for all fields
 * @returns AutoSaveManager instance
 */
export function createAutoSaveManager(defaultDelay: number = 2000): AutoSaveManager {
  return new AutoSaveManager(defaultDelay);
}

export default {
  debounce,
  throttle,
  AutoSaveManager,
  createAutoSaveManager,
};
