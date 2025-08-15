export enum CalendarItemType {
  TASK = 'task',
  HABIT = 'habit',
  LOG = 'log',
  GOAL = 'goal',
  MILESTONE = 'milestone',
}

export interface CalendarItem {
  id: string;
  type: CalendarItemType;
  title: string;
  date: Date;
  completed?: boolean;
  priority?: 1 | 2 | 3 | 4;
  color?: string;
  metadata?: any; // Store original item data
}

export interface TimeSlot {
  id: string;
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  item: CalendarItem | null;
}

export interface HomeStore {
  calendarItems: CalendarItem[];
  selectedItem: CalendarItem | null;
  selectedDate: Date;
  loading: boolean;
  error: string | null;
  dragHistory: any[];
  isDragging: boolean;
  timeSlots: TimeSlot[];
  showTimeSlots: boolean;
  itemTypeFilters: Set<CalendarItemType>;
  realTimeSyncDisabled: boolean;
}
