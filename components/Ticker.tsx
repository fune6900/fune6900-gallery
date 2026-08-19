/**
 * template-parts/ticker.php の移植 — 電光掲示板。
 *
 * 文字列は窓の右端の外から入ってくる（CSS の padding-left:100%）。
 * 半周期ずらした2本を重ねて、流れが途切れないようにしている。
 */
import { getCount, getFirstYear } from "@/lib/gallery";

export default async function Ticker() {
  const count = await getCount();
  const first = await getFirstYear();
  const msg = `NOW SHOWING /// ${count} WORKS ARCHIVED /// SINCE ${first || new Date().getUTCFullYear()} /// FUNE6900 /// ON AIR ///`;

  return (
    <div className="fg-ticker">
      <svg className="fg-boo" style={{ width: 26, height: 26, color: "var(--lime)", flex: "none" }} aria-hidden="true">
        <use href="#fg-i-boo" />
      </svg>
      <span className="fg-ticker__dot" aria-hidden="true" />
      <div className="fg-ticker__win" aria-hidden="true">
        <span className="fg-ticker__track">{msg}</span>
        <span className="fg-ticker__track fg-ticker__track--b">{msg}</span>
      </div>
    </div>
  );
}
