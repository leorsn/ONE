import { buildGroundedRecallAnswer } from '@/src/search/grounded';
import type { OneItem } from '@/src/types/item';

export type OneDirectAnswer = {
  kind: 'spend_total' | 'amount_threshold' | 'document_count' | 'memory';
  title: string;
  body: string;
  meta?: string;
  itemIds: string[];
};

const monthNames: Array<{ index: number; names: string[] }> = [
  { index: 0, names: ['january', 'januar'] },
  { index: 1, names: ['february', 'februar'] },
  { index: 2, names: ['march', 'marz', 'maerz', 'märz'] },
  { index: 3, names: ['april'] },
  { index: 4, names: ['may', 'mai'] },
  { index: 5, names: ['june', 'juni'] },
  { index: 6, names: ['july', 'juli'] },
  { index: 7, names: ['august'] },
  { index: 8, names: ['september'] },
  { index: 9, names: ['october', 'oktober'] },
  { index: 10, names: ['november'] },
  { index: 11, names: ['december', 'dezember'] }
];

export function buildDirectAnswer(
  query: string,
  items: OneItem[],
  bestMatch?: OneItem,
  now = new Date()
): OneDirectAnswer | undefined {
  const normalized = normalize(query);
  if (!normalized.trim()) return undefined;

  const german = looksGerman(normalized);
  const threshold = extractAmountThreshold(normalized);

  if (threshold !== undefined && mentionsDocuments(normalized)) {
    const kind = requestedDocumentKind(normalized);
    const matching = items
      .filter((item) => item.amount !== undefined && item.amount > threshold)
      .filter((item) => !kind || item.documentKind === kind)
      .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));

    if (matching.length) {
      const currency = dominantCurrency(matching);
      return {
        kind: 'amount_threshold',
        title: german
          ? `${matching.length} ${matching.length === 1 ? 'Dokument' : 'Dokumente'} über ${formatMoney(threshold, currency, true)}`
          : `${matching.length} ${matching.length === 1 ? 'document' : 'documents'} over ${formatMoney(threshold, currency, false)}`,
        body: matching
          .slice(0, 3)
          .map((item) => `${item.merchant || item.title} · ${formatMoney(item.amount!, item.currency || currency, german)}`)
          .join('\n'),
        meta: matching.length > 3
          ? german ? `+ ${matching.length - 3} weitere` : `+ ${matching.length - 3} more`
          : undefined,
        itemIds: matching.map((item) => item.id)
      };
    }
  }

  if (mentionsSpending(normalized)) {
    const window = resolveDateWindow(normalized, now);
    const matching = items
      .filter((item) => item.amount !== undefined)
      .filter((item) => isWithinWindow(item.date, window));

    if (matching.length) {
      const totals = groupTotals(matching);
      const totalText = Object.entries(totals)
        .map(([currency, total]) => formatMoney(total, currency, german))
        .join(' + ');
      const period = formatWindow(window, german);

      return {
        kind: 'spend_total',
        title: totalText,
        body: `${matching.length} ${german ? (matching.length === 1 ? 'Beleg' : 'Belege') : (matching.length === 1 ? 'receipt' : 'receipts')}${period ? ` · ${period}` : ''}`,
        meta: german ? 'Aus deinen gespeicherten Belegen' : 'From your saved receipts',
        itemIds: matching.map((item) => item.id)
      };
    }
  }

  if (mentionsCount(normalized) && mentionsDocuments(normalized)) {
    const kind = requestedDocumentKind(normalized);
    const matching = items.filter((item) => item.type === 'document' && (!kind || item.documentKind === kind));

    return {
      kind: 'document_count',
      title: String(matching.length),
      body: german
        ? kind === 'invoice' ? 'gespeicherte Rechnungen' : kind === 'receipt' ? 'gespeicherte Belege' : 'gespeicherte Dokumente'
        : kind === 'invoice' ? 'saved invoices' : kind === 'receipt' ? 'saved receipts' : 'saved documents',
      itemIds: matching.map((item) => item.id)
    };
  }

  const grounded = buildGroundedRecallAnswer(query, items, bestMatch);
  if (grounded) return { kind: 'memory', ...grounded };

  return undefined;
}

