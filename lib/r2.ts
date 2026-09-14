import { getCloudflareContext } from "@opennextjs/cloudflare";

/*
 * R2 へは Cloudflare のバインディング経由で触る。S3互換API は使わない。
 *
 * もとは @aws-sdk/client-s3 を使っていたが、Workers(workerd) では動かない。
 * 理由はひとつではなく、Node 向けの実装を踏むたびに別の形で落ちる。
 *   - 送信が node:http になる（workerd は発信を実装していない）
 *   - 設定の読み込みが ~/.aws/config を fs.readFile で読もうとする
 *     → [unenv] fs.readFile is not implemented yet!
 * 後者は明示設定で回避しようとしても、SDK 側が設定項目を増やすたびに
 * 再発しうる。潰し続ける類のものなので、土俵から降りる。
 *
 * バインディングなら同じアカウント内の直通で、署名も鍵も要らない。
 * 850KB ぶんのSDKもWorkerから消える。
 *
 * 代償: Docker で自前ホストする経路では画像アップロードが使えなくなる
 * （Cloudflare のコンテキストが無いため）。表側の閲覧は影響を受けない。
 * 移行スクリプト（scripts/）はローカルのNodeで動くので今まで通りSDKを使う。
 */

/** wrangler.jsonc の r2_buckets で生やしているバインディングのうち、ここで使う分。 */
interface WorksBucket {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  delete(key: string): Promise<void>;
}

function bucket(): WorksBucket {
  // cloudflare-env.d.ts は型チェックから外している（理由は tsconfig.json）。
  // そのため env の中身は素では分からない。ここで使う形だけを上の
  // WorksBucket として書き、その形に絞り込む。
  const env: unknown = getCloudflareContext().env;
  const found =
    env && typeof env === "object"
      ? (env as Record<string, unknown>).WORKS_BUCKET
      : undefined;

  if (!found || typeof found !== "object" || !("put" in found)) {
    throw new Error(
      "R2バインディング WORKS_BUCKET がありません。" +
        "wrangler.jsonc の r2_buckets を確認してください" +
        "（Docker で自前ホストしている場合、画像アップロードは使えません）",
    );
  }
  return found as WorksBucket;
}

// 例: https://xxxx.r2.dev または独自ドメイン。
// 公開URLの組み立てにしか使わないので、これだけは環境変数のまま。
//
// 読むのは「呼ばれた時」。モジュール読み込み時ではない。
// Workers は環境変数をリクエストごとに供給するため、トップレベルで
// 読むと undefined を掴みうる。
function publicBase(): string {
  return process.env.R2_PUBLIC_BASE_URL ?? "";
}

// 作品画像はすべてこの下に置く。消す対象もここに限る。
const PREFIX = "works/";

// ファイルをR2にアップして、公開URLを返す
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  await bucket().put(key, body, { httpMetadata: { contentType } });

  // 公開バケットのURLを組み立てて返す。
  // ここは URL を作れないと話にならないので、無ければ投げる。
  const base = publicBase();
  if (!base) {
    throw new Error("環境変数 R2_PUBLIC_BASE_URL が設定されていません");
  }
  return `${base.replace(/\/+$/, "")}/${key}`;
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
  // ベースURLが取れない時は「判断できない」として null を返す。
  // ここで投げないのは、消す側の入口だから。分からないなら消さないのが正しい。
  const configured = publicBase();
  if (!url || !configured) return null;

  const base = configured.replace(/\/+$/, "");
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
    await bucket().delete(key);
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
