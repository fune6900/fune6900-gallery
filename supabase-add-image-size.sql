-- ============================================
-- 画像サイズ列の追加（デザイン移植で必要になった分）
-- Supabaseダッシュボード → SQL Editor に貼って実行する
--
-- ギャラリーのカードは「画像の縦横比から行数を計算して grid-row: span N」で
-- 積むため、比が分からないと縦長の作品が上下を削られる（DESIGN.md 5章）。
-- 旧WordPressテーマは添付メタから比を取っていたので、その代わりの列。
-- NULL のままでも 4:3 として描画されるので、後から埋めてよい。
-- ============================================

ALTER TABLE illustrations ADD COLUMN IF NOT EXISTS image_width  INTEGER;
ALTER TABLE illustrations ADD COLUMN IF NOT EXISTS image_height INTEGER;