function requestedDocumentKind(value: string) {
  if (value.includes('invoice') || value.includes('rechnung')) return 'invoice' as const;
  if (value.includes('receipt') || value.includes('beleg') || value.includes('bon')) return 'receipt' as const;
  return undefined;
}

function mentionsSpending(value: string) {
  return /wie viel|wieviel|ausgegeben|ausgabe|bezahlt|gekostet|summe|gesamt|how much|spent|spend|paid|total/.test(value);
}

function mentionsDocuments(value: string) {
  return /beleg|belege|bon|bons|rechnung|rechnungen|receipt|receipts|invoice|invoices|document|documents/.test(value);
}

function mentionsCount(value: string) {
  return /wie viele|wieviele|anzahl|how many|count/.test(value);
}

function extractAmountThreshold(value: string) {
  const symbolic = value.match(/>\s*(?:€|eur|usd|gbp)?\s*([\d.,]+)/);
  const verbal = value.match(/(?:uber|more than|above|greater than|over)\s*(?:€|eur|usd|gbp)?\s*([\d.,]+)/);
  const raw = symbolic?.[1] || verbal?.[1];
  if (!raw) return undefined;
  const parsed = parseLooseNumber(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseLooseNumber(value: string) {
  const comma = value.lastIndexOf(',');
  const dot = value.lastIndexOf('.');
  if (comma > dot) return Number(value.replace(/\./g, '').replace(',', '.'));
  if (dot > comma && value.length - dot - 1 === 3) return Number(value.replace(/\./g, ''));
  return Number(value.replace(/,/g, ''));
}

type DateWindow = { start?: Date; end?: Date; labelMonth?: number; labelYear?: number };

function resolveDateWindow(value: string, now: Date): DateWindow {
  if (/this month|diesen monat/.test(value)) return monthWindow(now.getFullYear(), now.getMonth());

  if (/last month|letzten monat|vorigen monat/.test(value)) {
    const date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return monthWindow(date.getFullYear(), date.getMonth());
  }

  for (const month of monthNames) {
    if (month.names.some((name) => value.includes(normalize(name)))) {
      const yearMatch = value.match(/\b(20\d{2})\b/);
      let year = yearMatch ? Number(yearMatch[1]) : now.getFullYear();
      if (!yearMatch && month.index > now.getMonth()) year -= 1;
      return monthWindow(year, month.index);
    }
  }

  return {};
}

function monthWindow(year: number, month: number): DateWindow {
  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 1),
    labelMonth: month,
    labelYear: year
  };
}

function isWithinWindow(iso: string | undefined, window: DateWindow) {
  if (!window.start || !window.end) return true;
  if (!iso) return false;
  const date = new Date(`${iso}T12:00:00`);
  return date >= window.start && date < window.end;
}

function groupTotals(items: OneItem[]) {
  const totals: Record<string, number> = {};
  for (const item of items) {
    if (item.amount === undefined) continue;
    const currency = item.currency || 'EUR';
    totals[currency] = (totals[currency] || 0) + item.amount;
  }
  return totals;
}

function dominantCurrency(items: OneItem[]) {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const currency = item.currency || 'EUR';
    counts[currency] = (counts[currency] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'EUR';
}

function formatMoney(amount: number, currency: string, german: boolean) {
  try {
    return new Intl.NumberFormat(german ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatWindow(window: DateWindow, german: boolean) {
  if (window.labelMonth === undefined || window.labelYear === undefined) return '';
  return new Intl.DateTimeFormat(german ? 'de-DE' : 'en-US', {
    month: 'long',
    year: 'numeric'
  }).format(new Date(window.labelYear, window.labelMonth, 1));
}

function looksGerman(value: string) {
  return /\b(wie|viel|wann|wo|beleg|rechnung|ausgegeben|bezahlt|monat|uber|zeigen|zeig|mir|geschenk|idee)\b/.test(value);
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}
