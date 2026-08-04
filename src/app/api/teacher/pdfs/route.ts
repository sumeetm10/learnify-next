import { NextResponse } from "next/server";
import { requireTeacherOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromR2 } from "@/lib/r2";

// Create the DB record after the browser has uploaded the file directly to R2.
export async function POST(request: Request) {
  const auth = await requireTeacherOrAdmin();
  if (auth.error) return auth.error;

  const { title, chapterId, filePath } = await request.json();
  if (!title || !chapterId || !filePath) {
    return NextResponse.json({ error: "title, chapterId and filePath required" }, { status: 400 });
  }

  // filePath must live under our own R2 public base. Require the trailing slash
  // so a look-alike host (e.g. ...r2.dev.evil.com) can't slip past a bare prefix.
  const publicBase = process.env.R2_PUBLIC_URL;
  if (!publicBase || !filePath.startsWith(publicBase + "/")) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  // Ensure the chapter exists before persisting a row that references it.
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId }, select: { id: true } });
  if (!chapter) {
    return NextResponse.json({ error: "Invalid chapter" }, { status: 400 });
  }

  try {
    const pdf = await prisma.teacherPdf.create({
      data: {
        title,
        filePath,
        chapterId,
        uploadedById: (auth.session!.user as { id: string }).id,
      },
    });

    return NextResponse.json({ success: true, pdf });
  } catch {
    // DB write failed — remove the already-uploaded R2 object so it isn't orphaned.
    try {
      await deleteFromR2(filePath);
    } catch {}
    return NextResponse.json({ error: "Failed to save material" }, { status: 500 });
  }
}

export async function GET() {
  const auth = await requireTeacherOrAdmin();
  if (auth.error) return auth.error;

  // A teacher sees only their own uploads; an admin sees all.
  const role = (auth.session!.user as { role?: string }).role;
  const userId = (auth.session!.user as { id: string }).id;

  const pdfs = await prisma.teacherPdf.findMany({
    where: role === "ADMIN" ? undefined : { uploadedById: userId },
    include: {
      chapter: {
        include: {
          // Include the full chain so the dashboard can show/filter by
          // subject, semester and course without extra requests.
          subject: {
            include: {
              semester: {
                include: { course: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ pdfs });
}

export async function DELETE(request: Request) {
  const auth = await requireTeacherOrAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const pdf = await prisma.teacherPdf.findUnique({ where: { id } });
  if (!pdf) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Ownership: a teacher can only delete their own PDFs; admins can delete any.
  const role = (auth.session!.user as { role?: string }).role;
  const userId = (auth.session!.user as { id: string }).id;
  if (role !== "ADMIN" && pdf.uploadedById !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Remove file from R2 (ignore failures so a missing object doesn't block delete)
  try {
    await deleteFromR2(pdf.filePath);
  } catch {
    // already gone or legacy local path — continue
  }

  await prisma.teacherPdf.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
