import type { OneItem } from '@/src/types/item';

export type FollowUpAnswer = {
  title: string;
  body: string;
  meta?: string;
  itemIds: string[];
};

export function buildFollowUpAnswer(
  query: string,
  items: OneItem[],
  previousItemIds: string[]
): FollowUpAnswer | undefined {
  if (!previousItemIds.length) return undefined;

  const normalized = normalize(query);
  const contextualItems = previousItemIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is OneItem => Boolean(item));

  if (!contextualItems.length) return undefined;

  const german = looksGerman(normalized);

  if (asksForLargest(normalized)) {
    const largest = contextualItems
      .filter((item) => item.amount !== undefined)
      .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))[0];

    if (!largest || largest.amount === undefined) return undefined;

    return {
      title: formatMoney(largest.amount, largest.currency || 'EUR', german),
      body: largest.merchant || largest.title,
      meta: german ? 'Größter Betrag aus der vorherigen Antwort' : 'Largest amount from the previous answer',
      itemIds: [largest.id]
    };
  }

  if (asksForTotal(normalized)) {
    const totals = new Map<string, number>();

    for (const item of contextualItems) {
      if (item.amount === undefined) continue;
      const currency = item.currency || 'EUR';
      totals.set(currency, (totals.get(currency) || 0) + item.amount);
    }

    if (!totals.size) return undefined;

    const title = Array.from(totals.entries())
      .map(([currency, amount]) => formatMoney(amount, currency, german))
      .join(' + ');

    return {
      title,
      body: german
        ? 'Summe aus ' + String(contextualItems.length) + ' Einträgen'
        : 'Total across ' + String(contextualItems.length) + ' items',
      meta: german ? 'Basierend auf der vorherigen Antwort' : 'Based on the previous answer',
      itemIds: contextualItems.map((item) => item.id)
    };
  }

  if (asksToShow(normalized)) {
    const matching = filterContextualItems(normalized, contextualItems);

    return {
      title: german
        ? String(matching.length) + (matching.length === 1 ? ' Eintrag' : ' Einträge')
        : String(matching.length) + (matching.length === 1 ? ' memory' : ' memories'),
      body: matching
        .slice(0, 4)
        .map((item) => summarizeItem(item, german))
        .join('\n'),
      meta: german ? 'Aus der vorherigen Antwort' : 'From the previous answer',
      itemIds: matching.map((item) => item.id)
    };
  }

  return undefined;
}

function filterContextualItems(query: string, items: OneItem[]) {
  if (/invoice|rechnung/.test(query)) {
    return items.filter((item) => item.documentKind === 'invoice');
  }

  if (/receipt|beleg|bon/.test(query)) {
    return items.filter((item) => item.documentKind === 'receipt');
  }

  if (/ticket/.test(query)) {
    return items.filter((item) => item.documentKind === 'ticket');
  }

  return items;
}

function asksForLargest(value: string) {
  return /largest|biggest|highest|most expensive|teuerste|teuerster|großte|groesste|größte|hochste|höchste/.test(value);
}

function asksForTotal(value: string) {
  return /in total|total|sum|together|altogether|gesamt|insgesamt|zusammen|summe/.test(value);
}

function asksToShow(value: string) {
  return /show|list|open|which ones|what were|zeig|zeige|auflisten|welche|welcher|welches/.test(value);
}

function summarizeItem(item: OneItem, german: boolean) {
  const amount = item.amount !== undefined
    ? formatMoney(item.amount, item.currency || 'EUR', german)
    : undefined;

  return [item.merchant || item.title, amount, item.date]
    .filter(Boolean)
    .join(' · ');
}

function formatMoney(amount: number, currency: string, german: boolean) {
  try {
    return new Intl.NumberFormat(german ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency
    }).format(amount);
  } catch {
    return amount.toFixed(2) + ' ' + currency;
  }
}

function looksGerman(value: string) {
  return /\b(zeig|zeige|welche|gesamt|insgesamt|zusammen|summe|teuerste|größte|großte|rechnung|beleg)\b/.test(value);
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}
