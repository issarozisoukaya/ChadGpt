import { NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/admin-auth-server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await verifySuperAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  const { id } = await ctx.params;

  let reason = "";
  try {
    const body = (await request.json()) as { reason?: string };
    reason = String(body.reason ?? "").trim();
  } catch {
    reason = "";
  }

  if (!reason) {
    return NextResponse.json({ message: "reason obligatoire" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const { data: cur } = await supabase.from("users").select("metadata").eq("id", id).maybeSingle();
    const meta = { ...((cur?.metadata as object) ?? {}), ban_reason: reason, banned_at: now };
    const { error } = await supabase.from("users").update({ status: "banned", metadata: meta, updated_at: now }).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true, data: { id, status: "banned" } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur Supabase";
    console.error("[ban POST]", e);
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
