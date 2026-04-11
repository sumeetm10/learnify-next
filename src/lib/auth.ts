import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // CHANGED: Previously only TEACHER could login (user.role !== "TEACHER").
        // Now ALL roles can login — we just check if the user exists and is active.
        // Why: Students need accounts now, and admin needs to login too.
        if (!user || !user.isActive) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    // JWT callback: Runs every time a JWT is created or updated.
    // We store the user's role and id IN the token itself — this way
    // we don't need to hit the database on every request to check the role.
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as { role: string }).role;
        token.id = user.id;
      }
      return token;
    },
    // Session callback: Takes data from the JWT token and puts it
    // into the session object that client components can access.
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
};

// HELPER: DRY auth guard for admin API routes.
// Why: Every admin API route needs the same check (is user logged in? is user admin?).
// Instead of repeating this code in every route, we call this helper.
// Returns the session if admin, or a 401 NextResponse if not.
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (
    !session?.user ||
    (session.user as unknown as { role?: string }).role !== "ADMIN"
  ) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}

// Similar helper for teacher-or-admin access
export async function requireTeacherOrAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as unknown as { role?: string })?.role;
  if (!session?.user || (role !== "TEACHER" && role !== "ADMIN")) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}
