from pathlib import Path


def replace(path: str, old: str, new: str, count: int = 1):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"Expected snippet not found in {path}: {old[:140]!r}")
    p.write_text(text.replace(old, new, count))


# 1) Fix visible brand-line escape.
replace(
    "src/ui/primitives.tsx",
    "CAPTURE TODAY.\\nREMEMBER TOMORROW.",
    "CAPTURE TODAY. REMEMBER TOMORROW.",
)

# 2) Let the capture intelligence contract carry exact URLs.
replace(
    "src/capture/intelligence.ts",
    "  entities?: string[];\n  dates?: string[];",
    "  entities?: string[];\n  urls?: string[];\n  dates?: string[];",
)
replace(
    "src/capture/intelligence.ts",
    "  if (typeof source.context === 'string') result.context = source.context.trim().slice(0, 120);",
    "  if (typeof source.context === 'string') result.context = source.context.trim().slice(0, 320);",
)
replace(
    "src/capture/intelligence.ts",
    "  if (Array.isArray(source.entities) && source.entities.every((item) => typeof item === 'string')) result.entities = source.entities.slice(0, 20) as string[];\n  if (Array.isArray(source.dates) && source.dates.every(isIsoDate)) result.dates = source.dates.slice(0, 8) as string[];",
    "  if (Array.isArray(source.entities) && source.entities.every((item) => typeof item === 'string')) result.entities = source.entities.slice(0, 20) as string[];\n  if (Array.isArray(source.urls) && source.urls.every((item) => typeof item === 'string')) result.urls = source.urls.map((item) => item.trim()).filter(isWebUrl).slice(0, 12) as string[];\n  if (Array.isArray(source.dates) && source.dates.every(isIsoDate)) result.dates = source.dates.slice(0, 8) as string[];",
)
replace(
    "src/capture/intelligence.ts",
    "  const mappedKind = ai.classification ? captureKindForClassification(ai.classification) : draft.captureKind;\n  const context = normalizeContextLabel(ai.context || draft.userContext);",
    "  const mappedKind = ai.classification ? captureKindForClassification(ai.classification) : draft.captureKind;\n  const context = normalizeContextLabel(ai.context || draft.userContext);\n  const aiUrls = unique(ai.urls || []);",
)
replace(
    "src/capture/intelligence.ts",
    "    entities: unique([...(draft.entities || []), ...(ai.entities || [])]),\n    date: draft.date || ai.dates?.[0],",
    "    entities: unique([...(draft.entities || []), ...(ai.entities || []), ...aiUrls.map((value) => `url:${value}`)]),\n    url: draft.url || aiUrls[0],\n    date: draft.date || ai.dates?.[0],",
)
replace(
    "src/capture/intelligence.ts",
    "function isIsoDate(value: unknown) {",
    "function isWebUrl(value: unknown) {\n  return typeof value === 'string' && /^(?:https?:\\/\\/|www\\.)\\S+$/i.test(value.trim());\n}\n\nfunction isIsoDate(value: unknown) {",
)

# 3) Make scan OCR use server-side intelligence, with existing deterministic fallback.
replace(
    "app/scan.tsx",
    "import { interpretCapture, type CaptureDraft } from '@/src/capture/core';",
    "import { interpretCapture, type CaptureDraft } from '@/src/capture/core';\nimport { interpretCaptureWithIntelligence } from '@/src/capture/intelligence';\nimport { remoteCaptureIntelligenceProvider } from '@/src/capture/remoteIntelligence';",
)
replace(
    "app/scan.tsx",
    """        const interpreted = interpretCapture({
          rawText: stableAsset.fileName || 'Scanned document',
          extractedText: text,
          sourceType: 'scan',
          isImage: true
        });

        if (revision !== processingRevisionRef.current) return;
        setDraft((current) => mergeLateOcrDraft({
          current,
          interpreted,
          extractedText: text,
          userEdited: userEditedRef.current,
          extractedTextEdited: extractedTextEditedRef.current
        }));
        setState('ready');""",
    """        const intelligence = await interpretCaptureWithIntelligence({
          rawText: stableAsset.fileName || 'Scanned document',
          extractedText: text,
          sourceType: 'scan',
          isImage: true
        }, remoteCaptureIntelligenceProvider);
        const interpreted = intelligence.draft;

        if (revision !== processingRevisionRef.current) return;
        setDraft((current) => mergeLateOcrDraft({
          current,
          interpreted,
          extractedText: text,
          userEdited: userEditedRef.current,
          extractedTextEdited: extractedTextEditedRef.current
        }));
        setState('ready');""",
)

