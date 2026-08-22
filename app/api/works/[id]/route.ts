import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import {
  countByImageUrl,
  deleteIllustration,
  getIllustration,
  updateIllustration,
} from "@/lib/queries";
import { deleteByPublicUrl } from "@/lib/r2";
import { IllustrationPatchSchema, fieldErrors } from "@/lib/types";

/** URLの :id を数値として取り出す。数字以外は弾く。 */
function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function badRequest(message: string, fields?: Record<string, string>) {
  return NextResponse.json(
    { data: null, error: { message, code: "VALIDATION_ERROR", fields } },
    { status: 400 },
  );
}

function failure(e: unknown, where: string) {
  console.error(where, e);
  const message = e instanceof Error ? e.message : "error";
  if (message === "UNAUTHORIZED") {
    return NextResponse.json(
      { data: null, error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
      { status: 401 },
    );
  }
  return NextResponse.json(
    {
      data: null,
      error: { message: "Internal server error", code: "INTERNAL_ERROR" },
    },
    { status: 500 },
  );
}

/**
 * 使われなくなった画像をR2から消す。
 *
 * 必ずDBの更新・削除を終えてから呼ぶこと。先に消すと、DB側が失敗したときに
 * 画像だけ無い行が残る。逆にR2側が失敗しても、残るのは孤児ファイルだけで
 * 表示は壊れない。直しやすい方に倒している。
 *
 * ここでは失敗しても例外にしない。画面上は処理が済んでいるため。
 */
async function discardImage(url: string | null | undefined, where: string) {
  if (!url) return;
  try {
    // 別の作品が同じ画像を指している場合は残す
    const used = await countByImageUrl(url);
    if (used > 0) {
      console.info(
        `${where} 他に ${used} 件が使用中のため画像は残します:`,
        url,
      );
      return;
    }
    await deleteByPublicUrl(url);
  } catch (e) {
    console.error(`${where} 画像の後始末に失敗しました:`, url, e);
  }
}

// 作品を更新
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser();

    const { id: raw } = await params;
    const id = parseId(raw);
    if (id === null) return badRequest("IDが不正です");

    // 以前は body をそのまま DB に渡していた。想定外の列まで書き換えられるので、
    // 受け取る項目をスキーマで絞る。
    const body: unknown = await request.json();
    const parsed = IllustrationPatchSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        "入力内容を確認してください",
        fieldErrors(parsed.error),
      );
    }

    // 画像を差し替える場合にそなえて、差し替え前のURLを控えておく
    const before = await getIllustration(id);
    const updated = await updateIllustration(id, parsed.data);

    // 画像が別のものに変わったら、前の画像はもう誰も使わない
    const oldUrl = before?.image_url;
    if (oldUrl && updated.image_url !== oldUrl) {
      await discardImage(oldUrl, "[PUT /api/works/:id]");
    }

    return NextResponse.json(updated);
  } catch (e) {
    return failure(e, "[PUT /api/works/:id]");
  }
}

// 作品を削除
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser();

    const { id: raw } = await params;
    const id = parseId(raw);
    if (id === null) return badRequest("IDが不正です");

    // 行を消すと image_url が分からなくなるので先に読む
    const before = await getIllustration(id);

    await deleteIllustration(id);
    await discardImage(before?.image_url, "[DELETE /api/works/:id]");

    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e, "[DELETE /api/works/:id]");
  }
}
