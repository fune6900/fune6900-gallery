/**
 * 表側（ギャラリー）の共通レイアウト。
 *
 * CSS は旧テーマの src/scss/main.scss をそのままコンパイルしたもの。
 * JS も assets/js/main.js をそのまま置いてある（起動部分だけ差し替え）。
 * ヘッダー・フッターは旧テーマと同じく各ページが自分で描く
 * （get_header() / get_footer() と同じ扱い）。
 */
import Script from "next/script";
import "../fune-gallery.css";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Script src="/fune-gallery.js" strategy="afterInteractive" />
    </>
  );
}
