export type ItemStorageScope = 'anonymous' | `user:${string}`;

export function itemStorageScope(userId?: string | null): ItemStorageScope {
  return userId ? `user:${userId}` : 'anonymous';
}
