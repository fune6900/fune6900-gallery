"use client";

import { createBrowserClient } from "@supabase/ssr";

// ブラウザ側で認証状態を扱うためのクライアント。
// ログイン・ログアウト・セッション確認に使う。
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
