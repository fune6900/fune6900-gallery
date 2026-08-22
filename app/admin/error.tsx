"use client";

import { useEffect } from "react";

// 管理画面で例外が出たときの受け皿。
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <main className="ad fg-wrap">
      <div className="ad__empty">
        <p style={{ fontWeight: 700, marginBottom: 12 }}>
          画面の読み込みに失敗しました
        </p>
        {error.digest && (
          <p className="ad__sub" style={{ marginBottom: 16 }}>
            ID: {error.digest}
          </p>
        )}
        <button type="button" className="fg-btn fg-btn--lime" onClick={reset}>
          もう一度試す
        </button>
      </div>
    </main>
  );
}
