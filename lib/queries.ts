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
export async function getIllustration(id: number): Promise<Illustration | null> {
  const { data, error } = await supabasePublic
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Illustration;
}

// ---- 書き込み（管理画面・サーバー側のみ） ----

export async function createIllustration(
  input: IllustrationInput
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
  input: Partial<IllustrationInput>
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
