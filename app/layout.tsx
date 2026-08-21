import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        {/*
          スクロール表示は opacity:0 から始まるので、JS が無い/失敗した環境では
          内容が永久に見えなくなる。ここで印を付け、CSS 側はこの印がある時だけ
          伏せる。描画前に実行する必要があるのでインラインで置いている。
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.className += ' fg-js';",
          }}
        />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/*
          商用フォントの代替:
            Impact         → Anton（巨大数字・ロゴ）
            ロダン Bd       → Zen Kaku Gothic New（和文全般）
            ステンシル       → Saira Stencil One（欧文サブ・ネオンサイン）
            ドットマトリクス → Silkscreen（電光掲示板・機材ラベル）
          和文は unicode-range で分割配信されるので自前ホストより軽い。
        */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Anton&family=Saira+Stencil+One&family=Silkscreen:wght@400;700&family=Zen+Kaku+Gothic+New:wght@500;700;900&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
