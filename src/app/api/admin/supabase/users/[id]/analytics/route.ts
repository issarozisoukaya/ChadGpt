import { NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/admin-auth-server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { fetchUserActivityFeed, fetchUserUsageSeries } from "@/lib/supabase/queries/admin-users";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await verifySuperAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const url = new URL(request.url);
  const days = Number(url.searchParams.get("days") ?? "30") || 30;

  try {
    const supabase = getSupabaseAdmin();
    const [usage, recentActs] = await Promise.all([
      fetchUserUsageSeries(supabase, id, days),
      fetchUserActivityFeed(supabase, id, 500),
    ]);

    const typeEntries = Object.entries(usage.by_type);
    const typeSum = typeEntries.reduce((a, [, v]) => a + v, 0) || 1;
    const features_pct = Object.fromEntries(
      typeEntries.map(([k, v]) => [k, Math.round((v / typeSum) * 1000) / 10])
    );

    return NextResponse.json({
      success: true,
      data: {
        series: usage.series,
        features_pct,
        recent_events: recentActs.events,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur Supabase";
    console.error("[admin/supabase/users/:id/analytics]", e);
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
