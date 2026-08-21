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
import { pad } from "@/lib/gallery";

export default function SiteHeader({
  paged = 1,
  pages = 1,
  isGallery = true,
  s = "",
}: {
  paged?: number;
  pages?: number;
  isGallery?: boolean;
  s?: string;
}) {
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
