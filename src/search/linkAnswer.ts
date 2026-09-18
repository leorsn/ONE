import type { OneItem } from '../types/item';

export type SpecificLinkAnswer = {
  title: string;
  body: string;
  meta: string;
  itemIds: string[];
};

const intentWords = new Set([
  'was','ist','sind','der','die','das','den','dem','ein','eine','einen','einer','fur','fuer','von','zu','zum','zur',
  'ich','mir','mich','bitte','gib','gebe','zeig','zeige','find','finde','finden','such','suche',
  'what','is','are','the','a','an','for','of','to','me','my','please','give','show','find',
  'link','links','url','urls','website','webseite','adresse'
]);

export function buildSpecificLinkAnswer(query: string, items: OneItem[]): SpecificLinkAnswer | undefined {
  const normalizedQuery = normalize(query);
  if (!/(?:\blink\b|\blinks\b|\burl\b|\burls\b|webseite|website)/.test(normalizedQuery)) return undefined;

  const terms = coreTerms(query);
  const candidates = items
    .map((item) => ({ item, urls: itemUrls(item), score: itemScore(item, terms) }))
    .filter((candidate) => candidate.urls.length > 0 && candidate.score > 0)
    .sort((a, b) => b.score - a.score || timestamp(b.item) - timestamp(a.item));

  const best = candidates[0];
  if (!best) return undefined;

  const selected = selectUrlsByContext(best.item, best.urls, terms);
  const urls = selected.length ? selected : best.urls.length === 1 ? best.urls : [];
  if (!urls.length) return undefined;

  return {
    title: linkTitle(query, terms, best.item),
    body: urls.join('\n'),
    meta: 'Exakt aus deiner gespeicherten NEVER-Erinnerung',
    itemIds: [best.item.id]
  };
}

function itemUrls(item: OneItem) {
  return Array.from(new Set([
    item.url,
    ...(item.extractedUrls || []),
    ...item.entities.filter((entity) => /^url:/i.test(entity)).map((entity) => entity.replace(/^url:/i, '')),
    ...extractUrls([item.extractedText, item.originalText, item.rawInput].filter(Boolean).join('\n'))
  ].filter((value): value is string => Boolean(value))));
}

function itemScore(item: OneItem, terms: string[]) {
  if (!terms.length) return 1;
  const title = normalize(item.title);
  const context = normalize([item.summary, item.userContext, item.category, item.tags.join(' '), item.entities.join(' ')].filter(Boolean).join(' '));
  const evidence = normalize([item.extractedText, item.originalText, item.rawInput, item.notes].filter(Boolean).join(' '));

  let score = 0;
  for (const term of terms) {
    if (title.includes(term)) score += 8;
    if (context.includes(term)) score += 5;
    if (evidence.includes(term)) score += 3;
  }
  return score;
}

function selectUrlsByContext(item: OneItem, urls: string[], terms: string[]) {
  if (!terms.length || urls.length <= 1) return urls;
  const source = [item.extractedText, item.originalText, item.rawInput, item.summary].filter(Boolean).join('\n');
  if (!source) return [];

  const lineMatches = source
    .split(/\n+/)
    .map((line) => ({ line, score: termScore(normalize(line), terms), urls: extractUrls(line) }))
    .filter((entry) => entry.urls.length && entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (lineMatches.length) {
    const top = lineMatches[0].score;
    return unique(lineMatches.filter((entry) => entry.score === top).flatMap((entry) => entry.urls));
  }

  const normalizedSource = normalize(source);
  const termPositions = terms.flatMap((term) => allIndexes(normalizedSource, term));
  if (!termPositions.length) return [];

  const scored = urls.map((url) => {
    const token = normalizeUrlForSearch(url);
    const urlPosition = token ? normalizedSource.indexOf(token) : -1;
    if (urlPosition < 0) return { url, distance: Number.POSITIVE_INFINITY };
    const distance = Math.min(...termPositions.map((position) => Math.abs(position - urlPosition)));
    return { url, distance };
  }).sort((a, b) => a.distance - b.distance);

  if (!Number.isFinite(scored[0]?.distance) || scored[0].distance > 350) return [];
  const bestDistance = scored[0].distance;
  return scored.filter((entry) => entry.distance <= bestDistance + 60).map((entry) => entry.url);
}

function coreTerms(query: string) {
  return normalize(query)
    .split(/\s+/)
    .filter((term) => term.length >= 2 && !intentWords.has(term));
}

function termScore(value: string, terms: string[]) {
  return terms.reduce((score, term) => score + (value.includes(term) ? 1 : 0), 0);
}

function linkTitle(query: string, terms: string[], item: OneItem) {
  if (terms.length) {
    const label = terms.slice(0, 3).map((term) => term.charAt(0).toUpperCase() + term.slice(1)).join(' ');
    return `${label} · Link`;
  }
  return item.title;
}

function extractUrls(value: string) {
  return unique((value.match(/https?:\/\/[^\s<>"')\]}]+/gi) || []).map((url) => url.replace(/[.,;:!?]+$/g, '')));
}

function normalizeUrlForSearch(url: string) {
  try {
    const parsed = new URL(url);
    return normalize(`${parsed.hostname}${parsed.pathname}`);
  } catch {
    return normalize(url);
  }
}

function allIndexes(value: string, term: string) {
  const indexes: number[] = [];
  let start = 0;
  while (start < value.length) {
    const index = value.indexOf(term, start);
    if (index < 0) break;
    indexes.push(index);
    start = index + Math.max(1, term.length);
  }
  return indexes;
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function timestamp(item: OneItem) {
  return new Date(item.updatedAt || item.capturedAt || item.createdAt).getTime();
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9äöüß\s:/._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
