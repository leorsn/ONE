import type { CaptureDraft, CaptureField, InterpretCaptureInput } from './core';

const genericTitles = new Set([
  'image',
  'document',
  'scanned document',
  'shared content',
  'shared to one',
  'shared to never',
  'captured in one',
  'captured in never'
]);

export function enrichCaptureDraft(draft: CaptureDraft, input: InterpretCaptureInput): CaptureDraft {
  const sourceText = [input.extractedText, input.rawText].filter(Boolean).join('\n').trim();
  const urls = extractWebUrls(sourceText);
  const entities = Array.from(new Set([
    ...draft.entities,
    ...urls.map((url) => `url:${url}`)
  ]));

  const replacementMerchant = shouldReplaceMerchant(draft.merchant, draft.documentKind)
    ? inferMerchantFromOcr(input.extractedText || '')
    : undefined;
  const merchant = replacementMerchant || draft.merchant;
  const merchantTitle = replacementMerchant
    ? draft.documentKind === 'invoice'
      ? `${replacementMerchant} invoice`
      : `${replacementMerchant} receipt`
    : undefined;
  const inferredTitle = merchantTitle || (shouldReplaceTitle(draft.title) ? inferUsefulTitle(sourceText) : undefined);
  const title = inferredTitle || draft.title;
  const url = draft.url || input.url || urls[0];
  const draftWithResolvedFacts = { ...draft, title, merchant, url };
  const userContext = draft.userContext || buildAutomaticContext(draftWithResolvedFacts, input.sourceType);
  const summary = shouldReplaceSummary(draft.summary, draft.title) || Boolean(replacementMerchant)
    ? userContext || title
    : draft.summary;

  const enriched: CaptureDraft = {
    ...draft,
    title,
    merchant,
    url,
    entities,
    userContext,
    summary
  };

  return reconcileExplicitScanEvidence(enriched, input, Boolean(inferredTitle));
}

