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
  { href: "/policy-measures", label: "Policy Measures" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-200" style={{ boxShadow: "0px 2px 10px rgba(0,0,0,0.08)" }}>
      {/* Top bar — IFSCA branding strip */}
      <div style={{ background: "#1f4286" }} className="px-4 sm:px-6 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-white text-xs font-medium tracking-wide">
            International Financial Services Centres Authority — GIFT IFSC
          </p>
          <a href="https://www.ifsca.gov.in" target="_blank" rel="noopener noreferrer" className="text-blue-200 hover:text-white text-xs transition-colors hidden sm:block">
            ifsca.gov.in ↗
          </a>
        </div>
      </div>

      {/* Main navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div style={{ background: "#1f4286" }} className="text-white text-xs font-bold px-2.5 py-1 rounded">
              IFSCA
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-tight" style={{ color: "#1f4286" }}>ESG Platform</p>
              <p className="text-xs text-gray-400 leading-tight">GIFT IFSC Disclosure Repository</p>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  pathname === l.href
                    ? "text-white"
                    : "text-gray-600 hover:text-white hover:rounded"
                }`}
                style={pathname === l.href ? { background: "#1f4286" } : {}}
                onMouseEnter={(e) => { if (pathname !== l.href) (e.currentTarget as HTMLElement).style.background = "#1f4286"; }}
                onMouseLeave={(e) => { if (pathname !== l.href) (e.currentTarget as HTMLElement).style.background = ""; }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Admin button */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/login"
              className="text-white text-sm px-4 py-1.5 rounded font-semibold transition-colors"
              style={{ background: "#fd5f00" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#e05400"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#fd5f00"; }}
            >
              Admin Login
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded text-gray-500 hover:text-gray-700">
            {open ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-3 space-y-1 border-t border-gray-100 pt-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded text-sm font-medium transition-colors"
                style={pathname === l.href ? { background: "#1f4286", color: "white" } : { color: "#374151" }}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded text-sm font-semibold text-white"
              style={{ background: "#fd5f00" }}
            >
              Admin Login
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
