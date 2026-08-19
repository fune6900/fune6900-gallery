/** 404.php の移植 — SIGNAL LOST。 */
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

export default function SignalLost() {
  return (
    <>
      <SiteHeader isGallery={false} />

      <main id="fg-main" className="fg-wrap">
        <section className="fg-lost">
          <div className="fg-lost__static" aria-hidden="true" />

          <div className="fg-lost__in">
            <svg className="fg-boo" style={{ width: 78, height: 78, color: "#fff", margin: "0 auto 18px" }}
                 aria-hidden="true"><use href="#fg-i-boo" /></svg>
            <h1 className="fg-lost__t fg-neon">SIGNAL LOST</h1>
            <p className="fg-lost__s">CH.404 &mdash; 電波を受信できません</p>
            <a className="fg-btn fg-btn--lime" href="/">&#9654; ギャラリーへ戻る</a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
