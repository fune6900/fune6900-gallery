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
