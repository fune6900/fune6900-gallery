/**
 * template-parts/gallery-grid.php の移植。
 * チャンネル番号はページを跨いでも 01 に戻らず続けて振る。
 */
import type { Illustration } from "@/lib/types";
import Pager from "./Pager";
import TvCard from "./TvCard";
import { PER_PAGE, type GalleryParams } from "@/lib/gallery";

export default function GalleryGrid({
  works,
  params,
  paged,
  pages,
}: {
  works: Illustration[];
  params: GalleryParams;
  paged: number;
  pages: number;
}) {
  const offset = (paged - 1) * PER_PAGE;

  return (
    <>
      <div className="fg-grid">
        {works.map((work, i) => (
          <TvCard key={work.id} work={work} index={i} channel={offset + i + 1} />
        ))}
      </div>
      <Pager params={params} paged={paged} pages={pages} />
    </>
  );
}
