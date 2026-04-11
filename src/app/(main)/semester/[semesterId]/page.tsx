import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ semesterId: string }>;
}

export default async function SemesterPage({ params }: Props) {
  const { semesterId } = await params;
  const semNum = parseInt(semesterId);

  if (isNaN(semNum)) {
    notFound();
  }

  // Find the semester and its course to redirect to the new URL
  const semester = await prisma.semester.findUnique({
    where: { id: semNum },
    include: { course: true },
  });

  if (!semester) {
    notFound();
  }

  redirect(`/course/${semester.course.slug}/semester/${semester.id}`);
}
