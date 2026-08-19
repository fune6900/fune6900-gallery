/**
 * fune_gallery_tv_card() の移植 — ギャラリーのカード1枚。
 *
 * 行数・列数は画像の比から計算してインラインで渡す。ここを渡し忘れると
 * カードが1行ぶんに潰れる（DESIGN.md 5章）。
 */
import type { CSSProperties } from "react";
import type { Illustration } from "@/lib/types";
import { formatDate, pad, tvGeometry, tvJitter } from "@/lib/gallery";

export default function TvCard({
  work,
  index,
  channel,
  plain = false,
}: {
  work: Illustration;
  index: number;
  channel: number;
  /** 大きい「見せ札」にしない（関連作品など）。行数は同じく比から求める。 */
  plain?: boolean;
}) {
  const geo = tvGeometry(index, work, plain);

  const style = {
    ...tvJitter(work.id),
    gridColumn: `span ${geo.cols}`,
    gridRow: `span ${geo.rows}`,
  } as CSSProperties;

  const year = work.production_date ? work.production_date.slice(0, 4) : "";

  return (
    <a className={`fg-tv ${geo.className}`} style={style} href={`/works/${work.id}`}>
      <span className="fg-tv__img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={work.image_url}
          alt={work.title}
          width={work.image_width ?? undefined}
          height={work.image_height ?? undefined}
          // 最初の行は画面に入っているので先に読ませる
          loading={index < 4 ? "eager" : "lazy"}
          fetchPriority={index < 4 ? "high" : undefined}
        />
      </span>
      <span className="fg-tv__line" aria-hidden="true" />
      <span className="fg-tv__ch" aria-hidden="true">CH.{pad(channel, 2)}</span>
      {year && <span className="fg-tv__yr" aria-hidden="true">{year}</span>}
      <span className="fg-tv__cap">
        <span>
          <b className="jp-break">{work.title}</b>
          <i>
            NO.{pad(work.id, 3)}
            {work.production_date && <>&nbsp;/&nbsp;{formatDate(work.production_date)}</>}
          </i>
        </span>
        <span className="fg-meter fg-meter--dark fg-meter--live" aria-hidden="true">
          <i className="on" /><i className="on" /><i /><i className="on" /><i /><i />
        </span>
      </span>
    </a>
  );
}
