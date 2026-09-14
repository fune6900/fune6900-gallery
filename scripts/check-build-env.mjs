/**
 * 本番ビルドの前に、欠けていると危ないものだけを確かめる。
 * package.json の prebuild から呼ばれるので `npm run build` で必ず通る
 * （`opennextjs-cloudflare build` も内部で `npm run build` を叩く）。
 *
 * next.config.ts の中ではなくここに置いている理由:
 * config は `next lint` でも `next dev` でも読み込まれ、しかも lint は
 * `next build` と見分けがつかない（どちらも NODE_ENV=production かつ
 * phase-production-build を名乗る）。config に置くと lint まで巻き添えで
 * 落ちる。確かめたいのは「ビルドして配る直前」だけなので、そこに置く。
 */
// @next/env は CJS なので名前付き import は使えない
import nextEnv from "@next/env";

// next build と同じ手順で .env / .env.local を読む。
// これが無いと、ローカルでは値があるのに落ちる。
nextEnv.loadEnvConfig(process.cwd(), false, {
  info: () => {},
  error: console.error,
});

/** URL からホスト名だけ取り出す。取れなければ null。next.config.ts と同じ判定。 */
function hostOf(url) {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const problems = [];

/*
 * R2_PUBLIC_BASE_URL
 *
 * next.config.ts はこの値からホスト名を取れないと、画像の remotePatterns と
 * CSP の img-src を **.r2.dev のワイルドカードに落とす。開発中は都合がいいが、
 * 本番でこれが起きると画像最適化APIが「誰の r2.dev バケットでも取ってくる
 * 代行窓口」になる。OpenNext の画像ハンドラは remotePatterns しか見ていない
 * ので、ここが緩いと他に止める場所が無い。
 *
 * Vercel の頃は env がプロジェクト設定で中央管理されていたので取りこぼす
 * 余地が小さかった。任意の環境から `npm run deploy` を叩くようになった以上、
 * 渡し忘れは起こる前提で塞ぐ。
 */
const r2 = process.env.R2_PUBLIC_BASE_URL;
if (!r2) {
  problems.push(
    "R2_PUBLIC_BASE_URL が未設定です。\n" +
      "  このままビルドすると、画像最適化APIが任意の r2.dev バケットの\n" +
      "  取得代行になります（CSP の img-src も同時に緩みます）。",
  );
} else if (!hostOf(r2)) {
  problems.push(`R2_PUBLIC_BASE_URL からホスト名を取り出せません: ${r2}`);
}

if (problems.length > 0) {
  console.error("\n本番ビルドを中止します。\n");
  for (const p of problems) console.error(`  ✘ ${p}\n`);
  console.error("  値の一覧と置き場所は .env.example を見てください。\n");
  process.exit(1);
}
