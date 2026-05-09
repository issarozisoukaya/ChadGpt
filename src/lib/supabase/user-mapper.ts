/** Normalise une ligne `users` Supabase vers le contrat attendu par l’UI admin existante. */

export function mapUserRow(row: Record<string, unknown>): Record<string, unknown> {
  const tierRaw = row.subscription_tier ?? row.plan ?? "free";
  const tier = String(tierRaw).toLowerCase();

  const countryRaw = row.country;
  const countryCodeGuess =
    typeof countryRaw === "string" && /^[a-zA-Z]{2}$/.test(countryRaw.trim())
      ? countryRaw.trim().toUpperCase()
      : (row.country_code as string | undefined)?.toUpperCase() ?? "";

  const lastSeen =
    (row.last_seen_at as string | undefined) ??
    (row.last_active_at as string | undefined) ??
    (row.last_login_at as string | undefined) ??
    null;

  const tokensUsed =
    Number(row.total_tokens_used ?? row.credits_used_total ?? row.tokens_used_total ?? 0) || 0;

  const quota = Number(row.token_quota ?? row.monthly_requests_limit ?? 500_000) || 500_000;

  return {
    ...row,
    plan: tier,
    country_code: countryCodeGuess,
    last_seen_at: lastSeen,
    email_verified: Boolean(row.email_verified ?? row.emailVerified),
    total_tokens_used: tokensUsed,
    token_quota: quota,
    requests_today: Number(row.requests_today ?? row.monthly_requests_count ?? 0) || 0,
    risk_score: Number(row.risk_score ?? 0) || 0,
    engagement_score:
      row.engagement_score != null
        ? Number(row.engagement_score)
        : row.monthly_requests_count != null && row.monthly_requests_limit != null
          ? Math.min(
              100,
              (Number(row.monthly_requests_count) / Math.max(1, Number(row.monthly_requests_limit))) * 100
            )
          : null,
    preferred_language: row.language ?? row.preferred_language ?? row.locale,
    locale: row.language ?? row.locale,
    total_sessions: row.total_sessions ?? row.session_count ?? null,
    total_messages: row.total_messages ?? row.message_count ?? null,
    conversation_count: row.conversation_count ?? row.total_sessions ?? null,
  };
}

export function uuidLooksLike(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s.trim()
  );
}
