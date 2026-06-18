import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Navbar } from "@/components/layout/Navbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-[#f6f7fb] dark:bg-slate-950 pt-20">
        <AdminSidebar />
        <div className="flex-1 flex flex-col md:ml-64">
          <AdminHeader />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </>
  );
}
