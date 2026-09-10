import type { OneItem } from '../types/item';

export type GroundedRecallAnswer = {
  title: string;
  body: string;
  meta?: string;
  itemIds: string[];
};

export function buildGroundedRecallAnswer(
  query: string,
  items: OneItem[],
  bestMatch?: OneItem
): GroundedRecallAnswer | undefined {
  const clean = normalize(query);
  if (!clean.trim()) return undefined;
  const german = looksGerman(clean);

  if (/\b(where|wo)\b/.test(clean) && bestMatch) {
    if (bestMatch.location) {
      return {
        title: bestMatch.location,
        body: bestMatch.title,
        meta: german ? 'Aus deinen gespeicherten ONE-Daten' : 'From your saved ONE data',
        itemIds: [bestMatch.id]
      };
    }

    return {
      title: german ? 'Kein Ort gespeichert' : 'No location saved',
      body: german
        ? `ONE hat für „${bestMatch.title}“ keinen Ort gespeichert.`
        : `ONE does not have a location saved for “${bestMatch.title}”.`,
      itemIds: [bestMatch.id]
    };
  }

  if (/\b(when|wann)\b/.test(clean) && bestMatch) {
    if (bestMatch.date) {
      return {
        title: formatDate(bestMatch.date, german),
        body: [bestMatch.title, bestMatch.time, bestMatch.location].filter(Boolean).join(' · '),
        meta: german ? 'Aus deinen gespeicherten ONE-Daten' : 'From your saved ONE data',
        itemIds: [bestMatch.id]
      };
    }

    return {
      title: german ? 'Kein Datum gespeichert' : 'No date saved',
      body: german
        ? `ONE hat für „${bestMatch.title}“ kein Datum gespeichert.`
        : `ONE does not have a date saved for “${bestMatch.title}”.`,
      itemIds: [bestMatch.id]
    };
  }

  if (mentionsGiftIdeas(clean)) {
    const wantsDad = /dad|father|papa|vater/.test(clean);
    const wantsMom = /mom|mother|mama|mutter/.test(clean);
    const ideas = items.filter((item) => {
      const haystack = normalize([
        item.title,
        item.userContext,
        item.notes,
        item.tags.join(' '),
        item.extractedText
      ].filter(Boolean).join(' '));
      const isGift = item.type === 'idea' || /gift|geschenk|birthday|geburtstag/.test(haystack);
      if (!isGift) return false;
      if (wantsDad && !/dad|father|papa|vater/.test(haystack)) return false;
      if (wantsMom && !/mom|mother|mama|mutter/.test(haystack)) return false;
      return true;
    });

    if (ideas.length) {
      return {
        title: german
          ? `${ideas.length} gespeicherte ${ideas.length === 1 ? 'Idee' : 'Ideen'}`
          : `${ideas.length} saved ${ideas.length === 1 ? 'idea' : 'ideas'}`,
        body: ideas.slice(0, 5).map((item) => item.title).join('\n'),
        meta: german ? 'Nur aus deinen gespeicherten Erinnerungen' : 'Only from your saved memories',
        itemIds: ideas.map((item) => item.id)
      };
    }
  }

  if (/receipt|beleg|bon|invoice|rechnung/.test(clean) && bestMatch) {
    if (bestMatch.type === 'document' || bestMatch.documentKind) {
      return {
        title: bestMatch.merchant || bestMatch.title,
        body: [
          bestMatch.documentKind ? formatKind(bestMatch.documentKind) : undefined,
          bestMatch.amount !== undefined ? formatMoney(bestMatch.amount, bestMatch.currency) : undefined,
          bestMatch.date
        ].filter(Boolean).join(' · '),
        meta: german ? 'Gespeichertes Dokument in ONE' : 'Saved document in ONE',
        itemIds: [bestMatch.id]
      };
    }
  }

  if (/what did i save|what have i saved|was hatte ich|was habe ich|zeig.*gespeichert|show.*saved/.test(clean) && bestMatch) {
    return {
      title: bestMatch.title,
      body: [
        bestMatch.userContext,
        bestMatch.date,
        bestMatch.location,
        bestMatch.merchant,
        bestMatch.amount !== undefined ? formatMoney(bestMatch.amount, bestMatch.currency) : undefined
      ].filter(Boolean).join(' · ') || (german ? 'Keine weiteren Details gespeichert.' : 'No additional details are saved.'),
      meta: german ? 'Bester gespeicherter Treffer in ONE' : 'Best saved match in ONE',
      itemIds: [bestMatch.id]
    };
  }

  return undefined;
}

function mentionsGiftIdeas(value: string) {
  return /gift|geschenk|birthday|geburtstag/.test(value) && /idea|idee|ideas|ideen|save|saved|gespeichert/.test(value);
}

function formatDate(iso: string, german: boolean) {
  const date = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat(german ? 'de-DE' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function formatMoney(amount: number, currency = 'EUR') {
  try {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatKind(value: string) {
  return value.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function looksGerman(value: string) {
  return /\b(wo|wann|geschenk|geburtstag|idee|ideen|gespeichert|beleg|rechnung|hatte|habe)\b/.test(value);
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}
