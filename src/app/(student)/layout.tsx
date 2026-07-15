import { AnnouncementProvider } from "@/components/layout/AnnouncementProvider";
import { NavbarWrapper } from "@/components/layout/NavbarWrapper";

// Same shell as the rest of the site: floating top navbar + announcement button.
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AnnouncementProvider>
      <NavbarWrapper />
      {children}
    </AnnouncementProvider>
  );
}
