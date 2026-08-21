// 管理画面は表側のテーマCSSではなく Tailwind を使う。
import "../globals.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