# 4) Better offline fallback if remote intelligence is unavailable.
Path("src/ocr/mergeLateOcr.ts").write_text("""import type { CaptureDraft } from '../capture/core';

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
  if (!current || !userEdited) return enriched;
  if (extractedTextEdited) return current;
  return { ...current, extractedText };
}

function enrichRecognizedDraft(draft: CaptureDraft, text: string): CaptureDraft {
  const lines = text.split(/\\r?\\n/).map((line) => line.trim()).filter(Boolean);
  const urls = unique(extractUrls(text));
  const labeled = lines
    .map((line) => {
      const match = line.match(/^(.{2,48}?)\\s*[:–—-]\\s*(https?:\\/\\/|www\\.)/i);
      return match?.[1]?.trim().replace(/^[•·\\-*\\s]+/, '').replace(/[.:\\s]+$/, '');
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
  return (value.match(/https?:\\/\\/[^\\s]+|www\\.[^\\s]+/gi) ?? [])
    .map((url) => url.replace(/[),.;]+$/, ''));
}

function isUrlOnly(value: string) {
  return /^(?:https?:\\/\\/|www\\.)\\S+$/i.test(value.trim());
}

function isGenericTitle(value?: string) {
  const clean = (value || '').trim();
  return !clean || /^(scanned document|document|image|captured in one|shared to one|saved scan)$/i.test(clean) || /^(?:img[_-]?\\d+|scan[-_\\d]*)(?:\\.[a-z0-9]+)?$/i.test(clean);
}

function isGenericSummary(summary: string | undefined, title: string) {
  if (!summary) return true;
  const clean = summary.trim();
  return clean === title || isGenericTitle(clean);
}

function looksGerman(value: string) {
  return /\\b(und|für|fuer|der|die|das|stempel|rechnung|beleg|termin|gespeichert)\\b/i.test(value);
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
""")

# 5) Make context clearly automatic-but-editable.
replace(
    "src/capture/CaptureReviewEditor.tsx",
    "<FieldLabel label=\"Your context\" confidence={draft.userContext ? 'high' : undefined} />",
    "<FieldLabel label=\"Context\" confidence={draft.userContext ? 'high' : undefined} />",
)
replace(
    "src/capture/CaptureReviewEditor.tsx",
    'placeholder="Gift Dad, Barcelona, Tax 2026…"',
    'placeholder="NEVER will summarize what this is about…"',
)
replace(
    "src/capture/CaptureReviewEditor.tsx",
    "Your words take priority over uncertain automatic classification.",
    "NEVER drafts this automatically. Your edits always take priority.",
)

