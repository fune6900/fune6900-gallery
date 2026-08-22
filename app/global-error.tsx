"use client";

/**
 * ルートレイアウトごと落ちたときの最後の受け皿。
 *
 * ここはレイアウトの外側なので <html> と <body> を自分で書く必要があり、
 * テーマCSSも読めない。素のスタイルで最低限だけ出す。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#efefef",
          color: "#000",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>SIGNAL LOST</h1>
          <p style={{ margin: "0 0 20px", color: "#787878" }}>
            画面の読み込みに失敗しました。
            {error.digest && (
              <>
                <br />
                <small>ID: {error.digest}</small>
              </>
            )}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "12px 28px",
              border: 0,
              borderRadius: 999,
              background: "#000",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            もう一度読み込む
          </button>
        </div>
      </body>
    </html>
  );
}
