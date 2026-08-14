import { getAllIllustrations } from "@/lib/queries";
import AdminClient from "./AdminClient";

// 管理画面。middlewareで既にログインチェック済み。
// 初期データはサーバーで取得し、操作はクライアント側で行う。
export const dynamic = "force-dynamic"; // 常に最新を取得

export default async function AdminPage() {
  const works = await getAllIllustrations();
  return <AdminClient initialWorks={works} />;
}
