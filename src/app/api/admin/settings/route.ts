import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET is public — frontend pages need settings without auth
export async function GET() {
  let settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.siteSettings.create({ data: { id: "default" } });
  }

  return NextResponse.json(settings);
}

// PATCH is admin-only
export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();

  // Only allow known fields to be updated
  const allowedFields = [
    "collegeName",
    "tagline",
    "heroText",
    "contactEmail",
    "contactPhone",
    "contactAddress",
    "logoUrl",
  ];
  const updateData: Record<string, string> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  const settings = await prisma.siteSettings.update({
    where: { id: "default" },
    data: updateData,
  });

  return NextResponse.json(settings);
}
