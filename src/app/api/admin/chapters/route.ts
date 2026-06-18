import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { makeKey, uploadToR2, deleteFromR2 } from "@/lib/r2";

const PLACEHOLDER_PDF = "/uploads/seed/placeholder.pdf";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subjectId");

  const chapters = await prisma.chapter.findMany({
    where: subjectId ? { subjectId } : undefined,
    include: {
      subject: { select: { title: true, semesterId: true } },
      _count: { select: { questions: true } },
    },
    orderBy: [{ subjectId: "asc" }, { orderIndex: "asc" }],
  });

  return NextResponse.json(chapters);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const formData = await request.formData();
  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const subjectId = formData.get("subjectId") as string;
  const orderIndex = parseInt(formData.get("orderIndex") as string);
  const file = formData.get("file") as File | null;

  if (!id || !title || !subjectId) {
    return NextResponse.json(
      { error: "ID, title, and subjectId required" },
      { status: 400 }
    );
  }

  let pdfPath = PLACEHOLDER_PDF;
  if (file && file.size > 0) {
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files allowed" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = makeKey("admin", file.name);
    pdfPath = await uploadToR2(key, buffer, "application/pdf");
  }

  const chapter = await prisma.chapter.create({
    data: {
      id,
      title,
      pdfPath,
      orderIndex: orderIndex || 1,
      subjectId,
    },
  });
  return NextResponse.json(chapter);
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const formData = await request.formData();
  const id = formData.get("id") as string;
  const title = formData.get("title") as string | null;
  const subjectId = formData.get("subjectId") as string | null;
  const orderIndexRaw = formData.get("orderIndex") as string | null;
  const file = formData.get("file") as File | null;

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (title) data.title = title;
  if (subjectId) data.subjectId = subjectId;
  if (orderIndexRaw) data.orderIndex = parseInt(orderIndexRaw);

  if (file && file.size > 0) {
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files allowed" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = makeKey("admin", file.name);
    data.pdfPath = await uploadToR2(key, buffer, "application/pdf");
  }

  const chapter = await prisma.chapter.update({ where: { id }, data });
  return NextResponse.json(chapter);
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "ID required" }, { status: 400 });

  // Purge associated PDF files from R2 (chapter's own pdf + any teacher uploads)
  const chapter = await prisma.chapter.findUnique({
    where: { id },
    include: { teacherPdfs: true },
  });
  if (!chapter) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const urls = [
    ...(chapter.pdfPath && chapter.pdfPath !== PLACEHOLDER_PDF ? [chapter.pdfPath] : []),
    ...chapter.teacherPdfs.map((p) => p.filePath),
  ];
  await Promise.allSettled(urls.map((u) => deleteFromR2(u)));

  // Cascade: delete questions and progress for this chapter, then the chapter
  await prisma.question.deleteMany({ where: { chapterId: id } });
  await prisma.progress.deleteMany({ where: { chapterId: id } });
  await prisma.teacherPdf.deleteMany({ where: { chapterId: id } });
  await prisma.chapter.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
