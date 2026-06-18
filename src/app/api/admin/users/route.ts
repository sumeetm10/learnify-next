import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma, Role } from "@prisma/client";

// GET: List users with search, role filter, pagination
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role && ["STUDENT", "TEACHER", "ADMIN"].includes(role)) {
    where.role = role as Role;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// PATCH: Update user role or active status
export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const { userId, role, isActive } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Safety: Prevent admin from deactivating themselves
  const adminId = (auth.session!.user as unknown as { id: string }).id;
  if (userId === adminId && isActive === false) {
    return NextResponse.json(
      { error: "Cannot deactivate your own account" },
      { status: 400 }
    );
  }
  if (userId === adminId && role && role !== "ADMIN") {
    return NextResponse.json(
      { error: "Cannot remove your own admin role" },
      { status: 400 }
    );
  }

  const updateData: Prisma.UserUpdateInput = {};
  if (role && ["STUDENT", "TEACHER", "ADMIN"].includes(role)) {
    updateData.role = role as Role;
  }
  if (typeof isActive === "boolean") {
    updateData.isActive = isActive;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(updated);
}
