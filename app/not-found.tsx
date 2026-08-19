/**
 * どのルートにも当たらなかったときの 404。
 * ルートレイアウト直下なので、表側のCSSとJSはここで自分で読み込む。
 */
import Script from "next/script";
import SignalLost from "@/components/SignalLost";
import "./fune-gallery.css";

export default function NotFound() {
  return (
    <>
      <SignalLost />
      <Script src="/fune-gallery.js" strategy="afterInteractive" />
    </>
  );
}
