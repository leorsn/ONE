import type {
  OneDestination,
  OneItemKind,
  OneItemType
} from '@/src/types/item';

export type CaptureConfidence = 'high' | 'medium' | 'low';

export type CaptureKind =
  | 'task'
  | 'note'
  | 'reminder'
  | 'appointment'
  | 'event'
  | 'link'
  | 'screenshot'
  | 'image'
  | 'document'
  | 'receipt'
  | 'idea'
  | 'unknown';

export type CaptureItemType = OneItemType;

export type CaptureDocumentKind =
  | 'receipt'
  | 'invoice'
  | 'ticket'
  | 'reservation'
  | 'letter'
  | 'contract'
  | 'business_card'
  | 'other';

export type CaptureField =
  | 'title'
  | 'type'
  | 'date'
  | 'time'
  | 'location'
  | 'category'
  | 'merchant'
  | 'amount'
  | 'currency';

export type CaptureAmbiguityCode =
  | 'confirm_title'
  | 'confirm_type'
  | 'confirm_date'
  | 'missing_date'
  | 'missing_time'
  | 'confirm_merchant'
  | 'missing_merchant'
  | 'confirm_amount'
  | 'missing_amount'
  | 'confirm_currency';

export type CaptureAmbiguity = {
  code: CaptureAmbiguityCode;
  field: CaptureField;
  message: string;
};

export type CaptureDraft = {
  title: string;
  summary?: string;
  captureKind: CaptureKind;
  itemType: CaptureItemType;
  canonicalKind: OneItemKind;
  date?: string;
  time?: string;
  location?: string;
  category?: string;
  url?: string;
  userContext?: string;
  extractedText?: string;
  documentKind?: CaptureDocumentKind;
  merchant?: string;
  amount?: number;
  currency?: string;
  people: string[];
  tags: string[];
  entities: string[];
  saved: boolean;
  destination: OneDestination;
  destinationConfirmed: boolean;
  overallConfidence: CaptureConfidence;
  fieldConfidence: Partial<Record<CaptureField, CaptureConfidence>>;
  needsReview: CaptureField[];
  ambiguities: CaptureAmbiguity[];
  confirmedFields: CaptureField[];
};

export type InterpretCaptureInput = {
  rawText?: string;
  extractedText?: string;
  userContext?: string;
  sourceType?: 'manual' | 'share' | 'scan' | 'email' | 'screenshot' | 'photo' | 'link' | 'system';
  isImage?: boolean;
  url?: string;
  now?: Date;
};

type DateExtraction = { value: string; confidence: CaptureConfidence };
type TimeExtraction = { value: string; confidence: CaptureConfidence };
type AmountExtraction = { amount: number; currency?: string; confidence: CaptureConfidence };

const weekdays: Record<string, number> = {
  sunday: 0, sonntag: 0,
  monday: 1, montag: 1,
  tuesday: 2, dienstag: 2,
  wednesday: 3, mittwoch: 3,
  thursday: 4, donnerstag: 4,
  friday: 5, freitag: 5,
  saturday: 6, samstag: 6
};

const months: Record<string, number> = {
  january: 0, januar: 0,
  february: 1, februar: 1,
  march: 2, marz: 2, maerz: 2, märz: 2,
  april: 3,
  may: 4, mai: 4,
  june: 5, juni: 5,
  july: 6, juli: 6,
  august: 7,
  september: 8,
  october: 9, oktober: 9,
  november: 10,
  december: 11, dezember: 11
};

