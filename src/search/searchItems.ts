import type { OneItem } from '@/src/types/item';

const stopWords = new Set([
  'ich','mir','mich','mein','meine','meinen','nochmal','noch','hatte','habe','was','welche','welcher',
  'wann','war','wo','der','die','das','den','dem','ein','eine','einen','und','oder','für','fuer','von',
  'the','a','an','my','me','i','what','which','when','where','was','were','did','do','for','of','and'
]);

const synonymGroups = [
  ['papa','vater','dad','father'],
  ['mama','mutter','mom','mother'],
  ['geschenk','gift','birthday','geburtstag'],
  ['termin','appointment','arzt','doctor','dentist','zahnarzt'],
  ['reise','travel','trip','urlaub','vacation'],
  ['flug','flight'],
  ['rechnung','invoice','receipt','beleg'],
  ['restaurant','essen','food','dinner'],
  ['hotel','airbnb','unterkunft','accommodation']
];

export type SearchResult = {
  item: OneItem;
  score: number;
  matchedTerms: string[];
};

export function searchOneItems(query: string, items: OneItem[]): SearchResult[] {
  const terms = expandTerms(tokenize(query));
  if (!terms.length) return [];

  return items
    .map((item) => scoreItem(item, terms))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.item.updatedAt).getTime() - new Date(a.item.updatedAt).getTime())
    .slice(0, 12);
}

function scoreItem(item: OneItem, terms: string[]): SearchResult {
  const fields = {
    title: normalize(item.title),
    context: normalize(item.userContext),
    original: normalize(item.originalText),
    extracted: normalize(item.extractedText),
    notes: normalize(item.notes),
    category: normalize(item.category),
    tags: normalize(item.tags.join(' ')),
    entities: normalize(item.entities.join(' ')),
    type: normalize(item.type)
  };

  let score = 0;
  const matched = new Set<string>();

  for (const term of terms) {
    if (fields.title.includes(term)) {
      score += 7;
      matched.add(term);
    }
    if (fields.context.includes(term)) {
      score += 8;
      matched.add(term);
    }
    if (fields.original.includes(term)) {
      score += 4;
      matched.add(term);
    }
    if (fields.extracted.includes(term)) {
      score += 4;
      matched.add(term);
    }
    if (fields.notes.includes(term)) {
      score += 3;
      matched.add(term);
    }
    if (fields.category.includes(term)) {
      score += 5;
      matched.add(term);
    }
    if (fields.tags.includes(term)) {
      score += 4;
      matched.add(term);
    }
    if (fields.entities.includes(term)) {
      score += 5;
      matched.add(term);
    }
    if (fields.type.includes(term)) {
      score += 3;
      matched.add(term);
    }
  }

  if (item.saved) score += 0.25;
  if (item.completed) score -= 0.1;

  return { item, score, matchedTerms: Array.from(matched) };
}

function tokenize(value: string) {
  return normalize(value)
    .split(/[^a-z0-9äöüß]+/)
    .filter((term) => term.length >= 2 && !stopWords.has(term));
}

function expandTerms(terms: string[]) {
  const expanded = new Set(terms);
  for (const term of terms) {
    const group = synonymGroups.find((candidate) => candidate.includes(term));
    group?.forEach((synonym) => expanded.add(synonym));
  }
  return Array.from(expanded);
}

function normalize(value?: string | null) {
  return (value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}
