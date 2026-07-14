import { Footer } from "@/components/layout/Footer";
import { AnnouncementProvider } from "@/components/layout/AnnouncementProvider";
import { NavbarWrapper } from "@/components/layout/NavbarWrapper";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AnnouncementProvider>
      <NavbarWrapper />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </AnnouncementProvider>
  );
}
