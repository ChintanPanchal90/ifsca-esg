"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/instruments", label: "Bonds" },
  { href: "/loans", label: "Loans" },
  { href: "/funds", label: "Funds" },
  { href: "/issuers", label: "Issuers" },
  { href: "/policy-measures", label: "Policy Measures" },
];

const NAVY   = "#1f4286";
const ORANGE = "#fd5f00";

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen]         = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const isActive = (href: string) => pathname === href;

  const linkClass = (href: string) =>
    `px-3 py-2 rounded text-sm font-medium transition-colors ${
      isActive(href) ? "text-white" : "text-gray-600 hover:text-white"
    }`;

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-200"
         style={{ boxShadow: "0px 2px 10px rgba(0,0,0,0.08)" }}>

      {/* Branding strip */}
      <div style={{ background: NAVY }} className="px-4 sm:px-6 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-white text-xs font-medium tracking-wide">
            International Financial Services Centres Authority — GIFT IFSC
          </p>
          <a href="https://www.ifsca.gov.in" target="_blank" rel="noopener noreferrer"
             className="text-blue-200 hover:text-white text-xs transition-colors hidden sm:block">
            ifsca.gov.in ↗
          </a>
        </div>
      </div>

      {/* Main bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div style={{ background: NAVY }} className="text-white text-xs font-bold px-2.5 py-1 rounded">
              IFSCA
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-tight" style={{ color: NAVY }}>ESG Platform</p>
              <p className="text-xs text-gray-400 leading-tight">GIFT IFSC Disclosure Repository</p>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={linkClass(l.href)}
                style={isActive(l.href) ? { background: NAVY } : {}}
                onMouseEnter={(e) => { if (!isActive(l.href)) (e.currentTarget as HTMLElement).style.background = NAVY; }}
                onMouseLeave={(e) => { if (!isActive(l.href)) (e.currentTarget as HTMLElement).style.background = ""; }}
              >
                {l.label}
              </Link>
            ))}

            {/* AI Analytics — only when logged in */}
            {loggedIn && (
              <Link
                href="/analytics"
                className={`px-3 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  isActive("/analytics") ? "text-white" : "text-white"
                }`}
                style={isActive("/analytics")
                  ? { background: "#e05400" }
                  : { background: ORANGE }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#e05400")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = isActive("/analytics") ? "#e05400" : ORANGE)}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Analytics
              </Link>
            )}
          </div>

          {/* Right: Login / Admin / Logout */}
          <div className="hidden md:flex items-center gap-2">
            {loggedIn ? (
              <>
                <Link
                  href="/admin"
                  className="text-sm px-3 py-1.5 rounded border font-medium transition-colors text-gray-600 hover:text-white hover:border-[#1f4286]"
                  style={{ borderColor: "#d1d5db" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = NAVY; (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = NAVY; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "#4b5563"; (e.currentTarget as HTMLElement).style.borderColor = "#d1d5db"; }}
                >
                  Admin
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm px-3 py-1.5 rounded font-medium text-gray-500 hover:text-red-600 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-white text-sm px-4 py-1.5 rounded font-semibold transition-colors"
                style={{ background: NAVY }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#17326a")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = NAVY)}
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setOpen(!open)}
                  className="md:hidden p-2 rounded text-gray-500 hover:text-gray-700">
            {open
              ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            }
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-3 space-y-1 border-t border-gray-100 pt-2">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded text-sm font-medium transition-colors"
                style={isActive(l.href) ? { background: NAVY, color: "white" } : { color: "#374151" }}
              >
                {l.label}
              </Link>
            ))}
            {loggedIn && (
              <Link
                href="/analytics"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded text-sm font-semibold text-white"
                style={{ background: ORANGE }}
              >
                AI Analytics
              </Link>
            )}
            {loggedIn ? (
              <>
                <Link href="/admin" onClick={() => setOpen(false)}
                      className="block px-3 py-2 rounded text-sm font-medium text-gray-700">
                  Admin Panel
                </Link>
                <button onClick={() => { handleLogout(); setOpen(false); }}
                        className="block w-full text-left px-3 py-2 rounded text-sm font-medium text-red-500">
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded text-sm font-semibold text-white"
                style={{ background: NAVY }}
              >
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
