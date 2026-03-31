"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Instrument } from "@/lib/types";
import { exportToCsv } from "@/lib/exportCsv";

const TYPE_COLORS: Record<string, string> = {
  "green bond": "bg-green-100 text-green-700",
  "social bond": "bg-blue-100 text-blue-700",
  "sustainability bond": "bg-teal-100 text-teal-700",
  "sustainability-linked bond": "bg-purple-100 text-purple-700",
  "transition bond": "bg-orange-100 text-orange-700",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-50 text-green-600",
  matured: "bg-gray-100 text-gray-500",
  cancelled: "bg-red-50 text-red-500",
};

function fmt(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

export default function InstrumentsPage() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [filtered, setFiltered] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [sortBy, setSortBy] = useState("issue_date");

  useEffect(() => {
    supabase
      .from("instruments")
      .select("*, issuers(name, type)")
      .order("issue_date", { ascending: false })
      .then(({ data }) => {
        setInstruments(data ?? []);
        setFiltered(data ?? []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = [...instruments];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.issuers as { name: string } | undefined)?.name.toLowerCase().includes(q) ||
          i.sector?.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== "all") result = result.filter((i) => i.instrument_type === typeFilter);
    if (sectorFilter !== "all") result = result.filter((i) => i.sector === sectorFilter);

    result.sort((a, b) => {
      if (sortBy === "amount_usd") return b.amount_usd - a.amount_usd;
      if (sortBy === "issue_date") return new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime();
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return 0;
    });

    setFiltered(result);
  }, [search, typeFilter, sectorFilter, sortBy, instruments]);

  const types = ["all", ...Array.from(new Set(instruments.map((i) => i.instrument_type)))];
  const sectors = ["all", ...Array.from(new Set(instruments.map((i) => i.sector).filter(Boolean)))];
  const totalAmount = filtered.reduce((s, i) => s + i.amount_usd, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bonds</h1>
          <p className="text-sm text-slate-500 mt-1">All ESG-labelled debt instruments registered under GIFT IFSC</p>
        </div>
        <button
          onClick={() => exportToCsv("bonds.csv", filtered.map((i) => ({ title: i.title, issuer: (i.issuers as { name: string } | undefined)?.name ?? "", type: i.instrument_type, sector: i.sector, amount_usd: i.amount_usd, esg_standard: i.esg_standard, arranger: i.arranger, issue_date: i.issue_date, maturity_date: i.maturity_date, status: i.status })))}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          ↓ Export CSV
        </button>
      </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name, issuer or sector..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-green-500">
          {types.map((t) => <option key={t} value={t}>{t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-green-500">
          {sectors.map((s) => <option key={s} value={s}>{s === "all" ? "All Sectors" : s}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-green-500">
          <option value="issue_date">Sort: Latest First</option>
          <option value="amount_usd">Sort: Largest First</option>
          <option value="title">Sort: A–Z</option>
        </select>
      </div>

      {/* Summary bar */}
      {!loading && (
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span><span className="font-semibold text-slate-800">{filtered.length}</span> instruments</span>
          <span>·</span>
          <span>Total: <span className="font-semibold text-green-600">{fmt(totalAmount)}</span></span>
          {(search || typeFilter !== "all" || sectorFilter !== "all") && (
            <button onClick={() => { setSearch(""); setTypeFilter("all"); setSectorFilter("all"); }} className="text-xs text-red-500 hover:underline ml-auto">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <p className="text-3xl mb-2">📋</p>
            <p className="font-medium text-slate-600">No instruments found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Instrument</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Issuer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sector</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Standard</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Issue Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <Link href={`/instruments/${inst.id}`} className="font-medium text-green-700 hover:underline">{inst.title}</Link>
                      <p className="text-xs text-slate-400">Arranger: {inst.arranger ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {(inst.issuers as { name: string } | undefined)?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${TYPE_COLORS[inst.instrument_type] ?? "bg-gray-100 text-gray-600"}`}>
                        {inst.instrument_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{inst.sector ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{fmt(inst.amount_usd)}</td>
                    <td className="px-4 py-3 text-slate-600">{inst.esg_standard ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{inst.issue_date ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${STATUS_COLORS[inst.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {inst.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
