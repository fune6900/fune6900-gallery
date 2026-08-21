// ログイン画面は表側のテーマCSSではなく Tailwind を使う。
import "../globals.css";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
