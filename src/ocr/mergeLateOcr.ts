import type { CaptureDraft } from '../capture/core';

export function mergeLateOcrDraft({
  current,
  interpreted,
  extractedText,
  userEdited,
  extractedTextEdited
}: {
  current: CaptureDraft | null;
  interpreted: CaptureDraft;
  extractedText: string;
  userEdited: boolean;
  extractedTextEdited: boolean;
}) {
  const enriched = enrichRecognizedDraft(interpreted, extractedText);
  if (!current || !userEdited) return isGenericTitle(interpreted.title) ? enriched : interpreted;
  if (extractedTextEdited) return current;
  return { ...current, extractedText };
}

function enrichRecognizedDraft(draft: CaptureDraft, text: string): CaptureDraft {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const urls = unique(extractUrls(text));
  const labeled = lines
    .map((line) => {
      const match = line.match(/^(.{2,48}?)\s*[:–—-]\s*(https?:\/\/|www\.)/i);
      return match?.[1]?.trim().replace(/^[•·\-*\s]+/, '').replace(/[.:\s]+$/, '');
    })
    .filter((value): value is string => Boolean(value));

  const title = isGenericTitle(draft.title)
    ? titleFromRecognition(lines, labeled, urls)
    : draft.title;
  const context = draft.userContext || contextFromRecognition(lines, labeled, urls);
  const entities = unique([
    ...(draft.entities || []),
    ...urls.map((value) => `url:${value}`)
  ]);
  const summary = isGenericSummary(draft.summary, draft.title)
    ? context || draft.summary || title
    : draft.summary;

  return {
    ...draft,
    title,
    summary,
    userContext: context,
    url: draft.url || urls[0],
    entities,
    extractedText: text
  };
}

function titleFromRecognition(lines: string[], labels: string[], urls: string[]) {
  const german = looksGerman(lines.join(' '));
  if (labels.length >= 2) {
    const names = labels.slice(0, 3).join(', ');
    return `${names}${labels.length > 3 ? ` +${labels.length - 3}` : ''} · ${german ? 'Links' : 'links'}`;
  }
  if (labels.length === 1 && urls.length) return `${labels[0]} · ${german ? 'Link' : 'link'}`;

  const meaningful = lines.find((line) =>
    line.length >= 3 &&
    line.length <= 100 &&
    !isUrlOnly(line) &&
    !isGenericTitle(line)
  );
  return meaningful || (german ? 'Gespeicherter Scan' : 'Saved scan');
}

function contextFromRecognition(lines: string[], labels: string[], urls: string[]) {
  const german = looksGerman(lines.join(' '));
  if (labels.length) {
    const names = labels.slice(0, 6).join(', ');
    if (german) return `${urls.length || labels.length} gespeicherte ${urls.length === 1 ? 'Verknüpfung' : 'Links'} für ${names}.`;
    return `${urls.length || labels.length} saved ${urls.length === 1 ? 'link' : 'links'} for ${names}.`;
  }

  const useful = lines
    .filter((line) => line.length >= 4 && line.length <= 140 && !isUrlOnly(line) && !isGenericTitle(line))
    .slice(0, 2);
  if (!useful.length) {
    if (!urls.length) return undefined;
    return german ? `${urls.length} Links in diesem Scan erkannt.` : `${urls.length} links recognized in this scan.`;
  }
  return useful.join(' · ').slice(0, 300);
}

function extractUrls(value: string) {
  return (value.match(/https?:\/\/[^\s]+|www\.[^\s]+/gi) ?? [])
    .map((url) => url.replace(/[),.;]+$/, ''));
}

function isUrlOnly(value: string) {
  return /^(?:https?:\/\/|www\.)\S+$/i.test(value.trim());
}

function isGenericTitle(value?: string) {
  const clean = (value || '').trim();
  return !clean || /^(scanned document|document|image|captured in one|shared to one|saved scan)$/i.test(clean) || /^(?:img[_-]?\d+|scan[-_\d]*)(?:\.[a-z0-9]+)?$/i.test(clean);
}

function isGenericSummary(summary: string | undefined, title: string) {
  if (!summary) return true;
  const clean = summary.trim();
  return clean === title || isGenericTitle(clean);
}

function looksGerman(value: string) {
  return /\b(und|für|fuer|der|die|das|stempel|rechnung|beleg|termin|gespeichert)\b/i.test(value);
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
