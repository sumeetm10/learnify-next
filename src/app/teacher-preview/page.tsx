import { notFound } from "next/navigation";
import TeacherDashboard from "../(teacher)/teacher/page";

// TEMPORARY dev-only preview of the teacher dashboard design.
// Lets you view the exact /teacher UI without logging in (the real /teacher
// route stays protected by middleware). Automatically 404s in production, so
// it is safe to leave in — or delete this folder once you're done reviewing.
export default function TeacherPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <TeacherDashboard />;
}
