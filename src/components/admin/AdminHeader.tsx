"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AdminSidebar } from "./AdminSidebar";

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/users": "User Management",
  "/admin/content": "Content Management",
  "/admin/settings": "Site Settings",
  "/admin/messages": "Messages",
};

export function AdminHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const title = pageTitles[pathname] || "Admin";

  return (
    <header className="sticky top-20 z-30 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile menu trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <AdminSidebar />
            </SheetContent>
          </Sheet>

          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {session?.user?.name || "Admin"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{session?.user?.email}</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-[#427da6] flex items-center justify-center text-white text-sm font-bold">
            {(session?.user?.name || "A").charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
