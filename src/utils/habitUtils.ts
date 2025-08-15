import { Habit, HabitLog, HabitLogStatus, HabitType, HabitTargetComparison, HabitFrequencyType } from '../types/abhyasa';

export interface CalculatedStatus {
  status: HabitLogStatus;
  progress: number;
  isComplete: boolean;
}

// Utility functions for date handling
export const dateToString = (date: Date): string => {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
};

export const stringToDate = (dateString: string): Date => {
  return new Date(dateString + 'T00:00:00.000Z');
};

// Convert HabitLog date field for mobile app usage
export const getLogDate = (log: HabitLog): Date => {
  if (typeof log.date === 'string') {
    return stringToDate(log.date);
  }
  return log.date as Date;
};

export const calculateHabitStatus = (
  habit: Habit,
  log: HabitLog | null
): CalculatedStatus => {
  if (!log) {
    return { status: HabitLogStatus.NONE, progress: 0, isComplete: false };
  }

  switch (habit.type) {
    case HabitType.BINARY:
      // Binary habits are either done or not done
      return { status: HabitLogStatus.DONE, progress: 1, isComplete: true };

    case HabitType.COUNT:
      return calculateCountStatus(habit, log);

    case HabitType.DURATION:
      return calculateDurationStatus(habit, log);

    case HabitType.CHECKLIST:
      return calculateChecklistStatus(habit, log);

    default:
      return { status: HabitLogStatus.NONE, progress: 0, isComplete: false };
  }
};

const calculateCountStatus = (habit: Habit, log: HabitLog): CalculatedStatus => {
  const value = log.value || 0;
  const target = habit.dailyTarget || 1;
  const comparison = habit.dailyTargetComparison || HabitTargetComparison.AT_LEAST;

  let isComplete = false;
  let progress = 0;

  switch (comparison) {
    case HabitTargetComparison.AT_LEAST:
      isComplete = value >= target;
      progress = Math.min(1, value / target);
      break;
    case HabitTargetComparison.LESS_THAN:
      isComplete = value < target;
      progress = value > 0 ? 1 : 0;
      break;
    case HabitTargetComparison.EXACTLY:
      isComplete = value === target;
      progress = value > 0 ? Math.min(1, value / target) : 0;
      break;
    case HabitTargetComparison.ANY_VALUE:
      isComplete = value > 0;
      progress = value > 0 ? 1 : 0;
      break;
  }

  const status = isComplete ? HabitLogStatus.DONE : 
                 value > 0 ? HabitLogStatus.PARTIAL : 
                 HabitLogStatus.NONE;

  return { status, progress, isComplete };
};

const calculateDurationStatus = (habit: Habit, log: HabitLog): CalculatedStatus => {
  const value = log.value || 0; // Value in minutes
  const target = habit.dailyTarget || 1;
  const comparison = habit.dailyTargetComparison || HabitTargetComparison.AT_LEAST;

  let isComplete = false;
  let progress = 0;

  switch (comparison) {
    case HabitTargetComparison.AT_LEAST:
      isComplete = value >= target;
      progress = Math.min(1, value / target);
      break;
    case HabitTargetComparison.LESS_THAN:
      isComplete = value < target;
      progress = value > 0 ? 1 : 0;
      break;
    case HabitTargetComparison.EXACTLY:
      isComplete = value === target;
      progress = value > 0 ? Math.min(1, value / target) : 0;
      break;
    case HabitTargetComparison.ANY_VALUE:
      isComplete = value > 0;
      progress = value > 0 ? 1 : 0;
      break;
  }

  const status = isComplete ? HabitLogStatus.DONE : 
                 value > 0 ? HabitLogStatus.PARTIAL : 
                 HabitLogStatus.NONE;

  return { status, progress, isComplete };
};

const calculateChecklistStatus = (habit: Habit, log: HabitLog): CalculatedStatus => {
  const total = habit.checklist?.length || 0;
  const completedCount = log.completedChecklistItems?.length || 0;

  if (total === 0) {
    return { status: HabitLogStatus.NONE, progress: 0, isComplete: false };
  }

  const progress = completedCount / total;
  const isComplete = completedCount === total;

  const status = isComplete ? HabitLogStatus.DONE : 
                 completedCount > 0 ? HabitLogStatus.PARTIAL : 
                 HabitLogStatus.NONE;

  return { status, progress, isComplete };
};

// Updated to handle both string and Date date fields
export const shouldShowHabitOnDate = (
  habit: Habit,
  date: Date,
  allHabitLogs: HabitLog[]
): boolean => {
  const start = new Date(habit.startDate);
  start.setHours(0, 0, 0, 0);
  const end = habit.endDate ? new Date(habit.endDate) : null;
  if (end) end.setHours(23, 59, 59, 999);

  if (date < start || (end && date > end)) {
    return false;
  }

  switch (habit.frequency.type) {
    case HabitFrequencyType.DAILY:
      return true;
    case HabitFrequencyType.SPECIFIC_DAYS:
      return habit.frequency.days.includes(date.getDay());
    case HabitFrequencyType.WEEKLY: {
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const logsInWeek = allHabitLogs.filter(log => {
        const logDate = getLogDate(log); // Use utility function to get Date
        return log.habitId === habit.id && 
               logDate >= weekStart && 
               logDate <= weekEnd;
      });

      const completedLogsInWeek = logsInWeek.filter(log => {
        const status = calculateHabitStatus(habit, log);
        return status.status === HabitLogStatus.DONE;
      });

      return completedLogsInWeek.length < habit.frequency.times;
    }
    case HabitFrequencyType.MONTHLY: {
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      const logsInMonth = allHabitLogs.filter(log => {
        const logDate = getLogDate(log); // Use utility function to get Date
        return log.habitId === habit.id && 
               logDate >= monthStart && 
               logDate <= monthEnd;
      });

      const completedLogsInMonth = logsInMonth.filter(log => {
        const status = calculateHabitStatus(habit, log);
        return status.status === HabitLogStatus.DONE;
      });

      return completedLogsInMonth.length < habit.frequency.times;
    }
    default:
      return false;
  }
};

export const isSameDay = (d1?: Date | null, d2?: Date | null): boolean => {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};
