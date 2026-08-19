import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// サーバーコンポーネント/API内で、今ログインしているユーザーを取得する。
// 管理画面やAPIで「ログインしているか」を確認するのに使う。
export async function getServerUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component から呼ばれた場合は無視（middlewareで更新される）
          }
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// ログインしていなければエラーを投げる（API保護用）
export async function requireUser() {
  const user = await getServerUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
