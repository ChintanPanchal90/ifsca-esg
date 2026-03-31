import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IFSCA ESG Platform",
  description: "ESG Intelligence and Disclosure Repository for GIFT IFSC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.className}>
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-slate-900 text-slate-400 text-xs py-6 px-6 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-semibold text-white">IFSCA ESG Platform</span>
            <span>© {new Date().getFullYear()} International Financial Services Centres Authority. All rights reserved.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
