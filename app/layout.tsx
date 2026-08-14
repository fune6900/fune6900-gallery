import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fune Gallery",
  description: "イラスト作品ギャラリー",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
