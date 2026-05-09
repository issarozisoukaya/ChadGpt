import { NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/admin-auth-server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { fetchUserDetailBundle } from "@/lib/supabase/queries/admin-users";

const PATCH_ALLOWED = new Set([
  "full_name",
  "language",
  "timezone",
  "country",
  "city",
  "subscription_tier",
  "status",
  "avatar_url",
]);

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await verifySuperAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  const { id } = await ctx.params;

  try {
    const supabase = getSupabaseAdmin();
    const bundle = await fetchUserDetailBundle(supabase, id);
    return NextResponse.json({ success: true, data: bundle });
  } catch (e: unknown) {
    const status = (e as Error & { status?: number }).status ?? 500;
    const msg = e instanceof Error ? e.message : "Erreur Supabase";
    console.error("[admin/supabase/users/:id GET]", e);
    return NextResponse.json({ message: msg }, { status });
  }
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await verifySuperAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  const { id } = await ctx.params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Corps JSON invalide" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const patch: Record<string, unknown> = {};

    for (const key of PATCH_ALLOWED) {
      if (key in body) patch[key] = body[key];
    }

    const creditsDelta = body.credits_delta;
    if (typeof creditsDelta === "number" && Number.isFinite(creditsDelta) && creditsDelta !== 0) {
      const { data: row, error: readErr } = await supabase
        .from("users")
        .select("credits_balance")
        .eq("id", id)
        .maybeSingle();
      if (readErr) throw readErr;
      const cur = Number((row as { credits_balance?: number | null })?.credits_balance ?? 0) || 0;
      patch.credits_balance = Math.max(0, cur + creditsDelta);
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ message: "Aucun champ autorisé à modifier" }, { status: 400 });
    }

    patch.updated_at = new Date().toISOString();

    const { error } = await supabase.from("users").update(patch).eq("id", id);
    if (error) throw error;

    const bundle = await fetchUserDetailBundle(supabase, id);
    return NextResponse.json({ success: true, data: bundle });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur Supabase";
    console.error("[admin/supabase/users/:id PATCH]", e);
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
