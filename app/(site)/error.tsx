"use client";

import { useEffect } from "react";

/**
 * 表側で例外が出たときの受け皿。
 * 404（not-found.tsx）と同じ「SIGNAL LOST」の言い回しに揃えてある。
 */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 詳細はブラウザのコンソールにだけ出す。画面には出さない。
    console.error("[site]", error);
  }, [error]);

  return (
    <main id="fg-main" className="fg-wrap">
      <section className="fg-lost">
        <div className="fg-lost__static" aria-hidden="true" />
        <div className="fg-lost__in">
          <h1 className="fg-lost__t fg-neon">SIGNAL LOST</h1>
          <p className="fg-lost__s">
            受信に失敗しました
            {error.digest ? ` — ID: ${error.digest}` : ""}
          </p>
          <button type="button" className="fg-btn fg-btn--lime" onClick={reset}>
            &#9654; もう一度試す
          </button>
        </div>
      </section>
    </main>
  );
}
