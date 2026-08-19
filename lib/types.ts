// 作品（イラスト）1件の型。DBのillustrationsテーブルに対応する。
export type Illustration = {
  id: number;
  title: string;
  description: string | null;
  image_url: string;
  production_date: string | null; // "YYYY-MM-DD"
  // カードのグリッド行数を画像の比から決めるために使う（DESIGN.md 5章）。
  // 旧テーマは wp_get_attachment_metadata() から取っていた値。
  // 未設定なら 4:3 として扱うので、無くても表示は崩れない。
  image_width: number | null;
  image_height: number | null;
  created_at: string;
  updated_at: string;
};

// 新規作成・更新時に送るデータ（idなどは自動なので除く）
export type IllustrationInput = {
  title: string;
  description?: string | null;
  image_url: string;
  production_date?: string | null;
  image_width?: number | null;
  image_height?: number | null;
};
