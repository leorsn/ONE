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
  if (!current || !userEdited) return interpreted;
  if (extractedTextEdited) return current;
  return { ...current, extractedText };
}
