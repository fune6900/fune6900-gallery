/**
 * template-parts/controls.php の移植 — 年で絞る / 並び替える / 検索する。
 *
 * 素のリンクと GET フォームなので JS 無しでも動く。JS は並び替えの
 * 自動送信を上乗せしているだけ（data-fg-autosubmit）。
 */
import { galleryUrl, getYears, type GalleryParams } from "@/lib/gallery";

const SORTS: Array<[GalleryParams["sort"], string]> = [
  ["new", "新しい順"],
  ["old", "古い順"],
  ["rand", "SHUFFLE"],
];

export default async function Controls({ params }: { params: GalleryParams }) {
  const years = await getYears();

  return (
    <div className="fg-controls">
      <div className="fg-bleed fg-controls__in">
        <span className="fg-knob" aria-hidden="true" />

        {years.length > 0 && (
          <>
            <span className="fg-controls__label">YEAR</span>
            <div className="fg-chips">
              <a className={`fg-chip ${params.year ? "" : "is-on"}`}
                 href={galleryUrl(params, { y: null })}>ALL</a>

              {years.map((y) => (
                <a key={y} className={`fg-chip ${params.year === y ? "is-on" : ""}`}
                   href={galleryUrl(params, { y })}>{y}</a>
              ))}
            </div>
            <span className="fg-meter fg-meter--live" aria-hidden="true">
              <i className="on" /><i className="on" /><i className="on" /><i /><i /><i />
            </span>
          </>
        )}

        <span className="fg-controls__sp" />

        <form method="get" action="/">
          {/* 他の絞り込みをフォーム送信に持ち越す */}
          {params.s !== "" && <input type="hidden" name="s" value={params.s} />}
          {params.year > 0 && <input type="hidden" name="y" value={params.year} />}

          <label className="screen-reader-text" htmlFor="fg-sort">並び替え</label>
          <select className="fg-select" name="sort" id="fg-sort" defaultValue={params.sort} data-fg-autosubmit>
            {SORTS.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <noscript><button className="fg-chip" type="submit">OK</button></noscript>
        </form>

        <form role="search" method="get" action="/">
          {params.year > 0 && <input type="hidden" name="y" value={params.year} />}
          {params.sort !== "new" && <input type="hidden" name="sort" value={params.sort} />}

          <label className="fg-field">
            <span aria-hidden="true">&#8981;</span>
            <span className="screen-reader-text">作品を検索</span>
            <input type="search" name="s" defaultValue={params.s} placeholder="SEARCH..." autoComplete="off" />
          </label>
        </form>
      </div>
    </div>
  );
}
