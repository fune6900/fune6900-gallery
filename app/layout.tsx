import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  // 相対URLを絶対URLに直す基準。OGPとsitemapに要る。
  metadataBase: siteUrl(),
  title: {
    default: SITE_NAME,
    // 作品ページなど、下の階層が自分の題名を入れたときの型
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    locale: "ja_JP",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  // 管理画面とAPIは検索結果に出す意味がない（robots.ts でも弾いている）
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 直下のインラインスクリプトが <html> に fg-js を足すため、
    // サーバー出力（class 無し）とクライアント（class="fg-js"）が食い違う。
    // これは意図した差分なので、この要素の属性についてだけ警告を止める。
    // サーバー側で最初から付けてしまうと、JS が無い環境で本文が
    // 永久に見えなくなる（下記のとおり）ので、その手は使えない。
    <html lang="ja" suppressHydrationWarning>
      <head>
        {/*
          スクロール表示は opacity:0 から始まるので、JS が無い/失敗した環境では
          内容が永久に見えなくなる。ここで印を付け、CSS 側はこの印がある時だけ
          伏せる。描画前に実行する必要があるのでインラインで置いている。
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('fg-js');",
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
