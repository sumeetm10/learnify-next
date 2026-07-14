import { AuthCard } from "@/components/auth/AuthCard";

export const metadata = { title: "Register | Learnify" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <AuthCard initialMode="register" />
    </div>
  );
}