export function interpretCapture(input: InterpretCaptureInput): CaptureDraft {
  const now = input.now ?? new Date();
  const raw = input.rawText?.trim() || '';
  const ocr = input.extractedText?.trim() || '';
  const context = input.userContext?.trim() || '';
  const sourceText = [raw, ocr].filter(Boolean).join('\n');
  const combined = [context, sourceText].filter(Boolean).join('\n');
  const normalized = normalize(combined);

  const documentKind = inferDocumentKind(sourceText);
  const explicitKind = classifyExplicitContext(context);
  const automaticKind = classifyAutomatic({
    text: normalized,
    documentKind,
    isImage: Boolean(input.isImage),
    sourceType: input.sourceType,
    url: input.url || extractUrl(raw)
  });
  const captureKind = explicitKind ?? automaticKind.kind;
  const itemType = itemTypeForCaptureKind(captureKind);
  const canonicalKind = canonicalKindForCaptureKind(captureKind);

  const date = extractDate(combined, now);
  const time = extractTime(combined);
  const location = extractLocation(sourceText);
  const money = documentKind === 'receipt' || documentKind === 'invoice'
    ? extractExplicitTotal(sourceText)
    : undefined;
  const merchant = documentKind === 'receipt' || documentKind === 'invoice'
    ? inferMerchant(sourceText)
    : undefined;
  const people = extractPeople(combined);

  const title = inferTitle({
    raw,
    ocr,
    context,
    captureKind,
    documentKind,
    merchant
  });

  const genericTitle = title === 'Shared to ONE' || title === 'Captured in ONE' || title === 'Image' || title === 'Document';
  const fieldConfidence: CaptureDraft['fieldConfidence'] = {
    title: genericTitle ? 'low' : input.sourceType === 'manual' && raw ? 'high' : merchant ? 'medium' : 'medium',
    type: explicitKind ? 'high' : automaticKind.confidence,
    ...(date ? { date: date.confidence } : {}),
    ...(time ? { time: time.confidence } : {}),
    ...(location ? { location: 'high' } : {}),
    ...(merchant ? { merchant: 'medium' } : {}),
    ...(money ? {
      amount: money.confidence,
      ...(money.currency ? { currency: 'high' as const } : {})
    } : {})
  };

  addExpectedFieldConfidence(fieldConfidence, captureKind, {
    hasDate: Boolean(date),
    hasTime: Boolean(time),
    hasMerchant: Boolean(merchant),
    hasAmount: Boolean(money)
  });

  const tags = unique([
    ...tagsFromText(context),
    ...tagsFromText(sourceText),
    ...(documentKind ? ['document', documentKind] : []),
    captureKind === 'screenshot' || captureKind === 'image' ? 'image' : '',
    captureKind === 'receipt' ? 'receipt' : '',
    captureKind === 'idea' ? 'idea' : '',
    captureKind === 'appointment' ? 'appointment' : '',
    captureKind === 'event' ? 'event' : '',
    captureKind === 'reminder' ? 'reminder' : ''
  ]);

  const entities = unique([
    ...extractUrls(sourceText).map((value) => `url:${value}`),
    ...extractEmails(sourceText).map((value) => `email:${value}`),
    ...extractPhones(sourceText).map((value) => `phone:${value}`),
    ...extractReferences(sourceText).map((value) => `reference:${value}`),
    ...people.map((value) => `person:${value}`),
    ...(merchant ? [`merchant:${merchant}`] : []),
    ...(money ? [`amount:${money.amount}${money.currency ? ` ${money.currency}` : ''}`] : [])
  ]);

  const base: CaptureDraft = {
    title,
    summary: buildSummary({ title, context, ocr, date: date?.value, time: time?.value, location, merchant, money }),
    captureKind,
    itemType,
    canonicalKind,
    date: date?.value,
    time: time?.value,
    location,
    category: categoryFor(captureKind, documentKind),
    url: input.url || extractUrl(raw),
    userContext: context || undefined,
    extractedText: ocr || undefined,
    documentKind,
    merchant,
    amount: money?.amount,
    currency: money?.currency,
    people,
    tags,
    entities,
    saved: shouldSaveByDefault(captureKind),
    destination: suggestedDestination(captureKind),
    destinationConfirmed: false,
    overallConfidence: automaticKind.confidence,
    fieldConfidence,
    needsReview: [],
    ambiguities: [],
    confirmedFields: []
  };

  return refreshReviewMetadata(base);
}

