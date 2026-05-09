/** Where the Users admin module loads list/detail data from. Set NEXT_PUBLIC_USERS_DATA_SOURCE=supabase when Supabase env is configured server-side. */
export type UsersDataSource = "rest" | "supabase";

export function getUsersDataSource(): UsersDataSource {
  if (typeof process === "undefined") return "rest";
  return process.env.NEXT_PUBLIC_USERS_DATA_SOURCE === "supabase" ? "supabase" : "rest";
}
