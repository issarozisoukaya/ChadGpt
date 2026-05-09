import { NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/admin-auth-server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { fetchUserActivityFeed } from "@/lib/supabase/queries/admin-users";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await verifySuperAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "50") || 50;

  try {
    const supabase = getSupabaseAdmin();
    const payload = await fetchUserActivityFeed(supabase, id, limit);
    return NextResponse.json({ success: true, data: payload });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur Supabase";
    console.error("[admin/supabase/users/:id/activity]", e);
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
