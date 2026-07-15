import { AnnouncementProvider } from "@/components/layout/AnnouncementProvider";
import { NavbarWrapper } from "@/components/layout/NavbarWrapper";

// Give the teacher dashboard the same shell as the rest of the site:
// the floating top navbar and the site-wide announcement button.
export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <AnnouncementProvider>
      <NavbarWrapper />
      {children}
    </AnnouncementProvider>
  );
}
