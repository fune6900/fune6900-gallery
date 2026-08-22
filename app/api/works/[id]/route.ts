import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { updateIllustration, deleteIllustration } from "@/lib/queries";
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

    const updated = await updateIllustration(id, parsed.data);
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

    await deleteIllustration(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e, "[DELETE /api/works/:id]");
  }
}