# 6) Detail screen: original source remains visible/openable, and all extracted URLs are actionable.
replace(
    "app/item/[id].tsx",
    "import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';",
    "import { Alert, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';",
)
replace(
    "app/item/[id].tsx",
    "  const [saving, setSaving] = useState(false);\n  const [activePicker, setActivePicker] = useState<'date' | 'time' | null>(null);",
    "  const [saving, setSaving] = useState(false);\n  const [sourceExpanded, setSourceExpanded] = useState(false);\n  const [activePicker, setActivePicker] = useState<'date' | 'time' | null>(null);",
)
replace(
    "app/item/[id].tsx",
    "    setContext(item.userContext || '');",
    "    setContext(item.userContext || item.summary || '');",
)
replace(
    "app/item/[id].tsx",
    "  const currentItem = item;\n",
    """  const currentItem = item;
  const sourceUri = currentItem.localAttachmentUri || currentItem.imageUrl || currentItem.attachmentUrl;
  const sourceIsImage = Boolean(sourceUri && (
    currentItem.localAttachmentMimeType?.startsWith('image/') ||
    ['scan', 'photo', 'screenshot'].includes(currentItem.sourceType)
  ));
  const savedLinks = Array.from(new Set([
    currentItem.url,
    ...(currentItem.extractedUrls || []),
    ...currentItem.entities.filter((entity) => entity.startsWith('url:')).map((entity) => entity.slice(4))
  ].filter((value): value is string => Boolean(value))));
""",
)
replace(
    "app/item/[id].tsx",
    "        {(currentItem.type === 'document' || currentItem.merchant || currentItem.amount !== undefined) ? (",
    """        {sourceUri ? (
          <View style={styles.section}>
            <SectionHeader title="Original" meta={currentItem.localAttachmentName || undefined} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={sourceExpanded ? 'Collapse original' : 'Open original'}
              onPress={() => setSourceExpanded((value) => !value)}
              style={({ pressed }) => [styles.sourceCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.74 : 1 }]}
            >
              {sourceIsImage ? (
                <Image
                  source={{ uri: sourceUri }}
                  style={[styles.sourceImage, sourceExpanded && styles.sourceImageExpanded, { backgroundColor: theme.fill }]}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.sourceFile}>
                  <IconTile icon={icons.document} tone="neutral" size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sourceFileTitle, { color: theme.text }]}>{currentItem.localAttachmentName || 'Original file'}</Text>
                    <Text style={[styles.sourceFileMeta, { color: theme.textSecondary }]}>Original preserved by NEVER</Text>
                  </View>
                </View>
              )}
              <View style={styles.sourceActionRow}>
                <Text style={[styles.sourceAction, { color: theme.chrome }]}>{sourceExpanded ? 'Close original' : 'Open original'}</Text>
                <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
              </View>
            </Pressable>
          </View>
        ) : null}

        {(currentItem.type === 'document' || currentItem.merchant || currentItem.amount !== undefined) ? (""",
)
replace(
    "app/item/[id].tsx",
    "        {currentItem.extractedText ? (\n          <View style={styles.section}>",
    """        {savedLinks.length ? (
          <View style={styles.section}>
            <SectionHeader title="Links" meta={`${savedLinks.length} found`} />
            <View style={styles.linksStack}>
              {savedLinks.map((link, index) => (
                <Pressable
                  key={`${link}-${index}`}
                  accessibilityRole="link"
                  accessibilityLabel={`Open saved link ${index + 1}`}
                  onPress={() => Linking.openURL(normalizeWebUrl(link))}
                  style={({ pressed }) => [styles.extractedLink, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.64 : 1 }]}
                >
                  <IconTile icon={icons.link} tone="neutral" size={34} />
                  <Text style={[styles.extractedLinkText, { color: theme.text }]} numberOfLines={2}>{link}</Text>
                  <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {currentItem.extractedText ? (
          <View style={styles.section}>""",
)
replace(
    "app/item/[id].tsx",
    "        {currentItem.url ? (",
    "        {currentItem.url && !savedLinks.length ? (",
)
replace(
    "app/item/[id].tsx",
    "function clean(value: string) { return value.trim() || undefined; }",
    """function normalizeWebUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function clean(value: string) { return value.trim() || undefined; }""",
)
replace(
    "app/item/[id].tsx",
    "  section: { gap: 10 },\n  documentHeader:",
    """  section: { gap: 10 },
  sourceCard: { borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', padding: 10, gap: 8 },
  sourceImage: { width: '100%', height: 220, borderRadius: 13 },
  sourceImageExpanded: { height: 560 },
  sourceFile: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8 },
  sourceFileTitle: { fontSize: 13.5, fontWeight: '600' },
  sourceFileMeta: { marginTop: 4, fontSize: 11 },
  sourceActionRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  sourceAction: { fontSize: 11.5, fontWeight: '600' },
  linksStack: { gap: 8 },
  extractedLink: { minHeight: 58, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  extractedLinkText: { flex: 1, fontSize: 11.5, lineHeight: 16, fontWeight: '500' },
  documentHeader:""",
)

