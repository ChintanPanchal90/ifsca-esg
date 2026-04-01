import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "IFSCA ESG Platform",
  description: "ESG Intelligence and Disclosure Repository for GIFT IFSC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={roboto.className}>
      <body className="min-h-screen flex flex-col" style={{ background: "#f4f6f9" }}>
        <Navbar />
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer style={{ background: "#24313D" }} className="text-white mt-auto">
          <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-white font-bold text-lg tracking-wide">IFSCA</span>
                <span className="text-xs text-slate-300 font-medium">ESG Platform</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Centralized ESG Intelligence and Disclosure Repository for GIFT International Financial Services Centre.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Quick Links</p>
              <ul className="space-y-1.5 text-xs text-slate-400">
                {[
                  { label: "Dashboard", href: "/" },
                  { label: "Bonds", href: "/instruments" },
                  { label: "ESG Loans", href: "/loans" },
                  { label: "Funds", href: "/funds" },
                  { label: "Issuers", href: "/issuers" },
                ].map((l) => (
                  <li key={l.href}><a href={l.href} className="hover:text-white transition-colors">{l.label}</a></li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">IFSCA</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                International Financial Services Centres Authority<br />
                GIFT City, Gandhinagar<br />
                Gujarat – 382 355, India
              </p>
              <a href="https://www.ifsca.gov.in" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-300 hover:text-white mt-2 inline-block transition-colors">
                www.ifsca.gov.in →
              </a>
            </div>
          </div>

          {/* Bottom strip */}
          <div style={{ background: "#1a252f" }} className="border-t border-slate-700">
            <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-xs text-slate-500">© {new Date().getFullYear()} International Financial Services Centres Authority. All rights reserved.</p>
              <p className="text-xs text-slate-600">ESG Platform v1.0</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
