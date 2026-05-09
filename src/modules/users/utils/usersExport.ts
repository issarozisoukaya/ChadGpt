import { adminApi } from "@/lib/api/client";
import { supabaseAdminUsers } from "@/lib/api/supabase-admin-users";
import { getUsersDataSource } from "@/lib/users-data-source";
import type { UsersListFilters } from "../store/usersStore";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadUsersExport(format: "csv" | "json", filters: UsersListFilters, anonymize = false) {
  const day = new Date().toISOString().slice(0, 10);
  const ext = format === "csv" ? "csv" : "json";

  if (getUsersDataSource() === "supabase") {
    const blob = await supabaseAdminUsers.exportBlob(
      {
        search: filters.search.trim() || undefined,
        plan: filters.plan !== "all" ? filters.plan : undefined,
        status: filters.status !== "all" ? filters.status : undefined,
        country_code: filters.country_code || undefined,
        tags: filters.tags || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        sort: filters.sort,
        order: filters.order,
      },
      format,
      anonymize
    );
    triggerDownload(blob, `users_export_${day}.${ext}`);
    return;
  }

  const blob = await adminApi.users.exportBlob(format === "csv" ? "csv" : "json");
  triggerDownload(blob, `users_export_${day}.${ext}`);
}