# 7) Deterministic Ask NEVER can return exact saved URLs without needing the model.
replace(
    "src/search/grounded.ts",
    "  const reminderAnswer = buildReminderAnswer(clean, items, german, now);\n  if (reminderAnswer) return reminderAnswer;\n\n  const specificDocumentAnswer",
    "  const reminderAnswer = buildReminderAnswer(clean, items, german, now);\n  if (reminderAnswer) return reminderAnswer;\n\n  const linkAnswer = buildSavedLinkAnswer(clean, bestMatch, german);\n  if (linkAnswer) return linkAnswer;\n\n  const specificDocumentAnswer",
)
replace(
    "src/search/grounded.ts",
    "function buildReminderAnswer(clean: string, items: OneItem[], german: boolean, now: Date) {",
    """function buildSavedLinkAnswer(clean: string, bestMatch: OneItem | undefined, german: boolean) {
  if (!bestMatch || !/(link|url|webseite|website|adresse)/.test(clean)) return undefined;
  const urls = Array.from(new Set([
    bestMatch.url,
    ...(bestMatch.extractedUrls || []),
    ...bestMatch.entities.filter((entity) => entity.startsWith('url:')).map((entity) => entity.slice(4))
  ].filter((value): value is string => Boolean(value))));
  if (!urls.length) return undefined;

  return {
    title: bestMatch.title,
    body: urls.join('\n'),
    meta: german ? 'Exakt aus deiner gespeicherten NEVER-Erinnerung' : 'Exact URLs from your saved NEVER memory',
    itemIds: [bestMatch.id]
  } satisfies GroundedRecallAnswer;
}

function buildReminderAnswer(clean: string, items: OneItem[], german: boolean, now: Date) {""",
)
replace(
    "src/search/grounded.ts",
    "return /\\b(wo|wann|geschenk|geburtstag|idee|ideen|gespeichert|beleg|rechnung|hatte|habe|erinnerung|morgen|betrag|wieviel)\\b/.test(value);",
    "return /\\b(wo|wann|geschenk|geburtstag|idee|ideen|gespeichert|beleg|rechnung|hatte|habe|erinnerung|morgen|betrag|wieviel|link|url|webseite)\\b/.test(value);",
)

# 8) AI recall receives OCR + exact extracted URLs too.
replace(
    "supabase/functions/answer-one-recall/index.ts",
    ".select('id,title,summary,raw_input,user_context,tags,entities,people,item_date,item_time,captured_at,url,source_type,category')",
    ".select('id,title,summary,raw_input,user_context,tags,entities,people,item_date,item_time,captured_at,url,extracted_text,extracted_urls,source_type,category')",
)
replace(
    "supabase/functions/answer-one-recall/index.ts",
    "      url: clip(row.url, 500),\n      sourceType: row.source_type,",
    "      url: clip(row.url, 500),\n      extractedText: clip(row.extracted_text, 1200),\n      extractedUrls: Array.isArray(row.extracted_urls) ? row.extracted_urls.slice(0, 12) : [],\n      sourceType: row.source_type,",
)
replace(
    "supabase/functions/answer-one-recall/index.ts",
    "                'Answer in the language of the user question. Be concise.'",
    "                'When the user asks for a link or URL, reproduce the exact stored URL from url, extractedUrls, entities, or saved text; never rewrite, shorten, or invent it.',\n                'Answer in the language of the user question. Be concise.'",
)

# One-time automation files remove themselves from the final branch state.
Path(".github/never-upgrade-trigger").unlink(missing_ok=True)
Path(".github/never-upgrade-trigger-v2").unlink(missing_ok=True)
Path(".github/workflows/never-upgrade-once.yml").unlink(missing_ok=True)
Path("scripts/upgrade_never_capture.py").unlink(missing_ok=True)
