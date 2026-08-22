// 管理画面も表側と同じテーマCSSを使う。
// ボタン・入力欄・見出しは .fg-* をそのまま流用し、
// 管理画面固有の並びは styles/scss/_admin.scss（.ad-*）で足している。
import "../fune-gallery.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
