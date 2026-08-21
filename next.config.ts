import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 本番をDockerで自前ホストする場合に必要（Vercelなら無視される・無害）
  output: "standalone",
  images: {
    // R2 の公開URL（カスタムドメイン or r2.dev）からの画像を許可
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
    ],
    // 変換結果を長く持つ。作品画像はファイル名込みで一意なので入れ替わらない。
    // ここが短いと、原寸（1枚20MB超のものもある）を何度も取りに行くことになる。
    minimumCacheTTL: 60 * 60 * 24 * 31,
  },
};

export default nextConfig;