export function applyUserContextPriority(draft: CaptureDraft, userContext: string): CaptureDraft {
  const clean = userContext.trim();
  const explicitKind = classifyExplicitContext(clean);
  const tags = unique([...draft.tags, ...tagsFromText(clean)]);

  const next = explicitKind
    ? {
        ...draft,
        userContext: clean || undefined,
        captureKind: explicitKind,
        itemType: itemTypeForCaptureKind(explicitKind),
        canonicalKind: canonicalKindForCaptureKind(explicitKind),
        category: categoryFor(explicitKind, draft.documentKind),
        saved: shouldSaveByDefault(explicitKind),
        tags: unique([
          ...tags,
          explicitKind === 'idea' ? 'idea' : '',
          explicitKind === 'appointment' ? 'appointment' : '',
          explicitKind === 'reminder' ? 'reminder' : ''
        ]),
        fieldConfidence: { ...draft.fieldConfidence, type: 'high' as const },
        confirmedFields: uniqueFields([...draft.confirmedFields, 'type'])
      }
    : { ...draft, userContext: clean || undefined, tags };

  return refreshReviewMetadata({
    ...next,
    summary: buildSummary({
      title: next.title,
      context: clean,
      ocr: next.extractedText || '',
      date: next.date,
      time: next.time,
      location: next.location,
      merchant: next.merchant,
      money: next.amount !== undefined
        ? { amount: next.amount, currency: next.currency, confidence: next.fieldConfidence.amount || 'medium' }
        : undefined
    })
  });
}

export function setCaptureKind(draft: CaptureDraft, captureKind: CaptureKind): CaptureDraft {
  const nextDocumentKind =
    captureKind === 'receipt'
      ? 'receipt'
      : captureKind === 'document'
        ? draft.documentKind || 'other'
        : draft.documentKind;

  const next: CaptureDraft = {
    ...draft,
    captureKind,
    itemType: itemTypeForCaptureKind(captureKind),
    canonicalKind: canonicalKindForCaptureKind(captureKind),
    documentKind: nextDocumentKind,
    category: categoryFor(captureKind, nextDocumentKind),
    saved: shouldSaveByDefault(captureKind),
    fieldConfidence: { ...draft.fieldConfidence, type: 'high' },
    confirmedFields: uniqueFields([...draft.confirmedFields, 'type'])
  };

  return refreshReviewMetadata(next);
}

export function setCaptureDestination(draft: CaptureDraft, destination: OneDestination): CaptureDraft {
  return { ...draft, destination, destinationConfirmed: true };
}

export function confirmCaptureField(draft: CaptureDraft, field: CaptureField): CaptureDraft {
  return refreshReviewMetadata({
    ...draft,
    fieldConfidence: { ...draft.fieldConfidence, [field]: 'high' },
    confirmedFields: uniqueFields([...draft.confirmedFields, field])
  });
}

export function requiresStructuredReview(draft: CaptureDraft) {
  return (
    ['appointment', 'event', 'reminder', 'receipt', 'document', 'unknown'].includes(draft.captureKind) ||
    draft.needsReview.length > 0
  );
}

export function canonicalKindForCaptureKind(kind: CaptureKind): OneItemKind {
  if (kind === 'appointment' || kind === 'event') return 'event';
  if (kind === 'reminder') return 'reminder';
  if (kind === 'receipt') return 'receipt';
  if (kind === 'document') return 'document';
  if (kind === 'screenshot' || kind === 'image') return 'image';
  if (kind === 'link') return 'link';
  if (kind === 'unknown') return 'unknown';
  return 'note';
}

