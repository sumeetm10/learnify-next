import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const courses = await prisma.course.findMany({
    include: { _count: { select: { semesters: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(courses);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id, name, slug, description, icon } = await request.json();
  if (!id || !name || !slug || !description || !icon)
    return NextResponse.json({ error: "All fields required" }, { status: 400 });

  const course = await prisma.course.create({
    data: { id, name, slug, description, icon },
  });
  return NextResponse.json(course);
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id, name, slug, description, icon } = await request.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (slug !== undefined) data.slug = slug;
  if (description !== undefined) data.description = description;
  if (icon !== undefined) data.icon = icon;

  const course = await prisma.course.update({ where: { id }, data });
  return NextResponse.json(course);
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const semesterCount = await prisma.semester.count({ where: { courseId: id } });
  if (semesterCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete course with semesters. Delete semesters first." },
      { status: 400 }
    );
  }

  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
