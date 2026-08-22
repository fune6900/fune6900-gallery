/**
 * 旧WordPressテーマ fune-gallery の functions.php にあったデータ取得・
 * 幾何計算をそのまま移したもの。関数名は PHP 版と対応させてある。
 *
 *   fune_gallery_sort()        → parseSort()
 *   fune_gallery_url()         → galleryUrl()
 *   fune_gallery_tv_geometry() → tvGeometry()
 *   ...
 *
 * 作品数が3桁のうちは、絞り込み以外（並び替え・年集計）を
 * JS 側でやったほうが素直なので、そうしている。
 */
import { cache } from "react";
import { supabasePublic } from "./supabase";
import type { Illustration } from "./types";

const TABLE = "illustrations";

// FUNE_GALLERY_PER_PAGE
export const PER_PAGE = 24;

export type Sort = "new" | "old";

/** 画面から来る検索条件。URLのクエリ文字列と1対1。 */
export type GalleryParams = {
  s: string;
  year: number;
  sort: Sort;
  paged: number;
};

/* =============================================================
 *  URL パラメータの解釈（fune_gallery_sort / _year）
 * ============================================================= */

function one(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export function readParams(
  sp: Record<string, string | string[] | undefined>,
): GalleryParams {
  const sort = one(sp.sort);
  const year = parseInt(one(sp.y), 10);
  const paged = parseInt(one(sp.paged), 10);

  return {
    s: one(sp.s).trim(),
    // 1970〜2999 の範囲外は「すべて」扱い
    year: year >= 1970 && year <= 2999 ? year : 0,
    sort: sort === "old" ? sort : "new",
    paged: paged > 1 ? paged : 1,
  };
}

/**
 * ギャラリーのURLを組み立てる。今の絞り込みを引き継ぐ。
 * fune_gallery_url() の移植。null を渡すとその条件を落とす。
 */
export function galleryUrl(
  current: GalleryParams,
  overrides: Partial<
    Record<"s" | "y" | "sort" | "paged", string | number | null>
  > = {},
): string {
  const args: Record<string, string | number | null> = {
    s: current.s !== "" ? current.s : null,
    y: current.year ? current.year : null,
    sort: current.sort !== "new" ? current.sort : null,
    paged: null,
    ...overrides,
  };

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(args)) {
    if (v === null || v === undefined || v === "") continue;
    qs.set(k, String(v));
  }

  const query = qs.toString();
  return query ? `/?${query}` : "/";
}

/* =============================================================
 *  取得
 * ============================================================= */