export function extractDate(text: string, now = new Date()): DateExtraction | undefined {
  const input = normalize(text);

  if (/\b(day after tomorrow|uber morgen|uebermorgen|übermorgen)\b/.test(input)) {
    const date = startOfDay(now);
    date.setDate(date.getDate() + 2);
    return { value: toIsoDate(date), confidence: 'high' };
  }

  if (/\b(today|heute)\b/.test(input)) {
    return { value: toIsoDate(startOfDay(now)), confidence: 'high' };
  }

  if (/\b(tomorrow|morgen)\b/.test(input)) {
    const date = startOfDay(now);
    date.setDate(date.getDate() + 1);
    return { value: toIsoDate(date), confidence: 'high' };
  }

  for (const [name, target] of Object.entries(weekdays)) {
    if (new RegExp(`\\b${escapeRegExp(normalize(name))}\\b`).test(input)) {
      const date = nextWeekday(now, target);
      // A bare weekday is intentionally reviewable: "Friday" can mean different
      // things to different users even though ONE chooses the next occurrence.
      return { value: toIsoDate(date), confidence: 'medium' };
    }
  }

  const monthNames = Object.keys(months).map(normalize).join('|');
  const dayMonth = input.match(new RegExp(`\\b([1-9]|[12]\\d|3[01])(?:st|nd|rd|th)?\\.?\\s+(?:of\\s+)?(${monthNames})(?:\\s*,?\\s*(20\\d{2}))?\\b`, 'i'));
  if (dayMonth) {
    const candidate = validCalendarDate(
      dayMonth[3] ? Number(dayMonth[3]) : now.getFullYear(),
      months[dayMonth[2]],
      Number(dayMonth[1])
    );
    if (candidate) {
      if (!dayMonth[3] && candidate < startOfDay(now)) candidate.setFullYear(candidate.getFullYear() + 1);
      return { value: toIsoDate(candidate), confidence: 'high' };
    }
  }

  const monthDay = input.match(new RegExp(`\\b(${monthNames})\\s+([1-9]|[12]\\d|3[01])(?:st|nd|rd|th)?(?:\\s*,?\\s*(20\\d{2}))?\\b`, 'i'));
  if (monthDay) {
    const candidate = validCalendarDate(
      monthDay[3] ? Number(monthDay[3]) : now.getFullYear(),
      months[monthDay[1]],
      Number(monthDay[2])
    );
    if (candidate) {
      if (!monthDay[3] && candidate < startOfDay(now)) candidate.setFullYear(candidate.getFullYear() + 1);
      return { value: toIsoDate(candidate), confidence: 'high' };
    }
  }

  const numeric = input.match(/\b([1-9]|[12]\d|3[01])[./-](0?[1-9]|1[0-2])(?:[./-](20\d{2}|\d{2}))?\b/);
  if (numeric) {
    let year = numeric[3] ? Number(numeric[3]) : now.getFullYear();
    if (year < 100) year += 2000;
    const candidate = validCalendarDate(year, Number(numeric[2]) - 1, Number(numeric[1]));
    if (candidate) {
      if (!numeric[3] && candidate < startOfDay(now)) candidate.setFullYear(candidate.getFullYear() + 1);
      return { value: toIsoDate(candidate), confidence: 'high' };
    }
  }

  const dayOnly = input.match(/(?:\bon(?:\s+the)?\b|\bam\b)\s*([1-9]|[12]\d|3[01])(?:st|nd|rd|th)?\.?\b/);
  if (dayOnly) {
    const day = Number(dayOnly[1]);
    let candidate = validCalendarDate(now.getFullYear(), now.getMonth(), day);
    if (!candidate || candidate < startOfDay(now)) {
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      candidate = validCalendarDate(next.getFullYear(), next.getMonth(), day);
    }
    if (candidate) return { value: toIsoDate(candidate), confidence: 'medium' };
  }

  return undefined;
}

export function extractTime(text: string): TimeExtraction | undefined {
  const input = normalize(text);
  const twelveHour = input.match(/\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b/i);
  if (twelveHour) {
    let hour = Number(twelveHour[1]) % 12;
    if (twelveHour[3].toLowerCase() === 'pm') hour += 12;
    return {
      value: `${String(hour).padStart(2, '0')}:${twelveHour[2] || '00'}`,
      confidence: 'high'
    };
  }

  const twentyFour = input.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
  if (twentyFour) {
    return {
      value: `${twentyFour[1].padStart(2, '0')}:${twentyFour[2]}`,
      confidence: 'high'
    };
  }

  const hourOnly = input.match(/\b([01]?\d|2[0-3])\s*(?:uhr|h)\b/);
  if (hourOnly) {
    return { value: `${hourOnly[1].padStart(2, '0')}:00`, confidence: 'high' };
  }

  return undefined;
}

export function extractExplicitTotal(text: string): AmountExtraction | undefined {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const totalLines = lines.filter((line) => /\b(total|gesamt|summe|amount due|balance due|zu zahlen|endbetrag)\b/i.test(line));

  for (const line of totalLines) {
    const money = parseMoneyFromLine(line);
    if (money) return { ...money, confidence: 'high' };
  }

  return undefined;
}

