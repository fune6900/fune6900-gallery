import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/** URL からホスト名だけ取り出す。取れなければ null。 */
function hostOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const r2Host = hostOf(process.env.R2_PUBLIC_BASE_URL);
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/**
 * Content-Security-Policy。
 *
 * security.md の雛形は `default-src 'self'` を基本にしているが、
 * このプロジェクトはそのままでは動かない。実際に必要なものだけを足してある。
 *
 *   script-src  'unsafe-inline' … Next のハイドレーション用インラインスクリプトと、
 *                                 fg-js を付けるレイアウト内のスクリプト。
 *                                 nonce 方式にするには middleware での発行が要るので、
 *                                 いまは許可している（改善の余地あり）
 *   style-src   'unsafe-inline' … React のインライン style と Next が挿すスタイル
 *               fonts.googleapis.com … 表側の書体
 *   font-src    fonts.gstatic.com    … 同上の実体
 *   img-src     R2 のホスト           … 管理画面の一覧は原寸URLを直接出している
 *               data: blob:           … 砂嵐などの SVG データURIと、
 *                                       アップロード時のプレビュー
 *   connect-src Supabase              … ブラウザ側の認証
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  `img-src 'self' data: blob:${r2Host ? ` https://${r2Host}` : " https://*.r2.dev"}`,
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""} https://*.supabase.co`,
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // frame-ancestors と重なるが、古いブラウザ向けに残す
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  // ローカルをDockerで動かす場合に必要。
  // OpenNext（Cloudflare）も standalone の出力を前提にしているので都合がいい。
  output: "standalone",

  // 使っていないヘッダーを出さない
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  images: {
    // 実際に使っているバケットのホストだけを許可する。
    // ワイルドカードのままだと、画像最適化APIが他人の r2.dev バケットの
    // 取得代行に使われうる。env が無い環境（CI等）ではワイルドカードに戻す。
    remotePatterns: r2Host
      ? [{ protocol: "https", hostname: r2Host }]
      : [
          { protocol: "https", hostname: "**.r2.dev" },
          { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
        ],

    // 変換結果を長く持つ。作品画像はファイル名込みで一意なので入れ替わらない。
    // ここが短いと、原寸（1枚20MB超のものもある）を何度も取りに行くことになる。
    //
    // ⚠ Cloudflare Images バインディング経由（本番）ではこの値は効かない。
    //   あちらは「永続キャッシュか、しないか」の二択で、秒数を受け取らない。
    //   実質もっと長く持たれるので困りはしないが、ここを直しても本番は変わらない。
    //   残してあるのは `next dev` と Docker 実行のため。
    minimumCacheTTL: 60 * 60 * 24 * 31,

    // 変換は「URL・幅・品質・形式」ごとに別物としてキャッシュされる。つまり
    // 候補幅の数だけ原寸を取りに行く可能性がある。既定のままだと1枚あたり
    // 16通りあるが、実際に要るのは最大 2150px（見せ札の DPR2）まで。
    //
    //   カード(1列)  537px → DPR2 1074px
    //   見せ札(2列) 1075px → DPR2 2150px
    //   詳細         820px → DPR2 1640px
    //   キューブ     210px → DPR2  420px
    //   前後サムネ    46px → DPR3  138px
    //   ライトボックス      2048px 固定
    //
    // 既定の 3840 はどの用途でも選ばれないのに <img src> のフォールバックになり、
    // 踏まれると 24MB の原寸から無駄な変換が走る。必要な分だけに絞る。
    // 表示サイズは変わらないので見た目に影響はない。
    deviceSizes: [640, 750, 828, 1080, 1920, 2048],
    imageSizes: [64, 128, 256, 384],
  },
};

export default nextConfig;

// `next dev` から Cloudflare のバインディング（R2・Images・Durable Object）を
// 触れるようにする。これが無いと開発中だけバインディングが undefined になる。
//
// 開発時に限る。この関数は呼ばれるたびに miniflare を1つ立ち上げるが、
// ビルド時に要るものではない（静的生成しているのは /_not-found と robots.txt で、
// どちらもバインディングを使わない）。
// 素で置くと `next build` や `next lint` でも毎回起動し、CI が遅く不安定になる。
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
