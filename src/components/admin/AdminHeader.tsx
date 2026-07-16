"use client";

import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AdminSidebar } from "./AdminSidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/users": "User Management",
  "/admin/content": "Content Management",
  "/admin/announcements": "Announcements",
  "/admin/settings": "Site Settings",
  "/admin/messages": "Messages",
};

export function AdminHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const title = pageTitles[pathname] || "Admin";

  return (
    // Full-width top bar that sits beside the sidebar (offset by its width on
    // desktop) so it never overlaps it. Fixed to the top edge.
    <header className="fixed top-0 left-0 right-0 md:left-64 z-30 h-16 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 sm:px-6">
      <div className="flex items-center gap-3">
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
          <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
            {title}
          </h1>
          <p className="hidden sm:block text-[11px] text-gray-500 dark:text-gray-400">Admin Panel</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <div className="text-right hidden sm:block leading-tight">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {session?.user?.name || "Admin"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{session?.user?.email}</p>
        </div>
        <div className="h-9 w-9 rounded-full bg-[#427da6] flex items-center justify-center text-white text-sm font-bold shrink-0">
          {(session?.user?.name || "A").charAt(0).toUpperCase()}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut({ callbackUrl: "/" })}
          aria-label="Sign out"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
        >
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}
