export interface ListFolder {
  id: string;
  name: string;
}

export interface TagFolder {
  id: string;
  name: string;
}

export interface List {
  id: string;
  name: string;
  icon: string; // Icon name as string for React Native
  count?: number;
  color?: string;
  folderId?: string | null;
  isDefault?: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color: string; // e.g. 'red-500'
  icon?: string;
  folderId?: string | null;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  completionDate?: Date;
  parentId?: string; // ID of the parent task
  dueDate?: Date;
  reminder?: boolean;
  tags?: string[]; // Array of Tag IDs
  description?: string;
  priority?: 'P1' | 'P2' | 'P3' | 'P4' | '';
  subtasks?: Subtask[];
  source?: {
    text: string;
    url: string;
  };
}

export type Selection = { type: 'list'; id: string } | { type: 'tag'; id: string };
