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
  },
};

export default nextConfig;
