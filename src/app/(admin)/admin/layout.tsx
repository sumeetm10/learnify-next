import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AnnouncementProvider } from "@/components/layout/AnnouncementProvider";
import { NavbarWrapper } from "@/components/layout/NavbarWrapper";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AnnouncementProvider>
      {/* Floating pill nav — scales down slightly on admin routes (see Navbar) */}
      <NavbarWrapper />
      <div className="min-h-screen bg-[#f6f7fb] dark:bg-slate-950">
        {/* Sidebar is fixed and touches the very top */}
        <AdminSidebar />
        {/* Content sits right of the sidebar and below the floating nav */}
        <div className="md:ml-64 pt-24">
          <main className="p-6">{children}</main>
        </div>
      </div>
    </AnnouncementProvider>
  );
}
