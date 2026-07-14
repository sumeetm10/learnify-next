import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const announcement = await prisma.announcement.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      message: true,
      circleColor: true,
      boxColor: true,
    },
  });

  return NextResponse.json(announcement || null);
}
