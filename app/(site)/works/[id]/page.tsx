/**
 * single-illustration.php の移植。
 * ライムの見出し（3段構え）→ 白カードの画像 7 : 黒パネル 5 →
 * ピル型の前後ナビ → 同時期の作品4件。
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import TvCard from "@/components/TvCard";
import { SITE_NAME } from "@/lib/site";
import {
  formatDate,
  getAdjacent,
  getRelated,
  getWork,
  pad,
} from "@/lib/gallery";
import type { Illustration } from "@/lib/types";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const work = await getWork(Number(id));
  // 旧テーマの document_title_parts フィルタと同じで、タブのタイトルは作品名。
  return work ? { title: `${work.title} | ${SITE_NAME}` } : {};
}

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const work = await getWork(Number(id));
  if (!work) notFound();

  const prev = await getAdjacent(work, "prev");
  const next = await getAdjacent(work, "next");
  const related = await getRelated(work, 4);
  const no = pad(work.id, 3);

  return (
    <>
      <SiteHeader />

      <main id="fg-main" className="fg-sec fg-wrap">
        <div
          className="fg-reveal"
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
            marginBottom: 26,
          }}
        >
          <div className="fg-shead" style={{ margin: 0 }}>
            <div className="fg-shead__block">
              <p className="fg-shead__jp jp-break">{work.title}</p>
              <p className="fg-shead__en">ILLUSTRATION</p>
              <p className="fg-shead__num">{no}</p>
              <div
                className="fg-drip"
                style={{ color: "var(--lime)" }}
                aria-hidden="true"
              >
                <svg>
                  <use href="#fg-i-drip" />
                </svg>
              </div>
            </div>
          </div>
          <a className="fg-back" href="/" style={{ marginBottom: 20 }}>
            &#9664; BACK TO GALLERY
          </a>
        </div>

        <div className="fg-detail">
          <figure className="fg-detail__fig" data-fg-lightbox={work.image_url}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={work.image_url}
              alt={work.title}
              width={work.image_width ?? undefined}
              height={work.image_height ?? undefined}
              loading="eager"
              fetchPriority="high"
            />
            <figcaption className="fg-detail__zoom">
              &#8981; CLICK TO ZOOM
            </figcaption>
          </figure>

          <div className="fg-detail__side">
            <div className="fg-panel fg-panel--lime">
              <p className="fg-panel__k">NO.</p>
              <p className="fg-panel__num">{no}</p>
              <h1 className="fg-panel__t jp-break">{work.title}</h1>
              {work.production_date && (
                <p className="fg-panel__d">
                  {formatDate(work.production_date)}
                </p>
              )}
            </div>

            {work.description && (
              <div className="fg-panel">
                <p className="fg-panel__k">DESCRIPTION</p>
                <div className="fg-panel__body jp-break">
                  {work.description.split(/\n{2,}/).map((para, i) => (
                    <p key={i}>
                      {para.split("\n").map((line, j, all) => (
                        <span key={j}>
                          {line}
                          {j < all.length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="fg-panel">
              <p className="fg-panel__k">DATA</p>
              <p className="fg-panel__data">
                NO &mdash; <b>{no}</b>
                <br />
                {work.production_date && (
                  <>
                    DATE &mdash; <b>{formatDate(work.production_date)}</b>
                    <br />
                  </>
                )}
                {work.image_width && work.image_height && (
                  <>
                    SIZE &mdash;{" "}
                    <b>
                      {work.image_width} × {work.image_height}
                    </b>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {(prev || next) && (
          <nav className="fg-pn" aria-label="前後の作品">
            {prev && <PnLink work={prev} dir="prev" />}
            {next && <PnLink work={next} dir="next" />}
          </nav>
        )}

        {related.length > 0 && (
          <>
            <div
              className="fg-shead fg-shead--sm fg-reveal"
              style={{ marginTop: 52 }}
            >
              <div className="fg-shead__block">
                <p className="fg-shead__jp jp-break">同時期の作品</p>
                <p className="fg-shead__en">RELATED</p>
              </div>
            </div>

            <div className="fg-grid fg-grid--narrow">
              {related.map((rel, n) => (
                <TvCard
                  key={rel.id}
                  work={rel}
                  index={n}
                  channel={n + 1}
                  plain
                />
              ))}
            </div>
          </>
        )}
      </main>

      <SiteFooter />
    </>
  );
}

function PnLink({ work, dir }: { work: Illustration; dir: "prev" | "next" }) {
  return (
    <a
      className={`fg-pn__link ${dir === "next" ? "fg-pn__link--next" : ""}`}
      href={`/works/${work.id}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={work.image_url} alt="" loading="lazy" />
      <span>
        <em>{dir === "next" ? "NEXT ▶" : "◀ PREV"}</em>
        <b>{work.title}</b>
      </span>
    </a>
  );
}
