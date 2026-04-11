import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const chapterId = searchParams.get("chapterId");

  if (!chapterId) {
    return NextResponse.json(
      { error: "chapterId filter required" },
      { status: 400 }
    );
  }

  const questions = await prisma.question.findMany({
    where: { chapterId },
    orderBy: { orderIndex: "asc" },
  });

  return NextResponse.json(questions);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { text, options, answer, orderIndex, chapterId } =
    await request.json();

  if (!text || !options || !answer || !chapterId) {
    return NextResponse.json(
      { error: "text, options, answer, and chapterId required" },
      { status: 400 }
    );
  }

  if (!Array.isArray(options) || options.length < 2) {
    return NextResponse.json(
      { error: "At least 2 options required" },
      { status: 400 }
    );
  }

  const question = await prisma.question.create({
    data: {
      text,
      options,
      answer,
      orderIndex: orderIndex || 1,
      chapterId,
    },
  });
  return NextResponse.json(question);
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id, text, options, answer, orderIndex } = await request.json();
  if (!id)
    return NextResponse.json({ error: "ID required" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (text !== undefined) data.text = text;
  if (options !== undefined) data.options = options;
  if (answer !== undefined) data.answer = answer;
  if (orderIndex !== undefined) data.orderIndex = orderIndex;

  const question = await prisma.question.update({ where: { id }, data });
  return NextResponse.json(question);
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.question.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
