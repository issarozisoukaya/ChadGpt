import type { UsersListFilters } from "../store/usersStore";

/**
 * Heuristique locale (sans LLM) en attendant POST /admin/users/nl-search.
 * Les requêtes et résultats devraient être journalisés dans admin_nl_search_log.
 */
export function nlQueryToFilters(query: string): Partial<UsersListFilters> | null {
  const s = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const out: Partial<UsersListFilters> = {};

  if (
    /churn|inactif|inactive|sans activite|pas utilise|non utilise|2 semaines|deux semaines|14 jours/.test(s)
  ) {
    out.status = "inactive";
  }
  if (/banni|bannis|suspendu/.test(s)) {
    out.status = "banned";
  }
  if (/actif|active/.test(s) && !/inactif|inactive/.test(s)) {
    out.status = "active";
  }
  if (/enterprise|vip|premium/.test(s)) {
    out.plan = "enterprise";
  } else if (/\bpro\b/.test(s)) {
    out.plan = "pro";
  } else if (/gratuit|free/.test(s)) {
    out.plan = "free";
  }
  if (/france|\bfr\b/.test(s)) {
    out.country_code = "FR";
  }
  if (/\bus\b|usa|united states/.test(s)) {
    out.country_code = "US";
  }

  const conv = s.match(/(\d+)\s*(conversations?|conv\.?)/);
  if (conv) {
    out.tags = out.tags ? `${out.tags},high-volume` : "high-volume";
  }

  return Object.keys(out).length ? out : null;
}
