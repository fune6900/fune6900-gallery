"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { SITE_NAME } from "@/lib/site";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      // 「どちらが違うか」は明かさない（総当たりの手がかりになる）
      setError(
        "ログインに失敗しました。メールアドレスかパスワードが違います。",
      );
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="ad-login">
      <div className="ad-login__box">
        <p className="ad-login__brand">F6900</p>
        <div className="fg-shead fg-shead--sm" style={{ marginBlock: 14 }}>
          <div className="fg-shead__block">
            <p className="fg-shead__jp">管理ログイン</p>
            <p className="fg-shead__en">SIGN IN</p>
          </div>
        </div>

        <form className="ad-form" onSubmit={handleLogin}>
          <div>
            <label className="ad-field__label" htmlFor="lg-mail">
              メールアドレス
            </label>
            <input
              id="lg-mail"
              className="ad-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="ad-field__label" htmlFor="lg-pass">
              パスワード
            </label>
            <input
              id="lg-pass"
              className="ad-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="ad-field__error">{error}</p>}

          <button
            type="submit"
            className="fg-btn fg-btn--lime"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={loading}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <p className="ad-field__hint" style={{ marginTop: 18 }}>
          {SITE_NAME}
        </p>
      </div>
    </main>
  );
}
