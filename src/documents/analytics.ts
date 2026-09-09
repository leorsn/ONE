import type { OneDocumentKind, OneItem } from '@/src/types/item';

export type CurrencyTotal = {
  currency: string;
  amount: number;
};

export type DocumentSummary = {
  monthLabel: string;
  documents: OneItem[];
  receipts: number;
  invoices: number;
  other: number;
  totals: CurrencyTotal[];
  largest?: OneItem;
  topMerchant?: { name: string; count: number; total?: number; currency?: string };
};

export function getDocumentSummary(items: OneItem[], referenceDate = new Date()): DocumentSummary {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  const documents = items
    .filter((item) => item.type === 'document')
    .filter((item) => isInMonth(item.date, year, month))
    .sort(sortNewestFirst);

  const receipts = documents.filter((item) => item.documentKind === 'receipt').length;
  const invoices = documents.filter((item) => item.documentKind === 'invoice').length;
  const other = documents.length - receipts - invoices;

  return {
    monthLabel: new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(
      new Date(year, month, 1)
    ),
    documents,
    receipts,
    invoices,
    other,
    totals: sumByCurrency(documents),
    largest: documents
      .filter((item) => item.amount !== undefined)
      .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))[0],
    topMerchant: findTopMerchant(documents)
  };
}

export function filterDocuments(
  items: OneItem[],
  kind: 'all' | OneDocumentKind,
  query = ''
) {
  const clean = normalize(query);

  return items
    .filter((item) => item.type === 'document')
    .filter((item) => kind === 'all' || item.documentKind === kind)
    .filter((item) => {
      if (!clean) return true;

      const haystack = [
        item.title,
        item.merchant,
        item.category,
        item.documentKind,
        item.date,
        item.currency,
        item.amount !== undefined ? String(item.amount) : undefined,
        item.extractedText,
        item.userContext,
        ...item.tags,
        ...item.entities
      ]
        .filter(Boolean)
        .join(' ');

      return normalize(haystack).includes(clean);
    })
    .sort(sortNewestFirst);
}

export function groupDocumentsByMonth(items: OneItem[]) {
  const groups = new Map<string, { label: string; items: OneItem[] }>();

  for (const item of items) {
    const key = monthKey(item);
    const group = groups.get(key);

    if (group) {
      group.items.push(item);
    } else {
      groups.set(key, {
        label: monthLabel(item),
        items: [item]
      });
    }
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, group]) => ({
      ...group,
      items: group.items.sort(sortNewestFirst)
    }));
}

export function formatCurrencyTotal(total: CurrencyTotal, locale = 'en-US') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: total.currency
    }).format(total.amount);
  } catch {
    return total.amount.toFixed(2) + ' ' + total.currency;
  }
}

export function formatItemAmount(item: OneItem, locale = 'en-US') {
  if (item.amount === undefined) return undefined;

  return formatCurrencyTotal(
    {
      amount: item.amount,
      currency: item.currency || 'EUR'
    },
    locale
  );
}

function sumByCurrency(items: OneItem[]) {
  const totals = new Map<string, number>();

  for (const item of items) {
    if (item.amount === undefined) continue;
    const currency = item.currency || 'EUR';
    totals.set(currency, (totals.get(currency) || 0) + item.amount);
  }

  return Array.from(totals.entries())
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function findTopMerchant(items: OneItem[]) {
  const merchants = new Map<
    string,
    { name: string; count: number; totals: Map<string, number> }
  >();

  for (const item of items) {
    const name = item.merchant?.trim();
    if (!name) continue;

    const key = normalize(name);
    const existing = merchants.get(key) || {
      name,
      count: 0,
      totals: new Map<string, number>()
    };

    existing.count += 1;

    if (item.amount !== undefined) {
      const currency = item.currency || 'EUR';
      existing.totals.set(currency, (existing.totals.get(currency) || 0) + item.amount);
    }

    merchants.set(key, existing);
  }

  const top = Array.from(merchants.values()).sort((a, b) => b.count - a.count)[0];
  if (!top) return undefined;

  const strongestTotal = Array.from(top.totals.entries()).sort((a, b) => b[1] - a[1])[0];

  return {
    name: top.name,
    count: top.count,
    total: strongestTotal?.[1],
    currency: strongestTotal?.[0]
  };
}

function isInMonth(iso: string | undefined, year: number, month: number) {
  if (!iso) return false;
  const date = new Date(iso + 'T12:00:00');
  return date.getFullYear() === year && date.getMonth() === month;
}

function sortNewestFirst(a: OneItem, b: OneItem) {
  const aDate = a.date ? new Date(a.date + 'T12:00:00').getTime() : new Date(a.createdAt).getTime();
  const bDate = b.date ? new Date(b.date + 'T12:00:00').getTime() : new Date(b.createdAt).getTime();
  return bDate - aDate;
}

function monthKey(item: OneItem) {
  const date = item.date ? new Date(item.date + 'T12:00:00') : new Date(item.createdAt);
  return String(date.getFullYear()) + '-' + String(date.getMonth() + 1).padStart(2, '0');
}

function monthLabel(item: OneItem) {
  const date = item.date ? new Date(item.date + 'T12:00:00') : new Date(item.createdAt);
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date);
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}
