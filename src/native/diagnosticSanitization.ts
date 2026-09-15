const SENSITIVE_QUERY = /([?&](?:code|token|access_token|refresh_token|authorization)=)[^&#\s]+/gi;
const BEARER_TOKEN = /\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi;
const JWT_LIKE = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;

export function sanitizeNativeDiagnosticDetail(value?: string, limit = 300) {
  if (!value) return undefined;

  return value
    .replace(SENSITIVE_QUERY, '$1[redacted]')
    .replace(BEARER_TOKEN, 'Bearer [redacted]')
    .replace(JWT_LIKE, '[redacted-jwt]')
    .slice(0, limit);
}
