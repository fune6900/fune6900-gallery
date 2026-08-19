/**
 * template-parts/stats.php の移植 — 計器帯。
 * 数字は画面に入ったところで 0 から数え上がる（FgRuntime の countUp）。
 */
import type { CSSProperties } from "react";
import {
  getCount, getCountInYear, getFirstYear, getLastUpdated, getSpanYears, getYears, pad,
} from "@/lib/gallery";

const delay = (ms: number) => ({ ["--in-delay"]: `${ms}ms` } as CSSProperties);

// バーの割合。0 除算を避ける
function pct(part: number, whole: number): number {
  return whole > 0 ? Math.min(100, Math.round((part / whole) * 100)) : 0;
}

export default async function Stats({
  onAir,
  paged,
  pages,
}: {
  onAir: number;
  paged: number;
  pages: number;
}) {
  const total = await getCount();
  const span = await getSpanYears();
  const first = await getFirstYear();
  const years = await getYears();
  const updated = await getLastUpdated();

  // 今年の点数を出したいが、年明け直後などまだ0点のことがある。
  // その場合は作品のある直近の年に切り替える（0 を大きく出しても情報にならない）。
  let yearKey = new Date().getUTCFullYear();
  let thisYear = await getCountInYear(yearKey);

  if (thisYear === 0 && years.length) {
    yearKey = Math.max(...years);
    thisYear = await getCountInYear(yearKey);
  }

  const yearLabel = new Date().getUTCFullYear() === yearKey ? "THIS YEAR" : "LATEST YEAR";

  return (
    <div className="fg-bleed fg-stats">
      <div className="fg-stat fg-reveal fg-reveal--up" style={delay(0)}>
        <p className="fg-stat__k">TOTAL WORKS</p>
        <p className="fg-stat__v" data-count={total}>0</p>
        <div className="fg-stat__foot">
          <div className="fg-bar" data-bar="100"><i /></div>
          <span className="fg-stat__note">ALL</span>
        </div>
      </div>

      <div className="fg-stat fg-stat--lime fg-reveal fg-reveal--diag" style={delay(80)}>
        <p className="fg-stat__k">{yearLabel}</p>
        <p className="fg-stat__v" data-count={thisYear}><span>0</span><small>件</small></p>
        <div className="fg-stat__foot">
          <div className="fg-bar" data-bar={pct(thisYear, total)}><i /></div>
          <span className="fg-stat__note">{yearKey}</span>
        </div>
      </div>

      <div className="fg-stat fg-reveal fg-reveal--up" style={delay(160)}>
        <p className="fg-stat__k">ARCHIVE SPAN</p>
        <p className="fg-stat__v" data-count={span}><span>0</span><small>年</small></p>
        <div className="fg-stat__foot">
          <div className="fg-bar" data-bar={Math.min(100, span * 12)}><i /></div>
          <span className="fg-stat__note">{first ? `SINCE ${first}` : "—"}</span>
        </div>
      </div>

      <div className="fg-stat fg-stat--ink fg-reveal fg-reveal--down" style={delay(240)}>
        <p className="fg-stat__k">LAST UPDATE</p>
        <p className="fg-stat__v">{updated.length >= 10 ? updated.slice(5) : updated}</p>
        <div className="fg-stat__foot">
          <span className="fg-meter fg-meter--dark fg-meter--live" aria-hidden="true">
            <i className="on" /><i className="on" /><i /><i className="on" /><i /><i />
          </span>
          <span className="fg-stat__note">{updated.slice(0, 4)}</span>
        </div>
      </div>

      <div className="fg-stat fg-reveal fg-reveal--right" style={delay(320)}>
        <p className="fg-stat__k">ON AIR</p>
        <p className="fg-stat__v" data-count={onAir}><span>0</span><small>ch</small></p>
        <div className="fg-stat__foot">
          <div className="fg-bar" data-bar={pct(paged, pages)}><i /></div>
          <span className="fg-stat__note">PAGE {pad(paged, 2)} / {pad(pages, 2)}</span>
        </div>
      </div>
    </div>
  );
}
