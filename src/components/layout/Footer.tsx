import Link from "next/link";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-900 to-slate-800 text-white/80 pt-16 pb-6">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* About */}
        <div>
          <h3 className="text-white font-bold text-lg mb-4">Learnify</h3>
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

        {/* Courses */}
        <div>
          <h3 className="text-white font-bold text-lg mb-4">Courses</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/course/bba" className="hover:text-white transition-colors">BBA</Link></li>
            <li><Link href="/course/bcsit" className="hover:text-white transition-colors">BCSIT</Link></li>
            <li><Link href="/course/bhm" className="hover:text-white transition-colors">BHM</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-white font-bold text-lg mb-4">Contact Us</h3>
          <ul className="space-y-2 text-sm">
            <li>Baneshwor, Kathmandu</li>
            <li>+91 9876 543 210</li>
            <li>info@shubhashree.com</li>
          </ul>
          <div className="flex gap-3 mt-4">
            <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-blue-600 transition-colors"><Facebook size={16} /></a>
            <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-pink-600 transition-colors"><Instagram size={16} /></a>
            <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-blue-500 transition-colors"><Linkedin size={16} /></a>
            <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-600 transition-colors"><Youtube size={16} /></a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 mt-10 pt-6 text-center text-xs text-white/50">
        &copy; {new Date().getFullYear()} Learnify - Shubhashree College of Management. All rights reserved.
      </div>
    </footer>
  );
}
