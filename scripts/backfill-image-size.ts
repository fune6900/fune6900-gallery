/**
 * 既存の作品に画像の実寸（image_width / image_height）を埋める。
 *
 * 表側のギャラリーは画像の比からカードの行数を決めて積むため、比が分からないと
 * 縦長の作品が上下を削られる（DESIGN.md 5章）。移行済みの作品にはこの値が
 * 入っていないので、R2 の画像の先頭だけ読んでヘッダから寸法を取る。
 *
 * 事前に supabase-add-image-size.sql を実行しておくこと。
 * 実行: npm run backfill:size
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Size = { w: number; h: number };

/* ---- 画像ヘッダから寸法を読む（依存ライブラリなし）-------------- */

function fromPng(b: Buffer): Size | null {
  // 89 50 4E 47 ... IHDR の直後に幅・高さが 32bit BE で並ぶ
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

function fromGif(b: Buffer): Size | null {
  if (b.length < 10 || b.subarray(0, 3).toString("latin1") !== "GIF") return null;
  return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
}

function fromJpeg(b: Buffer): Size | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;

  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) { i++; continue; }        // マーカー境界を見失ったら詰める
    const marker = b[i + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    const len = b.readUInt16BE(i + 2);

    // SOF0-3 / 5-7 / 9-11 / 13-15 に寸法が入っている（DHT等は除く）
    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isSof) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    if (marker === 0xda) return null;             // 画像本体に入ったら諦める
    i += 2 + len;
  }
  return null;
}

function fromWebp(b: Buffer): Size | null {
  if (b.length < 30) return null;
  if (b.subarray(0, 4).toString("latin1") !== "RIFF") return null;
  if (b.subarray(8, 12).toString("latin1") !== "WEBP") return null;

  const chunk = b.subarray(12, 16).toString("latin1");

  if (chunk === "VP8X") {
    // 24bit LE で「実寸 - 1」
    return {
      w: (b[24] | (b[25] << 8) | (b[26] << 16)) + 1,
      h: (b[27] | (b[28] << 8) | (b[29] << 16)) + 1,
    };
  }
  if (chunk === "VP8 ") {
    return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

function readSize(b: Buffer): Size | null {
  return fromPng(b) ?? fromGif(b) ?? fromJpeg(b) ?? fromWebp(b);
}

/* ---- 取得 ---------------------------------------------------- */

async function head(url: string, bytes: number): Promise<Buffer | null> {
  const res = await fetch(url, { headers: { Range: `bytes=0-${bytes - 1}` } });
  if (!res.ok && res.status !== 206) return null;
  return Buffer.from(await res.arrayBuffer());
}

async function sizeOf(url: string): Promise<Size | null> {
  // まず先頭だけ。プログレッシブJPEGなどでSOFが遠い場合は全体を読み直す。
  const first = await head(url, 65536);
  if (first) {
    const s = readSize(first);
    if (s) return s;
  }

  const res = await fetch(url);
  if (!res.ok) return null;
  return readSize(Buffer.from(await res.arrayBuffer()));
}

/* ---- 本体 ---------------------------------------------------- */

async function main() {
  const { data, error } = await supabase
    .from("illustrations")
    .select("id,title,image_url,image_width,image_height")
    .order("id");

  if (error) {
    console.error("取得に失敗しました:", error.message);
    if (/image_width/.test(error.message)) {
      console.error(
        "\n先に supabase-add-image-size.sql を Supabase の SQL Editor で実行してください。"
      );
    }
    process.exit(1);
  }

  const rows = data ?? [];
  const todo = rows.filter((r) => !r.image_width || !r.image_height);

  console.log(`${rows.length} 件中 ${todo.length} 件に寸法が入っていません`);
  if (!todo.length) return;

  let ok = 0;
  let ng = 0;

  for (const row of todo) {
    try {
      const size = await sizeOf(row.image_url);
      if (!size || !size.w || !size.h) {
        console.warn(`⚠️ 寸法を読めません: 「${row.title}」`);
        ng++;
        continue;
      }

      const { error: upErr } = await supabase
        .from("illustrations")
        .update({ image_width: size.w, image_height: size.h })
        .eq("id", row.id);

      if (upErr) {
        console.error(`❌ DB: 「${row.title}」`, upErr.message);
        ng++;
      } else {
        console.log(`✅ ${row.title} — ${size.w} × ${size.h}`);
        ok++;
      }
    } catch (e) {
      console.error(`❌ 「${row.title}」`, e);
      ng++;
    }
  }

  console.log(`\n完了: 成功 ${ok} 件 / 失敗 ${ng} 件`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
