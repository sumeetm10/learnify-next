import { notFound } from "next/navigation";
import StudentDashboard from "../(student)/student/page";

// TEMPORARY dev-only preview of the student dashboard design.
// Lets you view the /student UI without logging in (the real /student
// route stays protected by middleware). Automatically 404s in production.
export default function StudentPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <StudentDashboard />;
}
