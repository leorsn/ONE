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

export type OneItemKind =
  | 'note'
  | 'event'
  | 'reminder'
  | 'document'
  | 'receipt'
  | 'image'
  | 'link'
  | 'unknown';

export type OneDestination = 'inbox' | 'calendar' | 'saved';
export type OneReviewStatus = 'ready' | 'needs_review' | 'reviewed';
export type OneUnderstandingConfidence = 'high' | 'medium' | 'low';
export type OneTriageState = 'new' | 'needs_review' | 'actionable' | 'processed' | 'archived';
export type OneInboxAction =
  | 'add_to_calendar'
  | 'create_reminder'
  | 'save_reference'
  | 'save_purchase'
  | 'save_note'
  | 'mark_processed'
  | 'archive';

/** Device-local delivery state. Never synced as an account-wide fact. */
export type OneNotificationStatus =
  | 'not_applicable'
  | 'scheduled'
  | 'permission_denied'
  | 'unsupported'
  | 'not_scheduled'
  | 'error';

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

export type OneSyncState = 'local' | 'pending' | 'synced';

export type OneItem = {
  id: string;
  title: string;
  rawInput?: string;
  type: OneItemType;
  kind?: OneItemKind;
  summary?: string;
  people?: string[];
  destination?: OneDestination;
  reviewStatus?: OneReviewStatus;
  ambiguities?: string[];
  understandingConfidence?: OneUnderstandingConfidence;
  triageState?: OneTriageState;
  executedActions?: OneInboxAction[];
  processedAt?: string;
  archivedAt?: string;
  deferredUntil?: string;
  date?: string;
  time?: string;
  reminderAt?: string;
  /** Device-local notification identifier and status. */
  notificationId?: string;
  notificationStatus?: OneNotificationStatus;
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
  localAttachmentUri?: string;
  localAttachmentMimeType?: string;
  localAttachmentName?: string;
  extractedText?: string;
  userContext?: string;
  documentKind?: OneDocumentKind;
  merchant?: string;
  amount?: number;
  currency?: string;
  tags: string[];
  entities: string[];
  syncState?: OneSyncState;
  createdAt: string;
  updatedAt: string;
};
