/**
 * header.php の移植。
 *
 * 読み込みイントロ → SVGスプライト → ヘッダー → 検索バー →
 * モバイルメニュー → 右端の縦ナビ、の順。
 *
 * 操作（バーガー・検索の開閉）は旧テーマと同じく FgRuntime 側の
 * DOM スクリプトが受け持つので、ここは素のマークアップだけ出す。
 */
import SvgSprite from "./SvgSprite";
import { SITE_NAME } from "@/lib/site";
import { galleryUrl, getYears, pad, type GalleryParams } from "@/lib/gallery";

const SORTS: Array<[GalleryParams["sort"], string]> = [
  ["new", "新しい順"],
  ["old", "古い順"],
];

// 作品ページや404から検索パネルを開いたときの既定値
const NO_FILTER: GalleryParams = { s: "", year: 0, sort: "new", paged: 1 };

export default async function SiteHeader({
  paged = 1,
  pages = 1,
  isGallery = true,
  params = NO_FILTER,
}: {
  paged?: number;
  pages?: number;
  isGallery?: boolean;
  /** 検索パネルに出す絞り込みの現在値。一覧以外では既定値でよい */
  params?: GalleryParams;
}) {
  const s = params.s;
  const years = await getYears();

  return (
    <>
      <a className="skip-link" href="#fg-main">
        本文へスキップ
      </a>

      {/* 読み込みイントロ。砂嵐 → チャンネルが合う → 画面が開く */}
      <div className="fg-intro" id="fg-intro" aria-hidden="true">
        <div className="fg-intro__static" />
        <div className="fg-intro__roll" />
        <div className="fg-intro__scan" />
        <div className="fg-intro__hud">
          <span className="fg-intro__ch" id="fg-intro-ch">
            CH.00
          </span>
          <div className="fg-intro__bar">
            <i />
          </div>
          <span className="fg-intro__msg" id="fg-intro-msg">
            NO SIGNAL
          </span>
        </div>
      </div>

      <SvgSprite />

      <header className="fg-header">
        <a className="fg-header__brand" href="/">
          F6900<small>{SITE_NAME}</small>
        </a>

        <nav className="fg-header__nav" aria-label="メインメニュー">
          <a
            className={`fg-pill ${isGallery ? "fg-pill--on" : "fg-pill--ghost"}`}
            href="/"
          >
            ギャラリー
          </a>
        </nav>

        <span className="fg-header__sp" />

        <a className="fg-pill fg-pill--lime" href="#fg-gallery">
          作品を見る
        </a>

        <button
          className="fg-header__icon"
          type="button"
          aria-expanded="false"
          aria-controls="fg-searchbar"
          aria-label="検索を開く"
        >
          &#8981;
        </button>

        <button
          className="fg-burger"
          type="button"
          aria-expanded="false"
          aria-controls="fg-menu"
          aria-label="メニュー"
        >
          <span />
          <span />
        </button>
      </header>

      {/* ヘッダーの検索アイコンから降りてくるフォーム */}
      <div className="fg-searchbar" id="fg-searchbar">
        <form role="search" method="get" action="/">
          {params.year > 0 && (
            <input type="hidden" name="y" value={params.year} />
          )}
          {params.sort !== "new" && (
            <input type="hidden" name="sort" value={params.sort} />
          )}
          <label className="fg-field fg-field--wide">
            <span aria-hidden="true">&#8981;</span>
            <span className="screen-reader-text">作品を検索</span>
            <input
              type="search"
              name="s"
              defaultValue={s}
              placeholder="SEARCH..."
              autoComplete="off"
            />
          </label>
        </form>

        {/*
          年と並び替え。SPではページ側のコントロールバーが固定表示ではなくなるので、
          スクロールした先からでも触れるようにここに置いてある。
          PCはコントロールバーが出たままなので CSS で隠している。
        */}
        {years.length > 0 && (
          <div className="fg-searchbar__opts">
            <span className="fg-searchbar__label">YEAR</span>
            <div className="fg-chips">
              <a
                className={`fg-chip ${params.year ? "" : "is-on"}`}
                href={galleryUrl(params, { y: null })}
              >
                ALL
              </a>
              {years.map((y) => (
                <a
                  key={y}
                  className={`fg-chip ${params.year === y ? "is-on" : ""}`}
                  href={galleryUrl(params, { y })}
                >
                  {y}
                </a>
              ))}
            </div>

            <form method="get" action="/">
              {params.s !== "" && (
                <input type="hidden" name="s" value={params.s} />
              )}
              {params.year > 0 && (
                <input type="hidden" name="y" value={params.year} />
              )}
              <label className="screen-reader-text" htmlFor="fg-sort-head">
                並び替え
              </label>
              <select
                className="fg-select"
                name="sort"
                id="fg-sort-head"
                defaultValue={params.sort}
                data-fg-autosubmit
              >
                {SORTS.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <noscript>
                <button className="fg-chip" type="submit">
                  OK
                </button>
              </noscript>
            </form>
          </div>
        )}
      </div>

      {/* モバイル用の全画面メニュー。ヘッダーより下の層に敷いてある */}
      <nav className="fg-menu" id="fg-menu" aria-label="モバイルメニュー">
        <a className="fg-menu__link" href="/">
          <span aria-hidden="true">01</span>ギャラリー
        </a>
        <form className="fg-menu__search" role="search" method="get" action="/">
          <label className="fg-field fg-field--wide">
            <span aria-hidden="true">&#8981;</span>
            <span className="screen-reader-text">作品を検索</span>
            <input
              type="search"
              name="s"
              defaultValue={s}
              placeholder="SEARCH..."
              autoComplete="off"
            />
          </label>
        </form>
      </nav>

      {/* 右端の縦ピルナビ。純粋な装飾なので支援技術からは隠す */}
      <div className="fg-sidenav" id="fg-sidenav" aria-hidden="true">
        <i>&#9198;</i>
        <b data-fg-roll>{pad(Math.max(1, paged), 2)}</b>
        <i>&#9197;</i>
        <span data-fg-roll>{pad(Math.max(1, pages), 2)}</span>
        <div className="fg-sidenav__prog">
          <i />
        </div>
      </div>
    </>
  );
}
