import type { OneItem } from '../types/item';

const contextAliases: Record<string, string[]> = {
  papa: ['papa', 'vater', 'dad', 'father'],
  mama: ['mama', 'mutter', 'mom', 'mother'],
  studium: ['studium', 'uni', 'universitaet', 'universität', 'university', 'college'],
  geburtstag: ['geburtstag', 'birthday'],
  reisen: ['reisen', 'reise', 'urlaub', 'travel', 'trip', 'vacation'],
  arbeit: ['arbeit', 'job', 'work']
};

const canonicalLabels: Record<string, string> = {
  papa: 'Papa',
  mama: 'Mama',
  studium: 'Studium',
  geburtstag: 'Geburtstag',
  reisen: 'Reisen',
  arbeit: 'Arbeit'
};

export function normalizeContextLabel(candidate?: string, existingContexts: string[] = []) {
  const clean = candidate?.trim().replace(/\s+/g, ' ');
  if (!clean) return undefined;

  const normalizedCandidate = normalize(clean);
  const directExisting = existingContexts.find((value) => normalize(value) === normalizedCandidate);
  if (directExisting) return directExisting.trim();

  const aliasKey = Object.entries(contextAliases).find(([, aliases]) =>
    aliases.some((alias) => normalize(alias) === normalizedCandidate)
  )?.[0];

  if (aliasKey) {
    const existingAlias = existingContexts.find((value) =>
      contextAliases[aliasKey].some((alias) => normalize(alias) === normalize(value))
    );
    return existingAlias?.trim() || canonicalLabels[aliasKey];
  }

  return clean;
}

export function normalizeTags(tags: string[]) {
  const normalized = new Map<string, string>();
  for (const tag of tags) {
    const clean = tag.trim().replace(/^#/, '').replace(/\s+/g, ' ');
    if (!clean) continue;
    const aliasKey = Object.entries(contextAliases).find(([, aliases]) =>
      aliases.some((alias) => normalize(alias) === normalize(clean))
    )?.[0];
    const value = aliasKey ? canonicalLabels[aliasKey].toLowerCase() : clean.toLowerCase();
    normalized.set(normalize(value), value);
  }
  return Array.from(normalized.values());
}

export function existingContextsFromItems(items: OneItem[]) {
  return Array.from(new Set(items.map((item) => item.userContext?.trim()).filter((value): value is string => Boolean(value))));
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
