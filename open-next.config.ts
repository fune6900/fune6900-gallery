/**
 * OpenNext（Cloudflare アダプタ）の設定。
 *
 * ISR を使っているルートがあるので、その置き場とキューを指定する。
 *   app/(site)/works/[id]/page.tsx  revalidate = 60
 *   app/sitemap.ts                  revalidate = 60
 *
 * 指定しないと、Workers 上では再検証の結果を持ち回る先が無く
 * 毎リクエスト Supabase を叩くことになる。
 */
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

export default defineCloudflareConfig({
  // キャッシュ実体は R2（wrangler.jsonc の NEXT_INC_CACHE_R2_BUCKET）。
  // KV は結果整合なので OpenNext 側も非推奨としている。
  incrementalCache: r2IncrementalCache,

  // 時間ベースの再検証をさばくキュー。Durable Object で動く。
  // revalidateTag / revalidatePath は使っていないので tag cache（D1）は要らない。
  queue: doQueue,
});
