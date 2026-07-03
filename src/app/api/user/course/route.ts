import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Lets a student set their course once (onboarding for accounts created
// before course selection existed). Cannot be changed after it's set.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (!user?.id || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await request.json();
  if (!courseId) {
    return NextResponse.json({ error: "courseId required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id: user.id } });
  if (existing?.courseId) {
    return NextResponse.json({ error: "Course already set" }, { status: 400 });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "Invalid course" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { courseId } });

  return NextResponse.json({ success: true });
}
