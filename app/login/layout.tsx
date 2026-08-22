// ログイン画面も表側と同じテーマCSSを使う。
import "../fune-gallery.css";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
