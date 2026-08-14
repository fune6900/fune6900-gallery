/**
 * ローカル移行スクリプト（AWSに繋がない版）
 *   migration-data/dump.sql と migration-data/uploads/ から移行する。
 * 実行: docker compose exec app npm run migrate
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const DUMP_PATH = "migration-data/dump.sql";
const UPLOADS_DIR = "migration-data/uploads";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

function formatDate(raw: string | null): string | null {
  if (!raw || raw.length !== 8) return null;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}
function guessContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  return "image/png";
}

// "(...),(...)" を各レコードに分割
function splitRecords(valuesPart: string): string[] {
  const records: string[] = [];
  let depth = 0, current = "", inString = false, escaped = false;
  for (let i = 0; i < valuesPart.length; i++) {
    const ch = valuesPart[i];
    if (escaped) { current += ch; escaped = false; continue; }
    if (ch === "\\") { current += ch; escaped = true; continue; }
    if (ch === "'") { inString = !inString; current += ch; continue; }
    if (!inString && ch === "(") { depth++; if (depth === 1) { current = ""; continue; } }
    if (!inString && ch === ")") { depth--; if (depth === 0) { records.push(current); current = ""; continue; } }
    current += ch;
  }
  return records;
}
// 1レコードをフィールド配列へ
function parseRecord(rec: string): string[] {
  const fields: string[] = [];
  let current = "", inString = false, escaped = false;
  for (let i = 0; i < rec.length; i++) {
    const ch = rec[i];
    if (escaped) {
      if (ch === "n") current += "\n";
      else if (ch === "t") current += "\t";
      else if (ch === "r") current += "\r";
      else current += ch;
      escaped = false; continue;
    }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === "'") { inString = !inString; continue; }
    if (!inString && ch === ",") { fields.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  fields.push(current.trim());
  return fields;
}

function parseDump(sql: string) {
  const posts = new Map<number, string>();
  const attachments = new Map<number, string>();
  const meta: { postId: number; key: string; value: string }[] = [];

  const postRe = /INSERT INTO `wp_site1_posts`[^;]*?VALUES\s*(.+?);\n/gs;
  let m: RegExpExecArray | null;
  while ((m = postRe.exec(sql)) !== null) {
    for (const rec of splitRecords(m[1])) {
      const f = parseRecord(rec);
      const id = Number(f[0]);
      if (Number.isNaN(id)) continue;
      const postStatus = f[7];   // publish / trash など
      const guid = f[18];        // guid（ファイルURL）
      const postType = f[20];    // post_type
      // ゴミ箱(trash)や自動下書きは除外
      posts.set(id, postStatus === "trash" ? "__trash__" : postType);
      if (postType === "attachment" && guid && guid !== "NULL") {
        attachments.set(id, basename(guid));
      }
    }
  }
  const metaRe = /INSERT INTO `wp_site1_postmeta`[^;]*?VALUES\s*(.+?);\n/gs;
  while ((m = metaRe.exec(sql)) !== null) {
    for (const rec of splitRecords(m[1])) {
      const f = parseRecord(rec);
      meta.push({ postId: Number(f[1]), key: f[2], value: f[3] });
    }
  }
  return { posts, attachments, meta };
}

function findImage(dir: string, filename: string): string | null {
  // まず完全一致を探す
  const exact = findExact(dir, filename);
  if (exact) return exact;
  // 見つからなければ、拡張子前の本体名で始まるファイルを探す（-scaled や -732x1024 等の派生を許容）
  const dot = filename.lastIndexOf(".");
  const stem = dot > 0 ? filename.slice(0, dot) : filename;
  const ext = dot > 0 ? filename.slice(dot) : "";
  return findByStem(dir, stem, ext);
}
function findExact(dir: string, filename: string): string | null {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      const f = findExact(full, filename);
      if (f) return f;
    } else if (entry === filename) {
      return full;
    }
  }
  return null;
}
function findByStem(dir: string, stem: string, ext: string): string | null {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      const f = findByStem(full, stem, ext);
      if (f) return f;
    } else if (entry.startsWith(stem) && entry.endsWith(ext)) {
      return full;
    }
  }
  return null;
}

async function main() {
  console.log("ダンプを読み込んでいます...");
  const sql = readFileSync(DUMP_PATH, "utf8");
  const { posts, attachments, meta } = parseDump(sql);

  const ids = [...posts.entries()]
    .filter(([, t]) => t === "illustration")
    .map(([id]) => id);
  console.log(`${ids.length} 件の作品を検出しました`);
  console.log(`（attachment: ${attachments.size} 件, meta: ${meta.length} 行）`);


  let success = 0, failed = 0;
  for (const postId of ids) {
    const pm = meta.filter((x) => x.postId === postId);
    const get = (k: string) => pm.find((x) => x.key === k)?.value ?? null;
    // ACFは同じキーで2レコード作る（実値 と field_xxx）。数値のものだけを拾う。
    const getNumeric = (k: string) =>
      pm.find((x) => x.key === k && /^[0-9]+$/.test(x.value))?.value ?? null;
    const title = get("title") || "(無題)";
    const description = get("description");
    const productionDate = get("production_date");
    const imageId = getNumeric("main_image");

    const filename = imageId ? attachments.get(Number(imageId)) : null;
    if (!filename) { console.warn(`⚠️ 画像ID不明: 「${title}」`); failed++; continue; }
    const imagePath = findImage(UPLOADS_DIR, filename);
    if (!imagePath) { console.warn(`⚠️ 画像ファイル無: ${filename}`); failed++; continue; }

    try {
      const buffer = readFileSync(imagePath);
      const key = `works/${postId}-${filename}`;
      await r2.send(new PutObjectCommand({
        Bucket: R2_BUCKET, Key: key, Body: buffer,
        ContentType: guessContentType(filename),
      }));
      const imageUrl = `${R2_PUBLIC_BASE}/${key}`;
      const { error } = await supabase.from("illustrations").insert({
        title, description: description || null,
        image_url: imageUrl, production_date: formatDate(productionDate),
      });
      if (error) { console.error(`❌ DB: 「${title}」`, error.message); failed++; }
      else { console.log(`✅ ${title}`); success++; }
    } catch (e) {
      console.error(`❌ 「${title}」`, e); failed++;
    }
  }
  console.log(`\n完了: 成功 ${success} 件 / 失敗 ${failed} 件`);
}
main().catch((e) => { console.error(e); process.exit(1); });