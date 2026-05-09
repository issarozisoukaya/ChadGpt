import { NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/admin-auth-server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type BulkBody = {
  user_ids: string[];
  action: string;
  payload?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const auth = await verifySuperAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  let body: BulkBody;
  try {
    body = (await request.json()) as BulkBody;
  } catch {
    return NextResponse.json({ message: "Corps JSON invalide" }, { status: 400 });
  }

  const ids = Array.isArray(body.user_ids) ? body.user_ids.filter(Boolean).slice(0, 2000) : [];
  if (ids.length === 0) {
    return NextResponse.json({ message: "user_ids requis" }, { status: 400 });
  }

  const adminId = auth.admin.id as string | undefined;

  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    switch (body.action) {
      case "set_plan": {
        const plan = String(body.payload?.plan ?? "").toLowerCase();
        if (!plan) return NextResponse.json({ message: "payload.plan requis" }, { status: 400 });
        const { error } = await supabase
          .from("users")
          .update({ subscription_tier: plan, updated_at: now })
          .in("id", ids);
        if (error) throw error;
        break;
      }
      case "set_status": {
        const status = String(body.payload?.status ?? "");
        if (!status) return NextResponse.json({ message: "payload.status requis" }, { status: 400 });
        const { error } = await supabase.from("users").update({ status, updated_at: now }).in("id", ids);
        if (error) throw error;
        break;
      }
      case "add_credits": {
        const amount = Number(body.payload?.amount ?? 0);
        if (!Number.isFinite(amount) || amount === 0) {
          return NextResponse.json({ message: "payload.amount invalide" }, { status: 400 });
        }
        const { data: rows, error: readErr } = await supabase
          .from("users")
          .select("id, credits_balance")
          .in("id", ids);
        if (readErr) throw readErr;
        await Promise.all(
          (rows ?? []).map((row: { id: string; credits_balance?: number | null }) => {
            const cur = Number(row.credits_balance ?? 0) || 0;
            return supabase
              .from("users")
              .update({ credits_balance: Math.max(0, cur + amount), updated_at: now })
              .eq("id", row.id);
          })
        );
        break;
      }
      case "add_tags": {
        const tag = String(body.payload?.tag ?? "").trim();
        if (!tag) return NextResponse.json({ message: "payload.tag requis" }, { status: 400 });
        for (const user_id of ids) {
          const row = {
            user_id,
            tag,
            ...(adminId ? { added_by: adminId } : {}),
          };
          const { error: insErr } = await supabase.from("user_tags").upsert(row, { onConflict: "user_id,tag" });
          if (insErr?.code === "23505") continue;
          if (insErr) throw insErr;
        }
        break;
      }
      case "ban": {
        const reason = String(body.payload?.reason ?? "").trim();
        if (!reason) return NextResponse.json({ message: "payload.reason obligatoire" }, { status: 400 });
        for (const userId of ids) {
          const { data: cur } = await supabase.from("users").select("metadata").eq("id", userId).maybeSingle();
          const meta = { ...((cur?.metadata as object) ?? {}), ban_reason: reason, banned_at: now };
          const { error } = await supabase.from("users").update({ status: "banned", metadata: meta, updated_at: now }).eq("id", userId);
          if (error) throw error;
        }
        break;
      }
      default:
        return NextResponse.json({ message: `Action non supportée: ${body.action}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: { affected: ids.length, action: body.action },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur Supabase";
    console.error("[admin/supabase/users/bulk]", e);
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
