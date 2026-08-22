// 旧WordPressの「サイトのタイトル / キャッチフレーズ」に相当する値。
// bloginfo('name') / bloginfo('description') の置き換え。
export const SITE_NAME = "Fune6900’s Gallery";
export const SITE_DESCRIPTION = "Fune6900のイラスト保管庫";

/**
 * サイトの絶対URL。
 *
 * metadataBase・sitemap・robots・OGP は絶対URLでないと成立しないので、
 * ここで一本化する。
 *
 *   1. NEXT_PUBLIC_SITE_URL   独自ドメインを使う場合はこれを設定する
 *   2. Vercel が入れる本番URL   未設定でも本番だけは正しくなる
 *   3. localhost               開発用
 */
let warned = false;

export function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);

  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return new URL(`https://${vercel}`);

  // robots.txt と sitemap.xml はビルド時に静的生成されるので、
  // ここで localhost に落ちるとそのまま焼き込まれる。本番で起きると
  // 気付きにくいうえに検索エンジンに嘘を伝えることになるため、
  // 開発以外では声を上げる。
  if (process.env.NODE_ENV === "production" && !warned) {
    warned = true;
    console.warn(
      "[site] NEXT_PUBLIC_SITE_URL も Vercel のURLも無いため localhost を使います。" +
        " robots.txt / sitemap.xml / OGP が正しくなりません。",
    );
  }

  return new URL("http://localhost:3000");
}
