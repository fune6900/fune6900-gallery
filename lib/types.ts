import { z } from "zod";

/**
 * 作品（イラスト）の入力値。
 *
 * クライアントとAPIの両方でこのスキーマを使う。
 * 画面側の検証はあくまで体験のためのもので、実際の防御はAPI側で行う
 * （security.md「クライアントサイドのバリデーションは UX のため。
 * セキュリティはサーバーサイドで担保する」）。
 */

// 制作日。空欄を許すので、入るときだけ YYYY-MM-DD を要求する。
const ProductionDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日付は YYYY-MM-DD で指定してください")
  .refine((v) => {
    // Date.parse は 2024-02-31 を 3/2 に繰り上げて受け入れてしまうので、
    // 組み立て直して元の数字と一致するかで見る。
    const [y, m, d] = v.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return (
      dt.getUTCFullYear() === y &&
      dt.getUTCMonth() === m - 1 &&
      dt.getUTCDate() === d
    );
  }, "存在しない日付です")
  .refine((v) => {
    const y = Number(v.slice(0, 4));
    return y >= 1970 && y <= 2999;
  }, "年が範囲外です")
  .nullable();

export const IllustrationInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "タイトルを入力してください")
    .max(120, "タイトルは120文字までです"),

  // .catch(null) は付けないこと。長すぎる説明を黙って null に潰してしまう。
  description: z.string().trim().max(2000, "説明は2000文字までです").nullable(),

  // R2 の公開URLだけを受け付ける。任意のURLを保存できると、
  // 表側に外部の画像を差し込まれる余地ができる。
  image_url: z
    .string()
    .min(1, "画像をアップロードしてください")
    .url("画像のURLが不正です")
    .refine(
      (v) => /^https:\/\//.test(v),
      "画像のURLは https でなければなりません",
    ),

  production_date: ProductionDateSchema,

  // カードの行数を画像の比から決めるのに使う（表側のグリッド）
  image_width: z
    .number()
    .int("画像の幅が不正です")
    .positive("画像の幅が不正です")
    .max(100000, "画像の幅が大きすぎます")
    .nullable(),
  image_height: z
    .number()
    .int("画像の高さが不正です")
    .positive("画像の高さが不正です")
    .max(100000, "画像の高さが大きすぎます")
    .nullable(),
});

export type IllustrationInput = z.infer<typeof IllustrationInputSchema>;

/** 更新は部分更新を許す。ただし空オブジェクトは弾く。 */
export const IllustrationPatchSchema = IllustrationInputSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  "更新する項目がありません",
);

// 作品1件の型。DBのillustrationsテーブルに対応する。
export type Illustration = {
  id: number;
  title: string;
  description: string | null;
  image_url: string;
  production_date: string | null; // "YYYY-MM-DD"
  image_width: number | null;
  image_height: number | null;
  created_at: string;
  updated_at: string;
};

/** zod のエラーを「項目名 → メッセージ」に畳む。画面はこれをそのまま出す。 */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
