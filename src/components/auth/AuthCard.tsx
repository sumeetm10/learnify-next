"use client";

import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  GraduationCap,
  BookOpen,
  Trophy,
  ClipboardCheck,
  Users,
  MailCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CourseData } from "@/types";

type Mode = "login" | "register";

export function AuthCard({ initialMode = "login" }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const router = useRouter();

  // shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // login-only
  const [notice, setNotice] = useState("");
  const [needsVerify, setNeedsVerify] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  // register-only
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((d) => setCourses(d.courses || []))
      .catch(() => {});
  }, []);

  // ?verify= banner on the login side
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("verify");
    const msg =
      status === "success"
        ? "Email verified! You can now sign in."
        : status === "expired"
          ? "That link expired. Sign in to resend a new one."
          : status === "invalid"
            ? "That verification link is invalid."
            : "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (msg) setNotice(msg);
  }, []);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setResendMsg("");
    setNeedsVerify(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNeedsVerify(false);
    setResendMsg("");
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        if (result.error === "EMAIL_NOT_VERIFIED") {
          setNeedsVerify(true);
          setError("Please verify your email before signing in.");
        } else {
          setError("Invalid email or password");
        }
        setLoading(false);
        return;
      }
      const session = await getSession();
      const role = (session?.user as unknown as { role?: string })?.role;
      if (role === "ADMIN") router.push("/admin");
      else if (role === "TEACHER") router.push("/teacher");
      else router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!name.trim()) {
      setError("Name is required");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one capital letter");
      setLoading(false);
      return;
    }
    const digitCount = (password.match(/\d/g) || []).length;
    if (digitCount < 2) {
      setError("Password must contain at least 2 numbers");
      setLoading(false);
      return;
    }
    if (!courseId) {
      setError("Please select your course");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, courseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }
      // Email verification disabled — sign the new student in and go home.
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        switchMode("login");
        setLoading(false);
      } else {
        router.push("/");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMsg("");
    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendMsg(res.ok ? "Verification email sent. Check your inbox." : "Could not resend. Try later.");
    } catch {
      setResendMsg("Could not resend. Try later.");
    }
  };

  // After successful registration: check-your-email screen
  if (registered) {
    return (
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-100 dark:border-slate-800 p-8 text-center animate-[fadeInDown_0.5s_ease-out]">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#427da6] to-[#5a9cc5] flex items-center justify-center">
          <MailCheck size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Check your email</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          We sent a verification link to <span className="font-medium">{email}</span>. Click it to
          activate your account, then sign in.
        </p>
        {resendMsg && <p className="text-sm text-[#427da6] mb-3">{resendMsg}</p>}
        <Button variant="outline" onClick={handleResend} className="w-full mb-3">
          Resend verification email
        </Button>
        <button
          onClick={() => {
            setRegistered(false);
            switchMode("login");
          }}
          className="text-sm text-[#427da6] hover:underline cursor-pointer"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  const isLogin = mode === "login";

  return (
    <div className="relative w-full max-w-4xl min-h-[580px] rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
      {/* ===== Top toggle ===== */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 flex bg-gray-200/80 dark:bg-slate-700/80 backdrop-blur-md rounded-full p-1 shadow-inner">
        <button
          onClick={() => switchMode("login")}
          className={`relative px-6 py-2 text-sm font-semibold rounded-full transition-all duration-300 cursor-pointer ${
            isLogin ? "text-white" : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          {isLogin && (
            <span className="absolute inset-0 bg-[#427da6] rounded-full shadow-md" />
          )}
          <span className="relative z-10">Login</span>
        </button>
        <button
          onClick={() => switchMode("register")}
          className={`relative px-6 py-2 text-sm font-semibold rounded-full transition-all duration-300 cursor-pointer ${
            !isLogin ? "text-white" : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          {!isLogin && (
            <span className="absolute inset-0 bg-[#427da6] rounded-full shadow-md" />
          )}
          <span className="relative z-10">Register</span>
        </button>
      </div>

      {/* ===== Form: LOGIN (left half on desktop) ===== */}
      <div
        className={`lg:absolute lg:inset-y-0 lg:left-0 lg:w-1/2 flex items-center justify-center p-8 sm:p-10 pt-16 transition-opacity duration-500 ${
          isLogin ? "block opacity-100" : "hidden lg:flex lg:opacity-0 lg:pointer-events-none"
        }`}
      >
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold">Welcome Back</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to continue learning</p>
          </div>
          {notice && (
            <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-3 rounded-xl text-sm">
              {notice}
            </div>
          )}
          {isLogin && error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
              {error}
              {needsVerify && (
                <button type="button" onClick={handleResend} className="block mt-2 underline font-medium cursor-pointer">
                  Resend verification email
                </button>
              )}
            </div>
          )}
          {isLogin && resendMsg && <div className="text-sm text-[#427da6]">{resendMsg}</div>}

          <IconInput icon={Mail} type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          <PasswordInput value={password} onChange={setPassword} show={showPw} toggle={() => setShowPw((v) => !v)} placeholder="Enter your password" />

          <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-gradient-to-r from-[#427da6] to-[#5a9cc5] hover:from-[#356a8f] hover:to-[#4a8cb5] font-semibold gap-2 shadow-lg shadow-[#427da6]/25 transition-all hover:scale-[1.02]">
            {loading ? "Signing in..." : <><LogIn size={18} /> Sign In</>}
          </Button>
        </form>
      </div>

      {/* ===== Form: REGISTER (right half on desktop) ===== */}
      <div
        className={`lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 flex items-center justify-center p-8 sm:p-10 pt-16 transition-opacity duration-500 ${
          !isLogin ? "block opacity-100" : "hidden lg:flex lg:opacity-0 lg:pointer-events-none"
        }`}
      >
        <form onSubmit={handleRegister} className="w-full max-w-sm space-y-3.5">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold">Create Account</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Start your learning journey</p>
          </div>
          {!isLogin && error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">{error}</div>
          )}

          <IconInput icon={User} type="text" value={name} onChange={setName} placeholder="Your name" />
          <IconInput icon={Mail} type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          <PasswordInput value={password} onChange={setPassword} show={showPw} toggle={() => setShowPw((v) => !v)} placeholder="1 capital, 2 numbers, 6+ chars" />
          <IconInput icon={Lock} type={showPw ? "text" : "password"} value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm password" />

          <div className="relative">
            <GraduationCap size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
              className="w-full h-11 pl-10 pr-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-sm outline-none transition-all focus:border-[#427da6] focus:ring-2 focus:ring-[#427da6]/25"
            >
              <option value="" disabled>Select your course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-400 -mt-1">You&apos;ll only see materials for this course. Can&apos;t be changed later.</p>

          <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-gradient-to-r from-[#427da6] to-[#5a9cc5] hover:from-[#356a8f] hover:to-[#4a8cb5] font-semibold gap-2 shadow-lg shadow-[#427da6]/25 transition-all hover:scale-[1.02]">
            {loading ? "Creating..." : <><UserPlus size={18} /> Create Account</>}
          </Button>
        </form>
      </div>

      {/* ===== Sliding brand panel (desktop only) ===== */}
      <div
        className={`hidden lg:flex absolute inset-y-0 w-1/2 flex-col items-center justify-center text-white p-12 overflow-hidden rounded-[2rem] transition-transform duration-700 ease-in-out ${
          isLogin ? "translate-x-full" : "translate-x-0"
        }`}
      >
        {/* animated gradient + blobs */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2c5777] via-[#427da6] to-[#5a9cc5] dark:from-[#0f2236] dark:via-[#1a3550] dark:to-[#254565] animate-gradient" />
        <div className="absolute -top-16 -left-10 w-72 h-72 bg-[#7fc3ec]/30 rounded-full blur-3xl animate-blob" />
        <div className="absolute -bottom-20 -right-8 w-80 h-80 bg-[#5a9cc5]/40 rounded-full blur-3xl animate-blob [animation-delay:6s]" />

        <div className="relative z-10 text-center max-w-xs">
          {/* Floating feature chips */}
          <div className="flex justify-center gap-3 mb-6">
            <Chip icon={BookOpen} title="Courses" sub="3 programs" />
            <Chip icon={Users} title="Students" sub="Active" />
          </div>
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl">
            <GraduationCap size={40} className="text-white" />
          </div>
          <div className="flex justify-center gap-3 mb-8">
            <Chip icon={Trophy} title="Progress" sub="Tracked" />
            <Chip icon={ClipboardCheck} title="Quizzes" sub="Instant" />
          </div>

          <h3 className="text-2xl font-bold mb-2">
            {isLogin ? "New to Learnify?" : "Already a member?"}
          </h3>
          <p className="text-white/80 text-sm">
            {isLogin
              ? "Create an account and start learning today."
              : "Sign in to pick up where you left off."}
          </p>
        </div>
      </div>

      {/* Home link */}
      <Link
        href="/"
        className="absolute bottom-4 left-1/2 -translate-x-1/2 lg:left-4 lg:translate-x-0 text-xs text-gray-400 hover:text-[#427da6] transition-colors z-20"
      >
        &larr; Back to Home
      </Link>
    </div>
  );
}

/* ---------- small subcomponents ---------- */

function Chip({ icon: Icon, title, sub }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-3 py-2 shadow-lg animate-[fadeIn_0.8s_ease-out]">
      <Icon size={16} className="text-[#9fd3f5]" />
      <div className="text-left leading-tight">
        <p className="text-xs font-semibold">{title}</p>
        <p className="text-[10px] text-white/70">{sub}</p>
      </div>
    </div>
  );
}

function IconInput({
  icon: Icon,
  type,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Icon size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={type !== "text"}
        className="w-full h-11 pl-10 pr-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-sm outline-none transition-all focus:border-[#427da6] focus:ring-2 focus:ring-[#427da6]/25"
      />
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  toggle,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  toggle: () => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full h-11 pl-10 pr-10 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-sm outline-none transition-all focus:border-[#427da6] focus:ring-2 focus:ring-[#427da6]/25"
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#427da6] transition-colors cursor-pointer"
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}
