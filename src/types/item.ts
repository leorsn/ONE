export type OneItemType =
  | 'task'
  | 'reminder'
  | 'appointment'
  | 'event'
  | 'note'
  | 'link'
  | 'idea'
  | 'travel'
  | 'shopping';

export type OneSourceType =
  | 'manual'
  | 'share'
  | 'email'
  | 'screenshot'
  | 'photo'
  | 'link'
  | 'system';

export type OneItem = {
  id: string;
  title: string;
  rawInput?: string;
  type: OneItemType;
  date?: string;
  time?: string;
  reminderAt?: string;
  category?: string;
  location?: string;
  url?: string;
  notes?: string;
  completed: boolean;
  saved: boolean;
  sourceType: OneSourceType;
  sourceApp?: string;
  originalText?: string;
  attachmentUrl?: string;
  imageUrl?: string;
  extractedText?: string;
  userContext?: string;
  tags: string[];
  entities: string[];
  createdAt: string;
  updatedAt: string;
};