export function inferDocumentKind(text: string): CaptureDocumentKind | undefined {
  const lower = normalize(text);
  if (/\binvoice\b|rechnung|rechnungsnr|invoice no|invoice number/.test(lower)) return 'invoice';
  if (/\breceipt\b|beleg|kassenbon|\bbon\b/.test(lower) || /\b(total|gesamt|zu zahlen)\b/.test(lower)) return 'receipt';
  if (/boarding pass|boardkarte|\bticket\b|fahrkarte/.test(lower)) return 'ticket';
  if (/reservation|reservierung|booking confirmation|buchungsbestatigung/.test(lower)) return 'reservation';
  if (/\bcontract\b|vertrag|vereinbarung/.test(lower)) return 'contract';
  if (/business card|visitenkarte/.test(lower)) return 'business_card';
  if (/dear |sehr geehrt|anschreiben|\bbrief\b/.test(lower)) return 'letter';
  return undefined;
}

export function itemTypeForCaptureKind(kind: CaptureKind): CaptureItemType {
  if (kind === 'receipt' || kind === 'document') return 'document';
  if (kind === 'screenshot' || kind === 'image' || kind === 'unknown') return 'note';
  return kind;
}

function classifyExplicitContext(context: string): CaptureKind | undefined {
  const value = normalize(context);
  if (!value) return undefined;
  if (/gift|geschenk|birthday|geburtstag/.test(value)) return 'idea';
  if (/appointment|termin|dentist|zahnarzt|doctor|arzt/.test(value)) return 'appointment';
  if (/remind|erinner|cancel|kundig|kuendig/.test(value)) return 'reminder';
  if (/idea|idee/.test(value)) return 'idea';
  return undefined;
}

function classifyAutomatic({
  text,
  documentKind,
  isImage,
  sourceType,
  url
}: {
  text: string;
  documentKind?: CaptureDocumentKind;
  isImage: boolean;
  sourceType?: InterpretCaptureInput['sourceType'];
  url?: string;
}): { kind: CaptureKind; confidence: CaptureConfidence } {
  if (documentKind === 'receipt') return { kind: 'receipt', confidence: 'high' };
  if (documentKind) return { kind: 'document', confidence: 'high' };
  if (url) return { kind: 'link', confidence: 'high' };
  if (/appointment|termin|dentist|zahnarzt|doctor|arzt|clinic|praxis/.test(text)) return { kind: 'appointment', confidence: 'high' };
  if (/remind|erinner|cancel|kundig|kuendig/.test(text)) return { kind: 'reminder', confidence: 'high' };
  if (/gift|geschenk|birthday|geburtstag|\bidea\b|idee/.test(text)) return { kind: 'idea', confidence: 'high' };
  if (/\b(meet|meeting|meet with|treffe|treffen)\b|\bevent\b|veranstaltung|konzert|concert/.test(text)) return { kind: 'event', confidence: 'medium' };
  if (/^(call|buy|pick up|send|email|finish|pay|book|anrufen|kaufen|abholen|senden|bezahlen|buchen)\b/.test(text)) return { kind: 'task', confidence: 'medium' };
  if (sourceType === 'scan') return { kind: 'document', confidence: 'medium' };
  if (isImage || sourceType === 'screenshot' || sourceType === 'photo') return { kind: 'image', confidence: 'high' };
  if (!text.trim()) return { kind: 'unknown', confidence: 'low' };
  if (sourceType === 'manual') return { kind: 'note', confidence: 'high' };
  return { kind: 'note', confidence: 'medium' };
}

