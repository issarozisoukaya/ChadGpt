import type { UsersListFilters } from "../store/usersStore";

/** Parse operators like email:, plan:, tag:, created:>date, tokens:>n into filters + free-text search. */
export function parseUniversalSearch(input: string): Partial<UsersListFilters> & { search: string } {
  const raw = input.trim();
  if (!raw) return { search: "" };

  const tokens = raw.match(/(\S+:[^\s]+|\S+)/g) ?? [raw];
  const out: Partial<UsersListFilters> & { search: string } = { search: "" };
  const free: string[] = [];

  for (const t of tokens) {
    const colon = t.indexOf(":");
    if (colon <= 0 || t.startsWith("http")) {
      free.push(t);
      continue;
    }
    const key = t.slice(0, colon).toLowerCase();
    const val = t.slice(colon + 1);

    if (key === "email") {
      out.search = val;
      continue;
    }
    if (key === "plan") {
      out.plan = val === "all" ? "all" : val.toLowerCase();
      continue;
    }
    if (key === "status") {
      out.status = val.toLowerCase();
      continue;
    }
    if (key === "tag" || key === "tags") {
      out.tags = val;
      continue;
    }
    if (key === "country") {
      out.country_code = val.toUpperCase().slice(0, 2);
      continue;
    }
    if (key === "created") {
      const m = val.match(/^([<>]=?|)(.+)$/);
      if (m) {
        const op = m[1];
        const d = new Date(m[2]);
        if (!Number.isNaN(d.getTime())) {
          if (op === ">" || op === ">=") out.date_from = d.toISOString();
          else if (op === "<" || op === "<=") out.date_to = d.toISOString();
          else out.date_from = d.toISOString();
        }
      }
      continue;
    }
    free.push(t);
  }

  if (free.length) out.search = free.join(" ").trim();
  return out;
}
