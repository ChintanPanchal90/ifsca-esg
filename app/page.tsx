"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Instrument } from "@/lib/types";

type Stats = {
  totalIssuance: number;
  totalLoans: number;
  totalAUM: number;
  instrumentCount: number;
  loanCount: number;
  fundCount: number;
  issuerCount: number;
};

const TYPE_COLORS: Record<string, string> = {
  "green bond": "bg-green-100 text-green-700",
  "social bond": "bg-blue-100 text-blue-700",
  "sustainability bond": "bg-teal-100 text-teal-700",
  "sustainability-linked bond": "bg-purple-100 text-purple-700",
  "transition bond": "bg-orange-100 text-orange-700",
};

function fmt(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentInstruments, setRecentInstruments] = useState<Instrument[]>([]);
  const [breakdown, setBreakdown] = useState<{ type: string; total: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [
        { data: instruments },
        { data: loans },
        { data: funds },
        { count: issuerCount },
      ] = await Promise.all([
        supabase.from("instruments").select("*, issuers(name, type)").order("issue_date", { ascending: false }),
        supabase.from("loans").select("*"),
        supabase.from("funds").select("*"),
        supabase.from("issuers").select("*", { count: "exact", head: true }),
      ]);

      const totalIssuance = (instruments ?? []).reduce((s, i) => s + (i.amount_usd ?? 0), 0);
      const totalLoans = (loans ?? []).reduce((s, l) => s + (l.amount_usd ?? 0), 0);
      const totalAUM = (funds ?? []).reduce((s, f) => s + (f.aum_usd ?? 0), 0);

      const map: Record<string, { total: number; count: number }> = {};
      (instruments ?? []).forEach((i) => {
        if (!map[i.instrument_type]) map[i.instrument_type] = { total: 0, count: 0 };
        map[i.instrument_type].total += i.amount_usd ?? 0;
        map[i.instrument_type].count += 1;
      });
      const bd = Object.entries(map).map(([type, v]) => ({ type, ...v })).sort((a, b) => b.total - a.total);

      setStats({ totalIssuance, totalLoans, totalAUM, instrumentCount: instruments?.length ?? 0, loanCount: loans?.length ?? 0, fundCount: funds?.length ?? 0, issuerCount: issuerCount ?? 0 });
      setRecentInstruments((instruments ?? []).slice(0, 5));
      setBreakdown(bd);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ESG Intelligence Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">GIFT IFSC — Centralized ESG Disclosure Repository</p>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-200">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live Data
        </span>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total ESG Issuance", value: fmt(stats!.totalIssuance), sub: `${stats!.instrumentCount} instruments`, color: "text-green-600" },
            { label: "Total ESG Loans", value: fmt(stats!.totalLoans), sub: `${stats!.loanCount} loan records`, color: "text-blue-600" },
            { label: "Fund AUM", value: fmt(stats!.totalAUM), sub: `${stats!.fundCount} funds`, color: "text-purple-600" },
            { label: "Registered Issuers", value: String(stats!.issuerCount), sub: "banks, corporates, sovereigns", color: "text-orange-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Breakdown by Type */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Issuance by Type</h2>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3">
              {breakdown.map((b) => {
                const pct = stats ? Math.round((b.total / stats.totalIssuance) * 100) : 0;
                return (
                  <div key={b.type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[b.type] ?? "bg-gray-100 text-gray-600"}`}>{b.type}</span>
                      <span className="text-xs text-slate-500">{fmt(b.total)} · {pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Instruments */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Recent Instruments</h2>
            <Link href="/instruments" className="text-xs text-green-600 hover:underline font-medium">View all →</Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentInstruments.map((inst) => (
                <div key={inst.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{inst.title}</p>
                    <p className="text-xs text-slate-400">
                      {(inst.issuers as { name: string } | undefined)?.name} · {inst.sector}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-700">{fmt(inst.amount_usd)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[inst.instrument_type] ?? "bg-gray-100 text-gray-600"}`}>
                      {inst.instrument_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: "/instruments", label: "Bonds", desc: "View all ESG debt instruments", color: "border-green-200 hover:border-green-400" },
          { href: "/loans", label: "ESG Loans", desc: "Bank loan disclosures", color: "border-blue-200 hover:border-blue-400" },
          { href: "/funds", label: "ESG Funds", desc: "Registered fund data", color: "border-purple-200 hover:border-purple-400" },
          { href: "/issuers", label: "Issuers", desc: "All registered entities", color: "border-orange-200 hover:border-orange-400" },
        ].map((q) => (
          <Link key={q.href} href={q.href} className={`bg-white rounded-xl border-2 p-4 transition-colors shadow-sm ${q.color}`}>
            <p className="font-semibold text-slate-800 text-sm">{q.label}</p>
            <p className="text-xs text-slate-400 mt-1">{q.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