function inferTitle({
  raw,
  ocr,
  context,
  captureKind,
  documentKind,
  merchant
}: {
  raw: string;
  ocr: string;
  context: string;
  captureKind: CaptureKind;
  documentKind?: CaptureDocumentKind;
  merchant?: string;
}) {
  if (merchant) {
    if (documentKind === 'invoice') return `${merchant} invoice`;
    if (documentKind === 'receipt') return `${merchant} receipt`;
    return `${merchant} document`;
  }

  const lines = [raw, ocr]
    .join('\n')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const keywordLine = lines.find((line) => {
    const value = normalize(line);
    return line.length <= 120 && (
      /appointment|termin|dentist|zahnarzt|doctor|arzt|cancel|kundig|kuendig|remind|gift|geschenk|birthday|meet|meeting/.test(value)
    );
  });

  const meaningful = keywordLine || lines.find((line) => !/^(subject|from|to|date|time|location|ort|address|reference|confirmation|total|gesamt)\s*:/i.test(line));
  if (meaningful) {
    const cleaned = cleanTitle(meaningful, captureKind);
    if (cleaned) return truncate(cleaned, 100);
  }

  if (context) return truncate(context, 100);
  if (captureKind === 'screenshot' || captureKind === 'image') return 'Image';
  if (captureKind === 'document' || captureKind === 'receipt') return 'Document';
  if (captureKind === 'unknown') return 'Captured in ONE';
  return raw ? truncate(cleanTitle(raw, captureKind), 100) : 'Captured in ONE';
}

function inferMerchant(text: string) {
  const rejected = /^(receipt|beleg|rechnung|invoice|datum|date|total|summe|gesamt|tax|mwst|ust|tel|phone|www\.|http|amount due|zu zahlen)/i;
  return text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s{2,}/g, ' '))
    .find((line) =>
      line.length >= 2 &&
      line.length <= 70 &&
      !rejected.test(line) &&
      !/^\d/.test(line) &&
      !/[€$£]\s?\d|\d[.,]\d{2}\s?(?:€|eur|usd|gbp)/i.test(line)
    );
}

function extractLocation(text: string) {
  const match = text.match(/^(?:location|ort|address|adresse|place|where)\s*[:\-]\s*(.+)$/im);
  return match?.[1]?.trim() || undefined;
}

