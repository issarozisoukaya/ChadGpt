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

/** Masque un e-mail pour affichage tableau (révélation explicite requise). */
export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return "—";
  const [local, domain] = email.split("@");
  if (!domain) return "—";
  const safeLocal = local ?? "";
  const head = safeLocal.slice(0, 1);
  return `${head}***@${domain}`;
}

/** Masque un numéro de téléphone. */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = phone.replace(/\s+/g, "");
  if (digits.length <= 4) return "****";
  return `${"*".repeat(Math.max(4, digits.length - 4))}${digits.slice(-2)}`;
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
