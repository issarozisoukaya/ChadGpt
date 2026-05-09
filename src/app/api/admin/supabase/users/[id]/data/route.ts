import { NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/admin-auth-server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/** Suppression ligne utilisateur — nécessite CASCADE côté DB sur les tables liées. */
export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await verifySuperAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  const { id } = await ctx.params;

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true, data: { deleted: id } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur Supabase";
    console.error("[user data DELETE]", e);
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
