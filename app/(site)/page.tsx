/**
 * front-page.php と search.php の移植。
 *
 * WordPress では検索時だけ別テンプレート（search.php）に切り替わり、
 * ヒーロー・電光掲示板・計器帯が出ない。その分岐をここで再現している。
 */
import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import { SITE_NAME } from "@/lib/site";
import Controls from "@/components/Controls";
import GalleryGrid from "@/components/GalleryGrid";
import Hero from "@/components/Hero";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import Stats from "@/components/Stats";
import Ticker from "@/components/Ticker";
import {
  galleryUrl, getGalleryPage, getLatest, pad, readParams, type GalleryParams,
} from "@/lib/gallery";

// 追加した作品が反映されるよう、60秒ごとに再生成する
export const revalidate = 60;

type SP = Record<string, string | string[] | undefined>;

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const params = readParams(sp);

  // SHUFFLE は seed を URL に固定してからでないと、ページを跨いだときに
  // 同じ作品が重複して出る。seed が無ければ振ってリダイレクトする。
  if (params.sort === "rand" && !params.seed) {
    const seed = Math.floor(Math.random() * 99999) + 1;
    redirect(galleryUrl({ ...params, seed }, {}));
  }

  const page = await getGalleryPage(params);
  const cube = await getLatest(6);
  const isSearch = params.s !== "";
  const onFirstPage = page.paged === 1;

  return (
    <>
      <SiteHeader paged={page.paged} pages={page.pages} s={params.s} />

      <main id="fg-main">
        {!isSearch && onFirstPage && (
          <>
            <Hero cube={cube} />
            <Ticker />
            <div className="fg-film" aria-hidden="true" />
            <Stats onAir={page.works.length} paged={page.paged} pages={page.pages} />
          </>
        )}

        <Controls params={params} />

        <section className="fg-sec fg-bleed" id={isSearch ? undefined : "fg-gallery"}>
          {isSearch ? (
            <SearchHead params={params} total={page.total} paged={page.paged} pages={page.pages} />
          ) : (
            <GalleryHead params={params} total={page.total} paged={page.paged} pages={page.pages}
                         onFirstPage={onFirstPage} />
          )}

          {page.works.length > 0 ? (
            <GalleryGrid works={page.works} params={params} paged={page.paged} pages={page.pages} />
          ) : (
            <Empty params={params} isSearch={isSearch} />
          )}
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

/* ---- 見出し（front-page.php）------------------------------- */

function GalleryHead({
  params, total, paged, pages, onFirstPage,
}: {
  params: GalleryParams; total: number; paged: number; pages: number; onFirstPage: boolean;
}) {
  return (
    // 見出し・ラベル・計器はそれぞれ別の方向から出す
    <div style={{ display: "flex", alignItems: "flex-end", gap: 26, flexWrap: "wrap", marginBottom: 26 }}>
      <div className="fg-shead fg-reveal fg-reveal--left" style={{ margin: 0 }}>
        <div className="fg-shead__block">
          <p className="fg-shead__jp jp-break">ギャラリー</p>
          <p className="fg-shead__en">GALLERY</p>
          <p className="fg-shead__num">01</p>
          <div className="fg-drip" style={{ color: "var(--lime)" }} aria-hidden="true">
            <svg><use href="#fg-i-drip" /></svg>
          </div>
        </div>
      </div>

      {/* VHS のラベルシール */}
      <div className="fg-sticker fg-sticker--tape fg-reveal fg-reveal--spin"
           style={{ padding: "12px 22px", marginBottom: 16, ["--in-delay"]: "120ms" } as CSSProperties}>
        <span className="fg-sticker__k">ARCHIVE / VOL.01</span>
        <span style={{ fontSize: 15, fontWeight: 900 }}>{SITE_NAME}</span>
      </div>

      {onFirstPage && params.s === "" && !params.year && (
        <span className="fg-sticker fg-sticker--lime fg-reveal fg-reveal--pop"
              style={{ marginBottom: 22, transform: "rotate(5deg)", ["--in-delay"]: "260ms" } as CSSProperties}>
          NEW ARRIVAL
        </span>
      )}

      <div className="fg-gauge fg-reveal fg-reveal--right"
           style={{ marginLeft: "auto", marginBottom: 20, ["--in-delay"]: "180ms" } as CSSProperties}>
        <span>SIGNALS</span><b>{total}</b>
        <div className="fg-bar" data-bar={Math.round((paged / pages) * 100)}><i /></div>
        <span>PAGE {pad(paged, 2)} / {pad(pages, 2)}</span>
        <span className="fg-meter fg-meter--live" aria-hidden="true">
          <i className="on" /><i className="on" /><i /><i className="on" /><i /><i />
        </span>
      </div>
    </div>
  );
}

/* ---- 見出し（search.php）----------------------------------- */

function SearchHead({
  params, total, paged, pages,
}: {
  params: GalleryParams; total: number; paged: number; pages: number;
}) {
  return (
    <div className="fg-reveal"
         style={{ display: "flex", alignItems: "flex-end", gap: 26, flexWrap: "wrap", marginBottom: 26 }}>
      <div className="fg-shead" style={{ margin: 0 }}>
        <div className="fg-shead__block">
          <p className="fg-shead__jp jp-break"><span className="fg-term">{params.s}</span></p>
          <p className="fg-shead__en">SEARCH</p>
          <p className="fg-shead__num">{pad(total, 3)}</p>
          <div className="fg-drip" style={{ color: "var(--lime)" }} aria-hidden="true">
            <svg><use href="#fg-i-drip" /></svg>
          </div>
        </div>
      </div>

      <div className="fg-gauge" style={{ marginLeft: "auto", marginBottom: 20 }}>
        <span>RECEIVED</span><b>{total}</b>
        <div className="fg-bar" data-bar={Math.round((paged / pages) * 100)}><i /></div>
        <span>PAGE {pad(paged, 2)} / {pad(pages, 2)}</span>
      </div>
    </div>
  );
}

/* ---- 0件 ---------------------------------------------------- */

function Empty({ params, isSearch }: { params: GalleryParams; isSearch: boolean }) {
  return (
    <div className="fg-empty">
      <div className="fg-static-tv" aria-hidden="true" />
      <p className="fg-empty__t">NO SIGNAL</p>
      <p className="fg-empty__s">
        {isSearch
          ? "該当する作品が見つかりませんでした"
          : params.year
            ? "この年の作品はありません"
            : "まだイラストが投稿されていません"}
      </p>
      {isSearch ? (
        <a className="fg-btn fg-btn--lime" href="/">&#9654; 検索条件をリセット</a>
      ) : params.year ? (
        <a className="fg-btn fg-btn--lime" href={galleryUrl(params, { y: null })}>&#9654; すべて表示</a>
      ) : null}
    </div>
  );
}
