"use client";

import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [needsVerify, setNeedsVerify] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Show a banner based on ?verify= set by the email verification route.
  // Reading the URL on mount is a legitimate external-source sync.
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNeedsVerify(false);
    setResendMsg("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 px-4">
      <Card className="w-full max-w-md dark:bg-slate-800 dark:border-slate-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>Sign in to your Learnify account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {notice && (
              <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-3 rounded-md text-sm">
                {notice}
              </div>
            )}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                {error}
                {needsVerify && (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="block mt-2 underline font-medium cursor-pointer"
                  >
                    Resend verification email
                  </button>
                )}
              </div>
            )}
            {resendMsg && (
              <div className="text-sm text-[#427da6]">{resendMsg}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-blue-600 hover:underline">
                Register
              </Link>
            </p>
            <Link href="/" className="text-sm text-blue-600 hover:underline block">
              &larr; Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
