import { searchOneItems } from './searchItems';
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
  bestMatch?: OneItem,
  now = new Date()
): GroundedRecallAnswer | undefined {
  const clean = normalize(query);
  if (!clean.trim()) return undefined;
  const german = looksGerman(clean);

  const reminderAnswer = buildReminderAnswer(clean, items, german, now);
  if (reminderAnswer) return reminderAnswer;

  const specificDocumentAnswer = buildSpecificDocumentAnswer(clean, bestMatch, german);
  if (specificDocumentAnswer) return specificDocumentAnswer;

  if (/\b(where|wo)\b/.test(clean) && bestMatch) {
    const ambiguity = multiplePlausibleMatches(query, items, bestMatch);
    if (ambiguity.length > 1) return multipleMatchAnswer(ambiguity, german);

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
    const ambiguity = multiplePlausibleMatches(query, items, bestMatch);
    if (ambiguity.length > 1) return multipleMatchAnswer(ambiguity, german);

    if (bestMatch.date) {
      return {
        title: [formatDate(bestMatch.date, german), bestMatch.time].filter(Boolean).join(' · '),
        body: [bestMatch.title, bestMatch.location].filter(Boolean).join(' · '),
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
        item.summary,
        item.userContext,
        item.notes,
        item.people?.join(' '),
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
        title: ideas.length === 1
          ? ideas[0].title
          : german
            ? `${ideas.length} gespeicherte Ideen`
            : `${ideas.length} saved ideas`,
        body: ideas.length === 1
          ? ideas[0].summary || ideas[0].userContext || (german ? 'Gespeichert in ONE.' : 'Saved in ONE.')
          : ideas.slice(0, 5).map((item) => item.title).join('\n'),
        meta: german ? 'Nur aus deinen gespeicherten Erinnerungen' : 'Only from your saved memories',
        itemIds: ideas.map((item) => item.id)
      };
    }
  }

  if (/receipt|beleg|bon|invoice|rechnung/.test(clean) && bestMatch) {
    if (bestMatch.type === 'document' || bestMatch.documentKind || bestMatch.kind === 'receipt') {
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
        bestMatch.summary,
        bestMatch.userContext,
        bestMatch.date,
        bestMatch.location,
        bestMatch.merchant,
        bestMatch.amount !== undefined ? formatMoney(bestMatch.amount, bestMatch.currency) : undefined
      ].filter(Boolean).filter(uniqueText).join(' · ') || (german ? 'Keine weiteren Details gespeichert.' : 'No additional details are saved.'),
      meta: german ? 'Bester gespeicherter Treffer in ONE' : 'Best saved match in ONE',
      itemIds: [bestMatch.id]
    };
  }

  return undefined;
}

function buildReminderAnswer(clean: string, items: OneItem[], german: boolean, now: Date) {
  if (!/remind|reminder|erinner|erinnerung/.test(clean)) return undefined;

  const targetDate = relativeDateFromQuery(clean, now);
  let reminders = items.filter((item) =>
    !item.completed &&
    (item.kind === 'reminder' || item.type === 'reminder' || item.type === 'task')
  );
  if (targetDate) reminders = reminders.filter((item) => item.date === targetDate);

  if (!reminders.length) return undefined;
  reminders.sort((a, b) => `${a.date || ''}T${a.time || '23:59'}`.localeCompare(`${b.date || ''}T${b.time || '23:59'}`));

  return {
    title: reminders.length === 1
      ? reminders[0].title
      : german ? `${reminders.length} Erinnerungen` : `${reminders.length} reminders`,
    body: reminders.slice(0, 5).map((item) =>
      [item.title, item.date, item.time].filter(Boolean).join(' · ')
    ).join('\n'),
    meta: german ? 'Aus deinen gespeicherten ONE-Erinnerungen' : 'From your saved ONE reminders',
    itemIds: reminders.map((item) => item.id)
  } satisfies GroundedRecallAnswer;
}

function buildSpecificDocumentAnswer(clean: string, bestMatch: OneItem | undefined, german: boolean) {
  if (!bestMatch) return undefined;
  const looksLikeDocument = bestMatch.type === 'document' || Boolean(bestMatch.documentKind) || bestMatch.kind === 'receipt';
  if (!looksLikeDocument) return undefined;
  if (!/(how much|wieviel|wie viel|amount|betrag|cost|gekostet|paid|bezahlt)/.test(clean)) return undefined;

  if (bestMatch.amount === undefined) {
    return {
      title: german ? 'Kein Betrag gespeichert' : 'No amount saved',
      body: german
        ? `ONE hat für „${bestMatch.merchant || bestMatch.title}“ keinen bestätigten Betrag gespeichert.`
        : `ONE does not have a confirmed amount saved for “${bestMatch.merchant || bestMatch.title}”.`,
      itemIds: [bestMatch.id]
    } satisfies GroundedRecallAnswer;
  }

  return {
    title: formatMoney(bestMatch.amount, bestMatch.currency),
    body: bestMatch.merchant || bestMatch.title,
    meta: german ? 'Aus dem gespeicherten Beleg' : 'From the saved receipt',
    itemIds: [bestMatch.id]
  } satisfies GroundedRecallAnswer;
}

function multiplePlausibleMatches(query: string, items: OneItem[], bestMatch: OneItem) {
  const matches = searchOneItems(query, items);
  if (matches.length < 2) return [bestMatch];
  const top = matches[0]?.score || 0;
  if (!top) return [bestMatch];
  const plausible = matches
    .filter((match) => match.score >= top * 0.85)
    .map((match) => match.item)
    .filter((item) => item.id === bestMatch.id || item.kind === bestMatch.kind || item.type === bestMatch.type)
    .slice(0, 4);
  return plausible.some((item) => item.id === bestMatch.id) ? plausible : [bestMatch];
}

function multipleMatchAnswer(items: OneItem[], german: boolean): GroundedRecallAnswer {
  return {
    title: german ? 'Mehrere mögliche Treffer' : 'Multiple possible matches',
    body: items.map((item) => [item.title, item.date, item.time].filter(Boolean).join(' · ')).join('\n'),
    meta: german ? 'Wähle den passenden Eintrag.' : 'Choose the matching item.',
    itemIds: items.map((item) => item.id)
  };
}

function mentionsGiftIdeas(value: string) {
  return /gift|geschenk|birthday|geburtstag/.test(value) && /idea|idee|ideas|ideen|save|saved|gespeichert/.test(value);
}

function relativeDateFromQuery(value: string, now: Date) {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (/\b(tomorrow|morgen)\b/.test(value)) date.setDate(date.getDate() + 1);
  else if (/\b(today|heute)\b/.test(value)) {
    // already today
  } else return undefined;
  return toIsoDate(date);
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
  return /\b(wo|wann|geschenk|geburtstag|idee|ideen|gespeichert|beleg|rechnung|hatte|habe|erinnerung|morgen|betrag|wieviel)\b/.test(value);
}

function uniqueText(value: string, index: number, values: string[]) {
  return values.indexOf(value) === index;
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}
