import Image from "next/image";
import type { Illustration } from "@/lib/types";

/**
 * 作品画像。next/image を通して、表示サイズに見合った大きさに縮めて配信する。
 *
 * R2 に入っているのは原寸（4000〜7000px、1枚20MB超のものもある）で、
 * カードの実表示は 280px 前後しかない。原寸のまま出すと 1ページで 96MB を
 * 読み込むことになり、デコードでメインスレッドが止まる。
 *
 * 旧WordPressテーマも同じ理由で `fune-gallery-thumb`(600w) と `large`(1024w) を
 * 使い分けていた。移行時にURLを1本に集約したせいで、その使い分けが落ちていた。
 *
 * `sizes` は呼び出し側が実際のレイアウト幅を渡す。ここを間違えると
 * 必要より大きい画像が選ばれるので、CSSの列数と対応させること。
 */

// 実寸が入っていない行のための代替値（srcset の生成にしか使われない。
// 表示サイズは CSS が width/height:100% で上書きする）
const FALLBACK_W = 1200;
const FALLBACK_H = 900;

interface WorkImageProps {
  work: Illustration;
  /** 実際の表示幅。CSSの列数に対応させる */
  sizes: string;
  /** 既定は作品タイトル。装飾目的なら "" を渡す */
  alt?: string;
  /** 初期表示に入るものだけ true */
  priority?: boolean;
}

export function WorkImage({
  work,
  sizes,
  alt,
  priority = false,
}: WorkImageProps) {
  return (
    <Image
      src={work.image_url}
      alt={alt ?? work.title}
      width={work.image_width ?? FALLBACK_W}
      height={work.image_height ?? FALLBACK_H}
      sizes={sizes}
      priority={priority}
    />
  );
}

/* -------------------------------------------------------------
 *  レイアウトごとの sizes
 *  値は _gallery.scss の --cols と対応させてある
 * ----------------------------------------------------------- */

// 全幅グリッド 1列ぶん（767:2 / 1099:3 / 1399:4 / 1699:5 / 2199:6 / それ以上:7列）
export const SIZES_CARD =
  "(max-width: 767px) 50vw, (max-width: 1099px) 33vw, (max-width: 1399px) 25vw, (max-width: 1699px) 20vw, (max-width: 2199px) 17vw, 14vw";

// 2列ぶん使う「見せ札」
export const SIZES_CARD_FEATURE =
  "(max-width: 767px) 100vw, (max-width: 1099px) 66vw, (max-width: 1399px) 50vw, (max-width: 1699px) 40vw, (max-width: 2199px) 34vw, 28vw";

// 関連作品（.fg-grid--narrow は 4列。親の .fg-wrap は最大1500px）
export const SIZES_CARD_NARROW =
  "(max-width: 767px) 50vw, (max-width: 1099px) 33vw, 375px";

// 作品詳細の主画像（.fg-detail は 7fr:5fr。991px 以下で1カラムに落ちる）
export const SIZES_DETAIL = "(max-width: 991px) 100vw, 820px";

// ヒーローの3Dキューブの面（--s: 210px 固定）
export const SIZES_CUBE = "210px";

// 前後ナビのサムネ（46px / SPで38px）
export const SIZES_PN_THUMB = "46px";
