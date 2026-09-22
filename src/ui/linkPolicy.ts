/** Captured content is untrusted; opening it must not invoke arbitrary app schemes. */
export function safeMemoryUrl(value: string): string | undefined {
  try {
    const url = new URL(value.trim());
    if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username || url.password) return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}
