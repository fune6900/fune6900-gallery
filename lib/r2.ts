import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Cloudflare R2 は S3 互換なので AWS SDK で扱える。
// endpoint に R2 のエンドポイントを指定するのがポイント。
export const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!, // 例: https://<accountid>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET!;
const PUBLIC_BASE = process.env.R2_PUBLIC_BASE_URL!; // 例: https://xxxx.r2.dev または独自ドメイン

// 作品画像はすべてこの下に置く。消す対象もここに限る。
const PREFIX = "works/";

// ファイルをR2にアップして、公開URLを返す
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  // 公開バケットのURLを組み立てて返す
  return `${PUBLIC_BASE}/${key}`;
}

/**
 * 公開URLから、このバケット内のキーを割り出す。
 *
 * 消してよいと確信できるものだけを返す。具体的には
 *   - 自分の公開ベースURLで始まっている
 *   - works/ 配下である
 * の両方を満たすもの。DBの image_url は任意の https URL を受け付けるので、
 * 外部のURLや works/ の外を指していた場合にうっかり消さないための関門。
 *
 * @returns 消してよいキー。判断できなければ null
 */
export function keyFromPublicUrl(url: string): string | null {
  if (!url || !PUBLIC_BASE) return null;

  const base = PUBLIC_BASE.replace(/\/+$/, "");
  if (!url.startsWith(base + "/")) return null;

  // クエリやフラグメントは落とす
  let key = url.slice(base.length + 1).split(/[?#]/)[0];
  try {
    key = decodeURIComponent(key);
  } catch {
    return null; // 壊れたエスケープ。触らない
  }

  if (!key.startsWith(PREFIX)) return null;
  // 上位ディレクトリへ抜ける形は弾く
  if (key.includes("..")) return null;

  return key;
}

/**
 * R2 のオブジェクトを消す。
 *
 * 失敗しても投げない。DBの更新・削除は既に済んでいる場面で呼ぶので、
 * ここで落とすと「画面上は消えたのにエラー」になる。
 * 残ったファイルは後から掃除できるが、DBとの不整合はそうもいかない。
 *
 * @returns 消せたら true
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch (e) {
    console.error("[R2] 削除に失敗しました:", key, e);
    return false;
  }
}

/**
 * 公開URLを指定して消す。消してよいと判断できない URL は何もしない。
 *
 * @returns 消したら true
 */
export async function deleteByPublicUrl(url: string): Promise<boolean> {
  const key = keyFromPublicUrl(url);
  if (!key) {
    console.warn("[R2] 消す対象と判断できないURLでした:", url);
    return false;
  }
  return deleteFromR2(key);
}
