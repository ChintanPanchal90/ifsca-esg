"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/instruments", label: "Bonds" },
  { href: "/loans", label: "Loans" },
  { href: "/funds", label: "Funds" },
  { href: "/issuers", label: "Issuers" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-slate-900 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">IFSCA</span>
            <span className="font-semibold text-sm tracking-wide hidden sm:block">ESG Platform</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  pathname === l.href
                    ? "bg-green-600 text-white font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-slate-700"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Admin button */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/login"
              className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-1.5 rounded font-semibold transition-colors"
            >
              Admin
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded text-slate-300 hover:text-white">
            {open ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-3 space-y-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 rounded text-sm ${
                  pathname === l.href ? "bg-green-600 text-white font-semibold" : "text-slate-300 hover:text-white hover:bg-slate-700"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)} className="block px-3 py-2 rounded text-sm bg-green-600 text-white font-semibold">
              Admin
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
