import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

const poppins = localFont({
  src: [
    { path: "../../public/fonts/Poppins-Light.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/Poppins-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/Poppins-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/Poppins-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/Poppins-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Learnify - Educational Platform",
  description: "Learn smarter with Learnify — your interactive educational companion.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${poppins.variable} font-[family-name:var(--font-poppins)] bg-[#f6f7fb] dark:bg-slate-900 text-[#2d3748] dark:text-gray-100 transition-colors duration-300`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
