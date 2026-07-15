import Link from "next/link";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function Footer() {
  // Course links are only shown to logged-in users.
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;

  // Fetch site settings
  let settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });
  if (!settings) {
    settings = await prisma.siteSettings.create({ data: { id: "default" } });
  }

  return (
    <footer className="bg-gradient-to-br from-slate-900 to-slate-800 text-white/80 pt-16 pb-6">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* About */}
        <div>
          <h3 className="text-white font-bold text-lg mb-4">{settings.collegeName}</h3>
          <p className="text-sm leading-relaxed">
            Empowering students with easy access to study materials, interactive quizzes, and progress tracking.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
            <li><Link href="/progress" className="hover:text-white transition-colors">Progress</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
          </ul>
        </div>

        {/* Courses — only for logged-in users */}
        {isLoggedIn ? (
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Courses</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/course/bba" className="hover:text-white transition-colors">BBA</Link></li>
              <li><Link href="/course/bcsit" className="hover:text-white transition-colors">BCSIT</Link></li>
              <li><Link href="/course/bhm" className="hover:text-white transition-colors">BHM</Link></li>
            </ul>
          </div>
        ) : (
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Get Started</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Register</Link></li>
            </ul>
          </div>
        )}

        {/* Contact */}
        <div>
          <h3 className="text-white font-bold text-lg mb-4">Contact Us</h3>
          <ul className="space-y-2 text-sm">
            <li>{settings.contactAddress}</li>
            <li>{settings.contactPhone}</li>
            <li>{settings.contactEmail}</li>
          </ul>
          <div className="flex gap-3 mt-4">
            {[
              { url: settings.facebookUrl, Icon: Facebook, hover: "hover:bg-blue-600", label: "Facebook" },
              { url: settings.instagramUrl, Icon: Instagram, hover: "hover:bg-pink-600", label: "Instagram" },
              { url: settings.linkedinUrl, Icon: Linkedin, hover: "hover:bg-blue-500", label: "LinkedIn" },
              { url: settings.youtubeUrl, Icon: Youtube, hover: "hover:bg-red-600", label: "YouTube" },
            ]
              .filter((s) => s.url)
              .map(({ url, Icon, hover, label }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`w-9 h-9 rounded-full bg-white/10 flex items-center justify-center transition-colors ${hover}`}
                >
                  <Icon size={16} />
                </a>
              ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 mt-10 pt-6 text-center text-xs text-white/50">
        &copy; {new Date().getFullYear()} Learnify - {settings.collegeName}. All rights reserved.
      </div>
    </footer>
  );
}
