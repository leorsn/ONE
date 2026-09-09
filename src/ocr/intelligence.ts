import { parseQuickCapture } from '@/src/parser/quickCapture';
import type { OneDocumentKind } from '@/src/types/item';

export type OcrIntelligence = {
  suggestedTitle?: string;
  category?: string;
  date?: string;
  time?: string;
  documentKind?: OneDocumentKind;
  merchant?: string;
  amount?: number;
  currency?: string;
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
  const documentKind = inferDocumentKind(clean);
  const money = extractPrimaryAmount(clean);
  const merchant = ['receipt', 'invoice'].includes(documentKind || '')
    ? inferMerchant(clean)
    : undefined;

  const entities = unique([
    ...extractUrls(clean).map((value) => `url:${value}`),
    ...extractEmails(clean).map((value) => `email:${value}`),
    ...extractPhones(clean).map((value) => `phone:${value}`),
    ...extractPrices(clean).map((value) => `price:${value}`),
    ...(merchant ? [`merchant:${merchant}`] : []),
    ...(money ? [`amount:${money.amount} ${money.currency}`] : [])
  ]);

  const tags = unique([
    ...(parsed?.category ? [parsed.category.toLowerCase()] : []),
    ...inferTags(clean),
    ...(documentKind ? [documentKind] : [])
  ]);

  return {
    suggestedTitle: context.trim() || merchant || firstMeaningfulLine(clean),
    category: documentKind === 'receipt' || documentKind === 'invoice'
      ? 'Receipts'
      : parsed?.category,
    date: parsed?.date,
    time: parsed?.time,
    documentKind,
    merchant,
    amount: money?.amount,
    currency: money?.currency,
    entities,
    tags
  };
}

function inferDocumentKind(text: string): OneDocumentKind | undefined {
  const lower = text.toLowerCase();
  if (/invoice|rechnung|rechnungsnr|invoice no|invoice number/.test(lower)) return 'invoice';
  if (/receipt|beleg|kassenbon|bon\b|gesamt|summe|total/.test(lower)) return 'receipt';
  if (/boarding pass|boardkarte|ticket|fahrkarte/.test(lower)) return 'ticket';
  if (/reservation|reservierung|booking confirmation|buchungsbestätigung/.test(lower)) return 'reservation';
  if (/contract|vertrag|vereinbarung/.test(lower)) return 'contract';
  if (/dear |sehr geehrt|anschreiben|brief/.test(lower)) return 'letter';
  if (extractEmails(text).length && extractPhones(text).length) return 'business_card';
  return undefined;
}

function inferMerchant(text: string) {
  const rejected = /^(receipt|beleg|rechnung|invoice|datum|date|total|summe|gesamt|tax|mwst|ust|tel|phone|www\.|http)/i;
  const line = text
    .split('\n')
    .map((value) => value.trim().replace(/\s{2,}/g, ' '))
    .find((value) =>
      value.length >= 2 &&
      value.length <= 70 &&
      !rejected.test(value) &&
      !/^\d/.test(value) &&
      !/[€$£]\s?\d|\d[.,]\d{2}\s?(?:€|eur|usd|gbp)/i.test(value)
    );

  return line || undefined;
}

function extractPrimaryAmount(text: string) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const preferred = lines.filter((line) => /total|gesamt|summe|betrag|amount due|zu zahlen/i.test(line));

  for (const line of [...preferred, ...lines.slice().reverse()]) {
    const parsed = parseMoneyFromLine(line);
    if (parsed) return parsed;
  }

  const candidates = extractPrices(text)
    .map(parseMoneyValue)
    .filter((value): value is { amount: number; currency: string } => Boolean(value))
    .sort((a, b) => b.amount - a.amount);

  return candidates[0];
}

function parseMoneyFromLine(line: string) {
  const match = line.match(/(?:€|EUR|\$|USD|£|GBP)\s?\d[\d.,]*|\d[\d.,]*\s?(?:€|EUR|\$|USD|£|GBP)/i);
  return match ? parseMoneyValue(match[0]) : undefined;
}

function parseMoneyValue(value: string) {
  const currency = currencyFor(value);
  const numeric = value.replace(/[^0-9.,-]/g, '');
  if (!numeric) return undefined;

  const lastComma = numeric.lastIndexOf(',');
  const lastDot = numeric.lastIndexOf('.');
  let normalized = numeric;

  if (lastComma > lastDot) {
    normalized = numeric.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    normalized = numeric.replace(/,/g, '');
  } else {
    normalized = numeric.replace(',', '.');
  }

  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return undefined;
  return { amount, currency };
}

function currencyFor(value: string) {
  const lower = value.toLowerCase();
  if (value.includes('€') || lower.includes('eur')) return 'EUR';
  if (value.includes('£') || lower.includes('gbp')) return 'GBP';
  if (value.includes('$') || lower.includes('usd')) return 'USD';
  return 'EUR';
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

  if (/invoice|rechnung|receipt|beleg|kassenbon/.test(lower)) tags.push('document', 'finance');
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
