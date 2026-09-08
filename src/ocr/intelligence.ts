import { parseQuickCapture } from '@/src/parser/quickCapture';

export type OcrIntelligence = {
  suggestedTitle?: string;
  category?: string;
  date?: string;
  time?: string;
  entities: string[];
  tags: string[];
};

export function analyzeOcrText(text: string, context = ''): OcrIntelligence {
  const clean = text.trim();
  if (!clean) {
    return {
      suggestedTitle: context.trim() || undefined,
      entities: [],
      tags: []
    };
  }

  const combined = [context.trim(), clean].filter(Boolean).join(' ');
  const parsed = parseQuickCapture(combined);

  const entities = unique([
    ...extractUrls(clean).map((value) => `url:${value}`),
    ...extractEmails(clean).map((value) => `email:${value}`),
    ...extractPhones(clean).map((value) => `phone:${value}`),
    ...extractPrices(clean).map((value) => `price:${value}`)
  ]);

  const tags = unique([
    ...(parsed?.category ? [parsed.category.toLowerCase()] : []),
    ...inferTags(clean)
  ]);

  return {
    suggestedTitle: context.trim() || firstMeaningfulLine(clean),
    category: parsed?.category,
    date: parsed?.date,
    time: parsed?.time,
    entities,
    tags
  };
}

function firstMeaningfulLine(text: string) {
  const line = text
    .split('\n')
    .map((value) => value.trim())
    .find((value) => value.length >= 3);

  if (!line) return undefined;
  return line.length > 90 ? `${line.slice(0, 87)}…` : line;
}

function extractUrls(text: string) {
  return text.match(/https?:\/\/[^\s]+|www\.[^\s]+/gi) ?? [];
}

function extractEmails(text: string) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
}

function extractPhones(text: string) {
  const matches = text.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{2,4}/g) ?? [];
  return matches
    .map((value) => value.trim())
    .filter((value) => value.replace(/\D/g, '').length >= 7);
}

function extractPrices(text: string) {
  const matches = text.match(/(?:€|EUR|\$|USD|£|GBP)\s?\d[\d.,]*|\d[\d.,]*\s?(?:€|EUR|\$|USD|£|GBP)/gi) ?? [];
  return matches.map((value) => value.trim());
}

function inferTags(text: string) {
  const lower = text.toLowerCase();
  const tags: string[] = [];

  if (/invoice|rechnung|receipt|beleg/.test(lower)) tags.push('document', 'finance');
  if (/flight|flug|boarding|gate|hotel|airbnb/.test(lower)) tags.push('travel');
  if (/gift|geschenk|birthday|geburtstag/.test(lower)) tags.push('gift');
  if (/restaurant|menu|reservation|tisch|booking/.test(lower)) tags.push('food');
  if (/appointment|termin|doctor|arzt|dentist|zahnarzt/.test(lower)) tags.push('appointment');
  if (/order|bestellung|tracking|delivery|lieferung/.test(lower)) tags.push('shopping');

  return tags;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
