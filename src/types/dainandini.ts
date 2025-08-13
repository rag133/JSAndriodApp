export enum LogType {
  TEXT = 'text',
  CHECKLIST = 'checklist',
  RATING = 'rating',
  IMAGE = 'image',
  VOICE = 'voice',
}

export interface Focus {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  allowedLogTypes: LogType[];
}

export interface LogTemplate {
  id: string;
  name: string;
  description?: string;
  template: string;
  focusId: string;
  userId: string;
}

export interface Log {
  id: string;
  title: string;
  content: string;
  type: LogType;
  focusId: string;
  templateId?: string;
  date: Date;
  mood?: number; // 1-10 scale
  tags?: string[];
  metadata?: Record<string, any>;
  userId: string;
}
