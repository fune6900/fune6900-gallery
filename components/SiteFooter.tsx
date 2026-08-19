/**
 * footer.php の移植。フッター本体 + ライトボックス + 併走マスコット +
 * ページ遷移の CRT 演出まで（旧テーマも footer.php に置いていた）。
 */
import { SITE_NAME } from "@/lib/site";
import { getCount, getLastUpdated, pad } from "@/lib/gallery";

export default async function SiteFooter() {
  const count = await getCount();
  const updated = await getLastUpdated();

  return (
    <>
      <footer className="fg-footer">
        <div className="fg-wrap">
          <div className="fg-footer__in">
            <div className="fg-footer__id">
              <svg className="fg-boo" style={{ width: 74, height: 74, color: "#fff", flex: "none" }} aria-hidden="true">
                <use href="#fg-i-boo" />
              </svg>
              <div>
                {/* 暗い面なのでネオンが成立する */}
                <div className="fg-footer__logo fg-neon">{SITE_NAME}</div>
                <div className="fg-neon-tube" style={{ width: 150, margin: "8px 0 10px" }} />
                <p className="fg-footer__meta">
                  作品数 <b>{pad(count, 3)}</b> 件<br />
                  最終更新 <b>{updated}</b>
                </p>
              </div>
            </div>

            <div className="fg-footer__gear">
              <span className="fg-grille" style={{ width: 120, height: 38 }} aria-hidden="true" />
              <span className="fg-meter fg-meter--dark fg-meter--live" aria-hidden="true">
                <i className="on" /><i className="on" /><i /><i className="on" /><i /><i />
              </span>
              <nav className="fg-footer__nav" aria-label="フッターメニュー">
                <a className="fg-pill fg-pill--ghost" href="/">ギャラリー</a>
                <a className="fg-pill fg-pill--lime" href="#top">&#9650; TOP</a>
              </nav>
            </div>

            {/* 黒地なので、抜き色を地の色に合わせる */}
            <svg className="fg-decal"
                 style={{ right: "29%", bottom: 14, width: 180, height: 99, color: "#e8e8e8",
                          ["--cut" as string]: "var(--ink)", opacity: 0.16, transform: "rotate(-6deg)" }}
                 aria-hidden="true">
              <use href="#fg-i-sneaker" />
            </svg>
          </div>

          <div className="fg-footer__btm">
            <span>&copy; {new Date().getUTCFullYear()} {SITE_NAME}</span>
            <span>{pad(count, 3)} WORKS ARCHIVED</span>
          </div>
        </div>
      </footer>

      {/* 拡大表示。中身は FgRuntime が差し込む */}
      <div className="fg-lb" id="fg-lightbox" role="dialog" aria-modal="true" aria-label="拡大表示">
        <button className="fg-lb__close" type="button" id="fg-lightbox-close" aria-label="閉じる">&#10005;</button>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img id="fg-lightbox-img" src="" alt="" />
        <p className="fg-lb__hint">ESC / 背景クリックで閉じる</p>
      </div>

      {/* ギャラリーを見ているあいだだけ併走するマスコット */}
      <div className="fg-rider" id="fg-rider" aria-hidden="true">
        <svg><use href="#fg-i-boo" /></svg>
      </div>

      {/* ページ遷移時の「テレビの電源が切れる」演出 */}
      <div className="fg-crt" id="fg-crt" aria-hidden="true"><div className="fg-crt__flash" /></div>
    </>
  );
}
