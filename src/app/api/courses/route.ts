import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const courses = await prisma.course.findMany({
    include: {
      semesters: {
        orderBy: { id: "asc" },
        include: {
          _count: { select: { subjects: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ courses });
}
