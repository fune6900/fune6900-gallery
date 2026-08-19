/**
 * fune_gallery_pagination() の移植。
 *
 * ページ送りをビデオデッキのトランスポートに見立てる。PREV / NEXT は
 * REW / FF、現在地は固定の PLAY。クラス名は paginate_links() の生出力
 * （.page-numbers / .current / .dots / .prev / .next）に合わせてある。
 *
 * 出す番号の選び方は paginate_links( mid_size:1, end_size:1 ) と同じ。
 */
import { galleryUrl, type GalleryParams } from "@/lib/gallery";

const MID_SIZE = 1;
const END_SIZE = 1;

export default function Pager({
  params,
  paged,
  pages,
}: {
  params: GalleryParams;
  paged: number;
  pages: number;
}) {
  if (pages <= 1) return null;

  const href = (n: number) => galleryUrl(params, { paged: n > 1 ? n : null });

  const items: React.ReactNode[] = [];

  if (paged > 1) {
    items.push(
      <a key="prev" className="prev page-numbers" href={href(paged - 1)}>
        <span aria-hidden="true">&#9664;&#9664;</span><em>REW</em>
      </a>
    );
  }

  let dots = false;
  for (let n = 1; n <= pages; n++) {
    if (n === paged) {
      items.push(
        <span key={n} aria-current="page" className="page-numbers current">{n}</span>
      );
      dots = true;
    } else if (n <= END_SIZE || (n >= paged - MID_SIZE && n <= paged + MID_SIZE) || n > pages - END_SIZE) {
      items.push(<a key={n} className="page-numbers" href={href(n)}>{n}</a>);
      dots = true;
    } else if (dots) {
      items.push(<span key={`d${n}`} className="page-numbers dots">&hellip;</span>);
      dots = false;
    }
  }

  if (paged < pages) {
    items.push(
      <a key="next" className="next page-numbers" href={href(paged + 1)}>
        <span aria-hidden="true">&#9654;&#9654;</span><em>FF</em>
      </a>
    );
  }

  return (
    <nav className="fg-pager" aria-label="ページ送り">
      {items}
      <span className="fg-pager__play" aria-hidden="true"><span>&#9654;</span><em>PLAY</em></span>
    </nav>
  );
}
