export const CLOUD_ITEMS_PAGE_SIZE = 500;

export async function collectPagedRows<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
  pageSize = CLOUD_ITEMS_PAGE_SIZE
): Promise<T[]> {
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new Error('pageSize must be a positive integer');
  }

  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1);
    rows.push(...page);

    if (page.length < pageSize) return rows;
  }
}
