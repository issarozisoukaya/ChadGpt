import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: fr });
  } catch {
    return iso;
  }
}

export function activityTone(lastSeen: string | null | undefined): string {
  if (!lastSeen) return "text-neutral-400";
  const t = new Date(lastSeen).getTime();
  const h = (Date.now() - t) / 36e5;
  if (h < 1) return "text-emerald-600 dark:text-emerald-400";
  if (h < 24) return "text-emerald-500";
  if (h < 168) return "text-amber-500";
  return "text-red-500";
}

export function flagCountryEmoji(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "🌍";
  const u = code.toUpperCase().split("").map((c) => 127397 + c.charCodeAt(0));
  try {
    return String.fromCodePoint(...u);
  } catch {
    return "🌍";
  }
}
