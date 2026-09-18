import type { OneItem } from '../types/item';

const stopWords = new Set([
  'ich','mir','mich','mein','meine','meinen','nochmal','noch','hatte','habe','was','welche','welcher',
  'wann','war','wo','der','die','das','den','dem','ein','eine','einen','und','oder','für','fuer','von',
  'ist','sind','sein','es','bitte','gib','gebe','zeig','zeige','find','finde','finden','such','suche',
  'the','a','an','my','me','i','what','which','when','where','was','were','did','do','for','of','and',
  'is','are','be','please','give','show','find','search'
]);

const synonymGroups = [
  ['papa','vater','dad','father'],
  ['mama','mutter','mom','mother'],
  ['geschenk','gift','birthday','geburtstag'],
  ['termin','appointment','arzt','doctor','dentist','zahnarzt'],
  ['erinnerung','reminder','remind'],
  ['reise','travel','trip','urlaub','vacation'],
  ['flug','flight'],
  ['rechnung','invoice','receipt','beleg'],
  ['restaurant','essen','food','dinner'],
  ['hotel','airbnb','unterkunft','accommodation'],
  ['studium','uni','university','study']
];

export type SearchResult = {
  item: OneItem;
  score: number;
  matchedTerms: string[];
  reasons: string[];
};

export function searchOneItems(
  query: string,
  items: OneItem[],
  options: { limit?: number; now?: Date } = {}
): SearchResult[] {
  const phrase = normalizeSearchText(query);
  const coreTerms = tokenize(query);
  const terms = expandTerms(coreTerms);
  if (!terms.length && !phrase) return [];

  const ranked = items
    .map((item) => scoreItem(item, terms, phrase, options.now ?? new Date()))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.item.updatedAt).getTime() - new Date(a.item.updatedAt).getTime());

  if (!ranked.length) return [];

  // For multi-term natural-language queries, require more than a single accidental
  // overlap. Example: "link aletax stempel" must not surface an unrelated gift
  // merely because that memory also happens to contain a URL.
  const relevant = coreTerms.length >= 2
    ? ranked.filter((result) => {
        const directMatches = countDirectTermMatches(result.item, coreTerms);
        const strongStructuredMatch = result.reasons.some((reason) =>
          ['exact-title', 'title-phrase', 'exact-context'].includes(reason)
        );
        return directMatches >= Math.min(2, coreTerms.length) || strongStructuredMatch;
      })
    : ranked;

  if (!relevant.length) return ranked.slice(0, options.limit ?? 12);

  // Natural-language quick search should not surface weak accidents far below a
  // clearly relevant result. Keep all reasonably competitive relevant matches.
  const topScore = relevant[0].score;
  const filtered = relevant.filter((result) => result.score >= Math.max(4, topScore * 0.22));

  return filtered.slice(0, options.limit ?? 12);
}

function scoreItem(item: OneItem, terms: string[], phrase: string, now: Date): SearchResult {
  const fields = {
    title: normalizeSearchText(item.title),
    summary: normalizeSearchText(item.summary),
    people: normalizeSearchText(item.people?.join(' ')),
    context: normalizeSearchText(item.userContext),
    raw: normalizeSearchText([item.rawInput, item.originalText, item.extractedText, item.notes].filter(Boolean).join(' ')),
    category: normalizeSearchText(item.category),
    tags: normalizeSearchText(item.tags.join(' ')),
    entities: normalizeSearchText(item.entities.join(' ')),
    type: normalizeSearchText(`${item.type} ${item.kind || ''} ${item.documentKind || ''}`),
    merchant: normalizeSearchText(item.merchant),
    url: normalizeSearchText([item.url, ...(item.extractedUrls || [])].filter(Boolean).join(' ')),
    date: normalizeSearchText([
      item.date,
      item.time,
      item.capturedAt,
      ...(item.extractedDates || []),
      ...(item.extractedTimes || [])
    ].filter(Boolean).join(' ')),
    money: normalizeSearchText(item.amount !== undefined ? `${item.amount} ${item.currency || ''}` : '')
  };

  let score = 0;
  const matched = new Set<string>();
  const reasons = new Set<string>();

  if (phrase) {
    if (fields.title === phrase) {
      score += 30;
      reasons.add('exact-title');
    } else if (fields.title.includes(phrase)) {
      score += 13;
      reasons.add('title-phrase');
    }
    if (fields.context === phrase || fields.tags.split(' ').includes(phrase)) {
      score += 12;
      reasons.add('exact-context');
    }
    if (fields.url.includes(phrase)) {
      score += 9;
      reasons.add('url');
    }
  }

  const weightedFields: [keyof typeof fields, number][] = [
    ['title', 8],
    ['context', 9],
    ['people', 8],
    ['merchant', 8],
    ['summary', 6],
    ['entities', 6],
    ['tags', 6],
    ['url', 6],
    ['raw', 5],
    ['category', 5],
    ['type', 4],
    ['date', 4],
    ['money', 4]
  ];

  for (const term of terms) {
    for (const [field, weight] of weightedFields) {
      if (!fields[field].includes(term)) continue;
      score += weight;
      matched.add(term);
      reasons.add(field);
    }
  }

  const updated = new Date(item.updatedAt).getTime();
  const ageDays = Math.max(0, (now.getTime() - updated) / 86_400_000);
  if (score > 0 && ageDays <= 7) score += 1.5;
  else if (score > 0 && ageDays <= 30) score += 0.5;

  if (item.syncState === 'pending') score += 0.1;
  if (item.completed) score -= 0.2;

  return {
    item,
    score,
    matchedTerms: Array.from(matched),
    reasons: Array.from(reasons)
  };
}

function countDirectTermMatches(item: OneItem, terms: string[]) {
  const haystack = normalizeSearchText([
    item.title,
    item.summary,
    item.userContext,
    item.rawInput,
    item.originalText,
    item.extractedText,
    item.notes,
    item.category,
    item.people?.join(' '),
    item.tags.join(' '),
    item.entities.join(' '),
    item.merchant,
    item.url,
    ...(item.extractedUrls || [])
  ].filter(Boolean).join(' '));

  return terms.filter((term) => termVariants(term).some((variant) => haystack.includes(variant))).length;
}

function tokenize(value: string) {
  return normalizeSearchText(value)
    .split(/[^a-z0-9äöüß]+/)
    .filter((term) => term.length >= 2 && !stopWords.has(term));
}

function expandTerms(terms: string[]) {
  const expanded = new Set<string>();
  for (const term of terms) {
    termVariants(term).forEach((variant) => expanded.add(variant));
    const group = synonymGroups.find((candidate) => candidate.some((candidateTerm) => termVariants(candidateTerm).includes(term) || termVariants(term).includes(candidateTerm)));
    group?.forEach((synonym) => termVariants(synonym).forEach((variant) => expanded.add(variant)));
  }
  return Array.from(expanded);
}

function termVariants(value: string) {
  const normalized = normalizeSearchText(value);
  const variants = new Set([normalized]);
  const suffixes = ['ern', 'en', 'er', 'es', 'e', 's'];
  for (const suffix of suffixes) {
    if (normalized.length > suffix.length + 3 && normalized.endsWith(suffix)) {
      variants.add(normalized.slice(0, -suffix.length));
    }
  }
  return Array.from(variants).filter(Boolean);
}

export function normalizeSearchText(value?: string | null) {
  return (value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^https?:\/\/(?:www\.)?/g, '')
    .replace(/[?#&=/:._-]+/g, ' ')
    .replace(/[^a-z0-9äöüß\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