// PostgREST の or() は値の中の記号に弱いので、引用符まわりだけ落とす
function safeTerm(term: string): string {
  return term.replace(/["\\%,()]/g, " ").trim();
}

/** 制作日が入っている作品を、絞り込みを効かせて全件返す（並びは新しい順）。 */
const fetchFiltered = cache(async function fetchFiltered(
  s: string,
  year: number,
): Promise<Illustration[]> {
  let q = supabasePublic
    .from(TABLE)
    .select("*")
    // 旧テーマの meta_query('production_date', EXISTS) と同じ。
    // 制作日が空の作品は一覧に出ない（DESIGN.md 8章「既知の制約」）。
    .not("production_date", "is", null)
    .order("production_date", { ascending: false });

  if (year) {
    q = q
      .gte("production_date", `${year}-01-01`)
      .lte("production_date", `${year}-12-31`);
  }

  const term = safeTerm(s);
  if (term !== "") {
    // 旧テーマは post_title（= ACF title のミラー）と description meta を見ていた
    q = q.or(`title.ilike."%${term}%",description.ilike."%${term}%"`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Illustration[];
});

export type GalleryPage = {
  works: Illustration[];
  total: number;
  pages: number;
  paged: number;
};

/** 一覧1ページぶん。pre_get_posts + paginate_links に相当する。 */
export async function getGalleryPage(p: GalleryParams): Promise<GalleryPage> {
  const all = await fetchFiltered(p.s, p.year);

  const ordered = p.sort === "old" ? all.slice().reverse() : all;

  const total = ordered.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const paged = Math.min(Math.max(1, p.paged), pages);
  const from = (paged - 1) * PER_PAGE;

  return { works: ordered.slice(from, from + PER_PAGE), total, pages, paged };
}

/** 制作日が入っている全作品（集計用）。 */
const allDated = cache(async function allDated(): Promise<Illustration[]> {
  const { data, error } = await supabasePublic
    .from(TABLE)
    .select("*")
    .not("production_date", "is", null)
    .order("production_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Illustration[];
});

/** fune_gallery_count() — 公開作品数。制作日の有無は問わない。 */
export const getCount = cache(async function getCount(): Promise<number> {
  const { count, error } = await supabasePublic
    .from(TABLE)
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
});

/** fune_gallery_years() — 制作年の一覧。新しい順。 */
export const getYears = cache(async function getYears(): Promise<number[]> {
  const rows = await allDated();
  const set = new Set<number>();
  for (const r of rows) {
    const y = parseInt((r.production_date ?? "").slice(0, 4), 10);
    if (y) set.add(y);
  }
  return [...set].sort((a, b) => b - a);
});

/** fune_gallery_count_in_year() */
export async function getCountInYear(year: number): Promise<number> {
  if (!year) return 0;
  const rows = await allDated();
  return rows.filter((r) => (r.production_date ?? "").startsWith(String(year)))
    .length;
}

/** fune_gallery_span_years() — 最古から最新まで何年ぶんか。 */
export async function getSpanYears(): Promise<number> {
  const years = await getYears();
  if (!years.length) return 0;
  return Math.max(...years) - Math.min(...years) + 1;
}

/** fune_gallery_first_year() */
export async function getFirstYear(): Promise<number> {
  const years = await getYears();
  return years.length ? Math.min(...years) : 0;
}

/** fune_gallery_last_updated() — 最終更新日を YYYY.MM.DD で。 */
export const getLastUpdated = cache(
  async function getLastUpdated(): Promise<string> {
    const { data, error } = await supabasePublic
      .from(TABLE)
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1);
    if (error || !data?.length) return "—";
    return (data[0].updated_at as string).slice(0, 10).replace(/-/g, ".");
  },
);

/** fune_gallery_latest() — ヒーローのキューブ6面に貼る最新作。 */
export async function getLatest(limit = 6): Promise<Illustration[]> {
  const rows = await allDated();
  return rows.slice(0, limit);
}

/** fune_gallery_adjacent() — 制作日で前後の作品。 */
export async function getAdjacent(
  work: Illustration,
  dir: "prev" | "next",
): Promise<Illustration | null> {
  if (!work.production_date) return null;
  const rows = await allDated(); // 新しい順

  // prev = より古い / next = より新しい
  const pool = rows.filter(
    (r) =>
      r.id !== work.id &&
      (dir === "next"
        ? (r.production_date ?? "") > work.production_date!
        : (r.production_date ?? "") < work.production_date!),
  );
  if (!pool.length) return null;

  // 新しい順に並んでいるので、prev は先頭、next は末尾が最も近い
  return dir === "next" ? pool[pool.length - 1] : pool[0];
}

/**
 * fune_gallery_related() — 同時期の作品。
 * タクソノミーが無いので「制作日が近い順」が関連の定義。
 */
export async function getRelated(
  work: Illustration,
  limit = 4,
): Promise<Illustration[]> {
  if (!work.production_date) return [];
  const base = Number(work.production_date.replace(/-/g, ""));
  const rows = await allDated();

  return rows
    .filter((r) => r.id !== work.id && r.production_date)
    .sort((a, b) => {
      const da = Math.abs(Number(a.production_date!.replace(/-/g, "")) - base);
      const db = Math.abs(Number(b.production_date!.replace(/-/g, "")) - base);
      return da - db;
    })
    .slice(0, limit);
}

/** 1件取得。 */
export async function getWork(id: number): Promise<Illustration | null> {
  if (!Number.isFinite(id)) return null;
  const { data, error } = await supabasePublic
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Illustration;
}

/* =============================================================
 *  表示ヘルパー
 * ============================================================= */

/** fune_gallery_format_date() — YYYY-MM-DD → YYYY.MM.DD */
export function formatDate(date: string | null): string {
  if (!date) return "";
  return date.slice(0, 10).replace(/-/g, ".");
}

/** 0埋め。str_pad(..., STR_PAD_LEFT) の代わり。 */
export function pad(n: number | string, len: number): string {
  return String(n).padStart(len, "0");
}

/* =============================================================
 *  カードの幾何（fune_gallery_tv_geometry / _tv_jitter）
 * ============================================================= */

/** 画像の縦横比。未設定なら 0。 */
export function imageRatio(work: Illustration): number {
  if (!work.image_width || !work.image_height) return 0;
  return work.image_width / work.image_height;
}

export type TvGeometry = { cols: number; rows: number; className: string };

/**
 * カード1枚ぶんのグリッド幾何。画像の比から行数を出す。
 *
 * 固定の 4:3 セルに全部入れると縦長の作品は上下を削られる。顔はたいてい
 * そこにあるので、それが一番痛い。そこで行の刻みを列幅の 1/6 まで細かくし、
 * 各カードが必要な行数を画像の比から計算する。
 *
 *   行の高さ = N*U + (N-1)*G  なので  N = (H + G) / (U + G)
 *
 * 列幅は画面幅で変わるが、この式は比で効くので代表値で計算しても
 * どのブレークポイントでも数％の誤差に収まる。
 */
export function tvGeometry(
  index: number,
  work: Illustration,
  single = false,
): TvGeometry {
  // 計算の基準にする代表値（実際の列幅は画面幅で変わる）
  const col = 280.0;
  const gap = 14.0;
  const unit = col / 6.0;

  let ratio = imageRatio(work);
  if (ratio <= 0) ratio = 4 / 3; // サイズ不明。標準的な横長として扱う

  // 7枚に1枚を大きく見せる。ただし極端に縦長のものは、2列にすると
  // 画面を縦に占領しすぎるので通常サイズのままにする。
  const cols = !single && index % 7 === 0 && ratio > 0.6 ? 2 : 1;

  const width = cols * col + (cols - 1) * gap;
  const height = width / ratio;
  let rows = Math.round((height + gap) / (unit + gap));
  rows = Math.max(2, Math.min(16, rows));

  return { cols, rows, className: cols === 2 ? "fg-tv--feature" : "" };
}

/**
 * カードごとの傾きと縦のずれ。山積みに見せるためのもの。
 * 作品IDから決めるので、リロードしても積み方が変わらない
 * （乱数だと毎回並びが動いて落ち着かない）。
 */
export function tvJitter(id: number): { "--rot": string; "--off": string } {
  const rot = (((id * 37) % 5) - 2) * 0.9; // -1.8deg 〜 1.8deg
  const off = ((id * 53) % 3) * 3; // 0 / 3 / 6 px
  return { "--rot": `${rot}deg`, "--off": `${off}px` };
}
