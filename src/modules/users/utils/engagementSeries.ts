/** Parse engagement_series from API (JSON array from Postgres / Supabase). */
export function parseEngagementSeries(raw: unknown): number[] | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const n = raw.map((x) => Number(x)).filter((x) => !Number.isNaN(x));
    return n.length ? n : null;
  }
  if (typeof raw === "string") {
    try {
      const j = JSON.parse(raw) as unknown;
      return parseEngagementSeries(j);
    } catch {
      return null;
    }
  }
  return null;
}
