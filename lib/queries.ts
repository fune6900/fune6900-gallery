import { supabasePublic, createAdminClient } from "./supabase";
import type { Illustration, IllustrationInput } from "./types";

const TABLE = "illustrations";

// ---- 読み取り（表側・誰でも） ----

// 全作品を制作日の新しい順で取得
export async function getAllIllustrations(): Promise<Illustration[]> {
  const { data, error } = await supabasePublic
    .from(TABLE)
    .select("*")
    .order("production_date", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data as Illustration[];
}

// 1件取得
export async function getIllustration(
  id: number,
): Promise<Illustration | null> {
  const { data, error } = await supabasePublic
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Illustration;
}

/**
 * その画像URLを使っている作品が何件あるか。
 *
 * 画像をR2から消す前に確認する。移行時に同じ画像を指す行ができていたり、
 * 手で同じURLを入れたりした場合に、他の作品の画像まで巻き添えで消さないため。
 */
export async function countByImageUrl(imageUrl: string): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("image_url", imageUrl);
  if (error) throw error;
  return count ?? 0;
}

// ---- 書き込み（管理画面・サーバー側のみ） ----

export async function createIllustration(
  input: IllustrationInput,
): Promise<Illustration> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from(TABLE)
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Illustration;
}

export async function updateIllustration(
  id: number,
  input: Partial<IllustrationInput>,
): Promise<Illustration> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from(TABLE)
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Illustration;
}

export async function deleteIllustration(id: number): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
