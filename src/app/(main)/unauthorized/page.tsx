import Link from "next/link";
import { ShieldAlert, Home, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "401 — Access Denied | Learnify",
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#427da6] to-[#5a9cc5] flex items-center justify-center shadow-lg shadow-[#427da6]/25">
          <ShieldAlert size={40} className="text-white" />
        </div>

        <p className="text-6xl md:text-7xl font-extrabold bg-gradient-to-r from-[#427da6] to-[#5a9cc5] bg-clip-text text-transparent mb-2">
          401
        </p>
        <h1 className="text-2xl font-bold mb-3">Access Denied</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          You don&apos;t have permission to view this page. It may belong to a
          different course or require a different account.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/">
            <Button className="bg-[#427da6] hover:bg-[#356a8f] rounded-full gap-2">
              <Home size={16} />
              Back to Home
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="rounded-full gap-2">
              <LogIn size={16} />
              Switch Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
