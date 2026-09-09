export type OneItemType =
  | 'task'
  | 'reminder'
  | 'appointment'
  | 'event'
  | 'note'
  | 'link'
  | 'idea'
  | 'travel'
  | 'shopping'
  | 'document';

export type OneSourceType =
  | 'manual'
  | 'share'
  | 'scan'
  | 'email'
  | 'screenshot'
  | 'photo'
  | 'link'
  | 'system';

export type OneDocumentKind =
  | 'receipt'
  | 'invoice'
  | 'ticket'
  | 'reservation'
  | 'letter'
  | 'contract'
  | 'business_card'
  | 'other';

export type OneItem = {
  id: string;
  title: string;
  rawInput?: string;
  type: OneItemType;
  date?: string;
  time?: string;
  reminderAt?: string;
  notificationId?: string;
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
  documentKind?: OneDocumentKind;
  merchant?: string;
  amount?: number;
  currency?: string;
  tags: string[];
  entities: string[];
  createdAt: string;
  updatedAt: string;
};