function extractPeople(text: string) {
  const matches = [...text.matchAll(/(?:\bcall\b|\bmeet\b|\bwith\b|\bsee\b|\banrufen\b|\btreffe\b|\bmit\b)\s+([A-ZÄÖÜ][A-Za-zÀ-ÖØ-öø-ÿÄÖÜäöüß'’-]{1,40})/g)];
  return unique(matches.map((match) => match[1]));
}

function addExpectedFieldConfidence(
  confidence: CaptureDraft['fieldConfidence'],
  kind: CaptureKind,
  state: { hasDate: boolean; hasTime: boolean; hasMerchant: boolean; hasAmount: boolean }
) {
  if (['appointment', 'event', 'reminder'].includes(kind)) {
    if (!state.hasDate) confidence.date = 'low';
    if (!state.hasTime) confidence.time = 'low';
  }
  if (kind === 'receipt') {
    if (!state.hasMerchant) confidence.merchant = 'low';
    if (!state.hasAmount) confidence.amount = 'low';
  }
  if (kind === 'unknown') confidence.type = 'low';
}

function refreshReviewMetadata(draft: CaptureDraft): CaptureDraft {
  const confirmed = new Set(draft.confirmedFields);
  const structured = ['appointment', 'event', 'reminder', 'receipt', 'document'].includes(draft.captureKind);

  const uncertain = (Object.entries(draft.fieldConfidence) as [CaptureField, CaptureConfidence][])
    .filter(([field, confidence]) => !confirmed.has(field) && confidence !== 'high')
    .map(([field]) => field);

  let needsReview = structured || draft.captureKind === 'unknown'
    ? uncertain
    : uncertain.filter((field) => field === 'type' && draft.fieldConfidence.type === 'low');

  if (draft.captureKind === 'receipt') {
    if (!draft.merchant && !confirmed.has('merchant')) needsReview = uniqueFields([...needsReview, 'merchant']);
    if (draft.amount === undefined && !confirmed.has('amount')) needsReview = uniqueFields([...needsReview, 'amount']);
  }
  if (['appointment', 'event', 'reminder'].includes(draft.captureKind)) {
    if (!draft.date && !confirmed.has('date')) needsReview = uniqueFields([...needsReview, 'date']);
    if (!draft.time && !confirmed.has('time')) needsReview = uniqueFields([...needsReview, 'time']);
  }

  const ambiguities = needsReview.map((field) => ambiguityFor(field, draft));
  const overallConfidence: CaptureConfidence = needsReview.some((field) => draft.fieldConfidence[field] === 'low')
    ? 'low'
    : needsReview.length
      ? 'medium'
      : 'high';

  const destination = needsReview.length
    ? 'inbox'
    : draft.destinationConfirmed
      ? draft.destination
      : suggestedDestination(draft.captureKind);

  return {
    ...draft,
    canonicalKind: canonicalKindForCaptureKind(draft.captureKind),
    destination,
    overallConfidence,
    needsReview,
    ambiguities,
    summary: buildSummary({
      title: draft.title,
      context: draft.userContext || '',
      ocr: draft.extractedText || '',
      date: draft.date,
      time: draft.time,
      location: draft.location,
      merchant: draft.merchant,
      money: draft.amount !== undefined
        ? { amount: draft.amount, currency: draft.currency, confidence: draft.fieldConfidence.amount || 'medium' }
        : undefined
    })
  };
}

function ambiguityFor(field: CaptureField, draft: CaptureDraft): CaptureAmbiguity {
  if (field === 'date') {
    return draft.date
      ? { code: 'confirm_date', field, message: 'Confirm the inferred date.' }
      : { code: 'missing_date', field, message: 'A date is still missing.' };
  }
  if (field === 'time') return { code: 'missing_time', field, message: 'A time is still missing.' };
  if (field === 'merchant') {
    return draft.merchant
      ? { code: 'confirm_merchant', field, message: 'Confirm the detected merchant.' }
      : { code: 'missing_merchant', field, message: 'Merchant could not be confirmed.' };
  }
  if (field === 'amount') {
    return draft.amount !== undefined
      ? { code: 'confirm_amount', field, message: 'Confirm the detected total.' }
      : { code: 'missing_amount', field, message: 'No explicit receipt total was found.' };
  }
  if (field === 'currency') return { code: 'confirm_currency', field, message: 'Confirm the detected currency.' };
  if (field === 'title') return { code: 'confirm_title', field, message: 'Confirm the suggested title.' };
  return { code: 'confirm_type', field: 'type', message: 'Confirm what this capture is.' };
}

function suggestedDestination(kind: CaptureKind): OneDestination {
  if (['appointment', 'event', 'reminder'].includes(kind)) return 'calendar';
  if (kind === 'task') return 'inbox';
  if (kind === 'unknown') return 'inbox';
  return 'saved';
}

function buildSummary({
  title,
  context,
  ocr,
  date,
  time,
  location,
  merchant,
  money
}: {
  title: string;
  context: string;
  ocr: string;
  date?: string;
  time?: string;
  location?: string;
  merchant?: string;
  money?: AmountExtraction;
}) {
  const structured = [
    merchant && merchant !== title ? merchant : undefined,
    money ? `${money.amount}${money.currency ? ` ${money.currency}` : ''}` : undefined,
    date,
    time,
    location
  ].filter(Boolean);
  if (structured.length) return truncate(`${title} · ${structured.join(' · ')}`, 220);

  const contextLine = context.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  if (contextLine && contextLine !== title) return truncate(contextLine, 220);
  const ocrLine = ocr.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  if (ocrLine && ocrLine !== title) return truncate(ocrLine, 220);
  return truncate(title, 220);
}

function parseMoneyFromLine(line: string) {
  const currencyFirst = line.match(/(?:€|EUR|\$|USD|£|GBP)\s*([0-9][\d.,]*)/i);
  const currencyLast = line.match(/([0-9][\d.,]*)\s*(€|EUR|\$|USD|£|GBP)/i);
  const bare = line.match(/\b([0-9]+(?:[.,][0-9]{2}))\b/);

  const rawNumber = currencyFirst?.[1] || currencyLast?.[1] || bare?.[1];
  if (!rawNumber) return undefined;

  const amount = parseLocalizedNumber(rawNumber);
  if (amount === undefined) return undefined;

  const marker = currencyFirst?.[0] || currencyLast?.[0] || '';
  return { amount, currency: currencyFor(marker) };
}

function parseLocalizedNumber(value: string) {
  const comma = value.lastIndexOf(',');
  const dot = value.lastIndexOf('.');
  let normalized = value;

  if (comma > dot) normalized = value.replace(/\./g, '').replace(',', '.');
  else if (dot > comma) normalized = value.replace(/,/g, '');
  else normalized = value.replace(',', '.');

  const number = Number(normalized);
  return Number.isFinite(number) ? number : undefined;
}

function currencyFor(value: string) {
  const lower = value.toLowerCase();
  if (value.includes('€') || lower.includes('eur')) return 'EUR';
  if (value.includes('£') || lower.includes('gbp')) return 'GBP';
  if (value.includes('$') || lower.includes('usd')) return 'USD';
  return undefined;
}

function categoryFor(kind: CaptureKind, documentKind?: CaptureDocumentKind) {
  if (kind === 'appointment') return 'Appointment';
  if (kind === 'reminder') return 'Reminder';
  if (kind === 'idea') return 'Ideas';
  if (kind === 'link') return 'Links';
  if (kind === 'receipt' || documentKind === 'receipt' || documentKind === 'invoice') return 'Receipts';
  if (kind === 'document') return 'Documents';
  if (kind === 'screenshot' || kind === 'image') return 'Images';
  if (kind === 'event') return 'Events';
  return undefined;
}

function shouldSaveByDefault(kind: CaptureKind) {
  return ['note', 'link', 'screenshot', 'image', 'document', 'receipt', 'idea'].includes(kind);
}

function tagsFromText(text: string) {
  const value = normalize(text);
  const tags: string[] = [];
  if (/dad|father|papa|vater/.test(value)) tags.push('dad');
  if (/mom|mother|mama|mutter/.test(value)) tags.push('mom');
  if (/gift|geschenk|birthday|geburtstag/.test(value)) tags.push('gift');
  if (/appointment|termin|dentist|zahnarzt|doctor|arzt/.test(value)) tags.push('appointment');
  if (/receipt|beleg|bon|invoice|rechnung/.test(value)) tags.push('finance');
  if (/hotel|flight|flug|reise|travel|airbnb|paris|barcelona/.test(value)) tags.push('travel');
  if (/ikea|amazon|order|bestellung|shopping/.test(value)) tags.push('shopping');
  return tags;
}

function extractUrl(text: string) {
  return extractUrls(text)[0];
}

function extractUrls(text: string) {
  return text.match(/https?:\/\/[^\s]+|www\.[^\s]+/gi) ?? [];
}

function extractEmails(text: string) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
}

function extractPhones(text: string) {
  return (text.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{2,4}/g) ?? [])
    .map((value) => value.trim())
    .filter((value) => value.replace(/\D/g, '').length >= 7);
}

function extractReferences(text: string) {
  const matches = [...text.matchAll(/(?:confirmation|reference|booking|bestatigung|referenz)\s*(?:no\.?|number|nr\.?|#)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9-]{3,})/gi)];
  return matches.map((match) => match[1]);
}

function cleanTitle(value: string, kind: CaptureKind) {
  const weekdayNames = Object.keys(weekdays).join('|');
  let next = value
    .replace(/\b(day after tomorrow|today|tomorrow|heute|morgen|uebermorgen|übermorgen)\b/gi, '')
    .replace(new RegExp(`\\b(${weekdayNames})\\b`, 'gi'), '')
    .replace(/(?:\bon(?:\s+the)?\b|\bam\b)\s*([1-9]|[12]\d|3[01])(?:st|nd|rd|th)?\.?/gi, '')
    .replace(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/g, '')
    .replace(/\b(?:at|um)\s+(?=to\b|$)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (kind === 'reminder') {
    next = next
      .replace(/^remind me\s*(?:at\s*)?(?:to\s*)?/i, '')
      .replace(/^erinnere mich\s*(?:daran\s*)?(?:zu\s*)?/i, '')
      .replace(/^to\s+/i, '')
      .trim();
  }

  return next.replace(/^[,;:\-–—\s]+|[,;:\-–—\s]+$/g, '').trim();
}

function validCalendarDate(year: number, month: number, day: number) {
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return undefined;
  return date;
}

function nextWeekday(now: Date, targetDay: number) {
  const result = startOfDay(now);
  let delta = (targetDay - result.getDay() + 7) % 7;
  if (delta === 0) delta = 7;
  result.setDate(result.getDate() + delta);
  return result;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function truncate(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function uniqueFields(values: CaptureField[]) {
  return Array.from(new Set(values));
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
