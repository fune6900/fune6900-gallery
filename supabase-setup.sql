-- ============================================
-- Supabase セットアップSQL
-- Supabaseダッシュボード → SQL Editor に貼って実行する
-- ============================================

-- 作品テーブル
CREATE TABLE IF NOT EXISTS illustrations (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT,
  image_url       TEXT NOT NULL,
  production_date DATE,
  -- 表側のギャラリーは、この比からカードの行数を決めて画像を積む。
  -- 空でも 4:3 として描画されるので、後から埋めてよい。
  image_width     INTEGER,
  image_height    INTEGER,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 制作日で並べ替えることが多いのでインデックスを張る
CREATE INDEX IF NOT EXISTS idx_illustrations_production_date
  ON illustrations (production_date DESC);

-- ============================================
-- RLS（Row Level Security）: 誰が読み書きできるか
-- ============================================
ALTER TABLE illustrations ENABLE ROW LEVEL SECURITY;

-- 読み取り: 誰でもOK（公開ギャラリーなので）
CREATE POLICY "public read" ON illustrations
  FOR SELECT USING (true);

-- 書き込み: anonキーからは不可。
-- 管理操作は service_role キー（RLSをバイパス）でAPI経由でのみ行うため、
-- ここでは insert/update/delete のポリシーを作らない（=一般からは書けない）。
