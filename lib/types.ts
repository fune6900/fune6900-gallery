// 作品（イラスト）1件の型。DBのillustrationsテーブルに対応する。
export type Illustration = {
  id: number;
  title: string;
  description: string | null;
  image_url: string;
  production_date: string | null; // "YYYY-MM-DD"
  created_at: string;
  updated_at: string;
};

// 新規作成・更新時に送るデータ（idなどは自動なので除く）
export type IllustrationInput = {
  title: string;
  description?: string | null;
  image_url: string;
  production_date?: string | null;
};
