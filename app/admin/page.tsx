import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { getAllIllustrations } from "@/lib/queries";
import AdminClient from "./AdminClient";

// 管理画面。middleware.ts でも未ログインを弾いているが、それだけに頼らない。
//
// middleware は Next 本体の不具合で迂回されうる（CVE-2025-29927 /
// GHSA-f82v-jwr5-mffw。x-middleware-subrequest ヘッダを細工すると素通りする）。
// 実際にこのバージョンで再現した。security.md の
// 「認証状態のチェックは Server Component / Server Action で行う」に従い、
// ページ側でもサーバーで確かめる。
//
// 書き込みは各 Route Handler の requireUser() が別途見ているので、
// ここが破られてもデータは触れない。これは表示側の関門。
export const dynamic = "force-dynamic"; // 常に最新を取得

export default async function AdminPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const works = await getAllIllustrations();
  return <AdminClient initialWorks={works} />;
}