export function extractWebUrls(value: string) {
  const raw = value.match(/(?:https?:\/\/|www\.)[^\s<>"')\]}]+/gi) || [];
  return Array.from(new Set(raw.map(normalizeWebUrl).filter(Boolean)));
}

function reconcileExplicitScanEvidence(draft: CaptureDraft, input: InterpretCaptureInput, inferredTitle: boolean): CaptureDraft {
  if (input.sourceType !== 'scan') return draft;

  const safelyResolved = new Set<CaptureField>();
  if (inferredTitle) safelyResolved.add('title');
  if (draft.captureKind === 'document' || draft.captureKind === 'receipt') safelyResolved.add('type');
  if (!safelyResolved.size) return draft;

  const fieldConfidence = { ...draft.fieldConfidence };
  for (const field of safelyResolved) fieldConfidence[field] = 'high';

  const needsReview = draft.needsReview.filter((field) => !safelyResolved.has(field));
  const ambiguities = draft.ambiguities.filter((ambiguity) => !safelyResolved.has(ambiguity.field));
  const overallConfidence = needsReview.some((field) => fieldConfidence[field] === 'low')
    ? 'low' as const
    : needsReview.length
      ? 'medium' as const
      : 'high' as const;

  return {
    ...draft,
    fieldConfidence,
    needsReview,
    ambiguities,
    overallConfidence,
    destination: needsReview.length
      ? 'inbox'
      : draft.destinationConfirmed
        ? draft.destination
        : ['document', 'receipt', 'image', 'screenshot', 'link', 'idea', 'note'].includes(draft.captureKind)
          ? 'saved'
          : draft.destination
  };
}

function inferUsefulTitle(value: string) {
  const lines = value
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean)
    .filter((line) => !isLowSignalLine(line));

  const candidate = lines.find((line) => line.length >= 3 && line.length <= 100);
  return candidate ? truncate(candidate, 100) : undefined;
}

function inferMerchantFromOcr(value: string) {
  const rejected = /^(receipt|beleg|rechnung|invoice|datum|date|total|summe|gesamt|tax|mwst|ust|tel|phone|www\.|http|amount due|zu zahlen)/i;
  return value
    .split(/\r?\n/)
    .map(cleanLine)
    .find((line) =>
      line.length >= 2 &&
      line.length <= 70 &&
      !rejected.test(line) &&
      !shouldReplaceTitle(line) &&
      !/^\d/.test(line) &&
      !/[€$£]\s?\d|\d[.,]\d{2}\s?(?:€|eur|usd|gbp)/i.test(line)
    );
}

function buildAutomaticContext(draft: CaptureDraft, sourceType?: InterpretCaptureInput['sourceType']) {
  const kind = draft.captureKind;
  const title = draft.title.trim();

  if (draft.documentKind === 'receipt' || kind === 'receipt') {
    const merchant = draft.merchant?.trim();
    const amount = draft.amount !== undefined ? formatAmount(draft.amount, draft.currency) : undefined;
    if (merchant && amount) return `Receipt from ${merchant} for ${amount}.`;
    if (merchant) return `Receipt from ${merchant}.`;
    return title && !shouldReplaceTitle(title) ? `Receipt: ${title}.` : 'Scanned receipt.';
  }

  if (draft.documentKind === 'invoice') {
    return draft.merchant ? `Invoice from ${draft.merchant}.` : title ? `Invoice: ${title}.` : 'Scanned invoice.';
  }

  if (kind === 'document' || draft.documentKind) {
    const label = documentLabel(draft.documentKind);
    return title && !shouldReplaceTitle(title) ? `${label}: ${title}.` : `${label} saved from ${sourceLabel(sourceType)}.`;
  }

  if (kind === 'link' && draft.url) {
    const host = hostname(draft.url);
    return host ? `Saved link from ${host}.` : 'Saved web link.';
  }

  if (kind === 'appointment' || kind === 'event' || kind === 'reminder') {
    const timing = [draft.date, draft.time].filter(Boolean).join(' at ');
    if (timing) return `${title}${title.endsWith('.') ? '' : '.'} ${timing}.`;
    return title ? `${title}${title.endsWith('.') ? '' : '.'}` : undefined;
  }

  if ((kind === 'image' || kind === 'screenshot') && title && !shouldReplaceTitle(title)) {
    return `Saved image: ${title}.`;
  }

  return undefined;
}

function shouldReplaceMerchant(value: string | undefined, documentKind?: CaptureDraft['documentKind']) {
  if (!value || !['receipt', 'invoice'].includes(documentKind || '')) return false;
  return shouldReplaceTitle(value) || /\.(?:jpe?g|png|heic|pdf)$/i.test(value.trim());
}

function shouldReplaceTitle(value?: string) {
  const clean = value?.trim();
  if (!clean) return true;
  const normalized = clean.toLowerCase();
  if (genericTitles.has(normalized)) return true;
  if (/^(?:img|dsc|scan|screenshot|photo|image)[-_\s]?\d{2,}/i.test(clean)) return true;
  if (/^[a-f0-9-]{16,}\.(?:jpe?g|png|heic|pdf)$/i.test(clean)) return true;
  if (/\.(?:jpe?g|png|heic|pdf)$/i.test(clean) && !/\s/.test(clean)) return true;
  return false;
}

function shouldReplaceSummary(summary: string | undefined, previousTitle: string) {
  if (!summary?.trim()) return true;
  const clean = summary.trim();
  return clean === previousTitle || shouldReplaceTitle(clean);
}

function isLowSignalLine(line: string) {
  const clean = line.trim();
  if (!clean) return true;
  if (shouldReplaceTitle(clean)) return true;
  if (/^(?:subject|from|to|date|time|location|ort|address|reference|confirmation|total|gesamt|summe|amount due|balance due|zu zahlen)\s*:/i.test(clean)) return true;
  if (/^(?:https?:\/\/|www\.)\S+$/i.test(clean)) return true;
  if (/^[\d\s.,:;/€$£+-]+$/.test(clean)) return true;
  if (/^\S+@\S+\.\S+$/.test(clean)) return true;
  return false;
}

function cleanLine(value: string) {
  return value.replace(/\s{2,}/g, ' ').replace(/^[•·\-–—\s]+|[•·\-–—\s]+$/g, '').trim();
}

function normalizeWebUrl(value: string) {
  const clean = value.replace(/[.,;:!?]+$/g, '').trim();
  if (!clean) return '';
  return /^www\./i.test(clean) ? `https://${clean}` : clean;
}

function hostname(value: string) {
  try {
    return new URL(normalizeWebUrl(value)).hostname.replace(/^www\./i, '');
  } catch {
    return undefined;
  }
}

function sourceLabel(value?: InterpretCaptureInput['sourceType']) {
  if (value === 'scan') return 'scan';
  if (value === 'screenshot') return 'screenshot';
  if (value === 'photo') return 'photo';
  if (value === 'share') return 'share';
  return 'capture';
}

function documentLabel(kind?: CaptureDraft['documentKind']) {
  if (kind === 'ticket') return 'Ticket';
  if (kind === 'reservation') return 'Reservation';
  if (kind === 'contract') return 'Contract';
  if (kind === 'letter') return 'Letter';
  if (kind === 'business_card') return 'Business card';
  return 'Document';
}

function formatAmount(amount: number, currency?: string) {
  try {
    if (currency) return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount);
  } catch {
    // Fall through to a stable plain representation.
  }
  return currency ? `${amount.toFixed(2)} ${currency}` : amount.toFixed(2);
}

function truncate(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
