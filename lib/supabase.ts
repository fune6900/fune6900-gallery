import { createClient } from "@supabase/supabase-js";

// 公開用（表側のギャラリー表示に使う。読み取り専用の想定）
// anonキーはブラウザに露出してよいキー。RLSで保護する。
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 管理用（サーバー側だけで使う。全権限を持つservice_roleキー）
// ★このキーは絶対にブラウザに出さない。API Route内でのみ使う。
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
