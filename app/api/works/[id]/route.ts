import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { updateIllustration, deleteIllustration } from "@/lib/queries";

// 作品を更新
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser();
    const { id } = await params;
    const body = await request.json();
    const updated = await updateIllustration(Number(id), body);
    return NextResponse.json(updated);
  } catch (e) {
    const message = e instanceof Error ? e.message : "error";
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// 作品を削除
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser();
    const { id } = await params;
    await deleteIllustration(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "error";
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
