/**
 * WordPress(RDS) → Supabase + R2 への移行スクリプト
 *
 * やること:
 *   1. RDSのMySQLに接続し、illustration作品と紐づく画像情報を取得
 *   2. 各作品の画像を、EC2上のuploadsから読む…のは難しいので、
 *      画像URL(http://52.192.212.55/...)からダウンロードしてR2にアップ
 *   3. Supabaseのillustrationsテーブルにレコードを作成
 *
 * 実行前提:
 *   - .env.local に各種環境変数が設定されていること
 *   - WordPress(RDS)が起動していて、画像URLにHTTPアクセスできること
 *   - Supabaseのテーブル作成済み（supabase-setup.sql実行済み）
 *   - R2バケット作成済み
 *
 * 実行: npm run migrate
 */

import mysql from "mysql2/promise";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// --- 接続情報（.env.localから） ---
const WP = {
  host: process.env.WP_DB_HOST!, // RDSエンドポイント
  user: process.env.WP_DB_USER!, // admin
  password: process.env.WP_DB_PASSWORD!,
  database: process.env.WP_DB_NAME!, // wordpress
};
const WP_BASE_URL = process.env.WP_BASE_URL!; // 例: http://52.192.212.55

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const R2_BUCKET = process.env.R2_BUCKET!;
const R2_PUBLIC_BASE = process.env.R2_PUBLIC_BASE_URL!;

// production_date "20240609" → "2024-06-09"
function formatDate(raw: string | null): string | null {
  if (!raw || raw.length !== 8) return null;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

async function main() {
  const conn = await mysql.createConnection(WP);
  console.log("RDSに接続しました");

  // illustration作品 + ACFメタ(title/description/production_date/main_image) +
  // main_imageが指すattachmentのguid(画像URL) を一気に取得
  const [rows] = await conn.execute<any[]>(`
    SELECT
      p.ID                                   AS post_id,
      MAX(CASE WHEN pm.meta_key='title'           THEN pm.meta_value END) AS title,
      MAX(CASE WHEN pm.meta_key='description'     THEN pm.meta_value END) AS description,
      MAX(CASE WHEN pm.meta_key='production_date' THEN pm.meta_value END) AS production_date,
      MAX(CASE WHEN pm.meta_key='main_image'      THEN pm.meta_value END) AS image_id
    FROM wp_site1_posts p
    JOIN wp_site1_postmeta pm ON pm.post_id = p.ID
    WHERE p.post_type = 'illustration'
    GROUP BY p.ID
    ORDER BY p.ID
  `);

  console.log(`${rows.length} 件の作品を検出しました`);

  for (const row of rows) {
    // 画像IDから、実ファイルのURL(guid)を引く
    const [imgRows] = await conn.execute<any[]>(
      "SELECT guid FROM wp_site1_posts WHERE ID = ? AND post_type='attachment'",
      [row.image_id],
    );
    if (imgRows.length === 0) {
      console.warn(
        `⚠️ 画像が見つかりません: 作品「${row.title}」(id=${row.post_id})`,
      );
      continue;
    }
    const guid: string = imgRows[0].guid;
    // guidのURLからファイル名を取り出す
    const filename = guid.split("/").pop()!;
    const imageDownloadUrl = guid.startsWith("http")
      ? guid
      : `${WP_BASE_URL}${guid}`;

    // 画像をダウンロード
    const resp = await fetch(imageDownloadUrl);
    if (!resp.ok) {
      console.warn(`⚠️ 画像DL失敗: ${imageDownloadUrl}`);
      continue;
    }
    const buffer = Buffer.from(await resp.arrayBuffer());
    const contentType = resp.headers.get("content-type") || "image/png";

    // R2にアップ
    const key = `works/${row.post_id}-${filename}`;
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    const publicUrl = `${R2_PUBLIC_BASE}/${key}`;

    // Supabaseにレコード作成
    const { error } = await supabase.from("illustrations").insert({
      title: row.title || "(無題)",
      description: row.description || null,
      image_url: publicUrl,
      production_date: formatDate(row.production_date),
    });
    if (error) {
      console.error(`❌ DB挿入失敗: ${row.title}`, error.message);
    } else {
      console.log(`✅ 移行完了: ${row.title}`);
    }
  }

  await conn.end();
  console.log("すべての移行が完了しました");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
