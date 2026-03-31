"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Issuer, Instrument } from "@/lib/types";
import { exportToCsv } from "@/lib/exportCsv";

const TYPE_COLORS: Record<string, string> = {
  bank: "bg-blue-100 text-blue-700",
  corporate: "bg-green-100 text-green-700",
  sovereign: "bg-orange-100 text-orange-700",
  "financial institution": "bg-purple-100 text-purple-700",
};

function fmt(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

type IssuerWithStats = Issuer & {
  instrument_count: number;
  total_usd: number;
  instrument_types: string[];
};

export default function IssuersPage() {
  const [issuers, setIssuers] = useState<IssuerWithStats[]>([]);
  const [filtered, setFiltered] = useState<IssuerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("total_usd");

  useEffect(() => {
    async function load() {
      const [{ data: issuerData }, { data: instrumentData }] = await Promise.all([
        supabase.from("issuers").select("*"),
        supabase.from("instruments").select("*"),
      ]);

      const instruments: Instrument[] = instrumentData ?? [];

      const enriched: IssuerWithStats[] = (issuerData ?? []).map((issuer) => {
        const related = instruments.filter((i) => i.issuer_id === issuer.id);
        return {
          ...issuer,
          instrument_count: related.length,
          total_usd: related.reduce((s, i) => s + (i.amount_usd ?? 0), 0),
          instrument_types: [...new Set(related.map((i) => i.instrument_type))],
        };
      });

      enriched.sort((a, b) => b.total_usd - a.total_usd);
      setIssuers(enriched);
      setFiltered(enriched);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    let result = [...issuers];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q) || i.country?.toLowerCase().includes(q));
    }

    if (typeFilter !== "all") result = result.filter((i) => i.type === typeFilter);

    result.sort((a, b) => {
      if (sortBy === "total_usd") return b.total_usd - a.total_usd;
      if (sortBy === "instrument_count") return b.instrument_count - a.instrument_count;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

    setFiltered(result);
  }, [search, typeFilter, sortBy, issuers]);

  const types = ["all", ...Array.from(new Set(issuers.map((i) => i.type)))];
  const grandTotal = filtered.reduce((s, i) => s + i.total_usd, 0);

  // Type breakdown
  const typeBreakdown = Object.entries(
    filtered.reduce((acc, i) => {
      if (!acc[i.type]) acc[i.type] = { count: 0, total: 0 };
      acc[i.type].count += 1;
      acc[i.type].total += i.total_usd;
      return acc;
    }, {} as Record<string, { count: number; total: number }>)
  ).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Issuers</h1>
          <p className="text-sm text-slate-500 mt-1">All entities registered as ESG instrument issuers under GIFT IFSC</p>
        </div>
        <button
          onClick={() => exportToCsv("issuers.csv", filtered.map((i) => ({ name: i.name, type: i.type, country: i.country, website: i.website, total_issuance_usd: i.total_usd, instrument_count: i.instrument_count, instrument_types: i.instrument_types.join("; ") })))}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          ↓ Export CSV
        </button>
      </div>
      </div>

      {/* Summary Stats */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Issuers", value: String(filtered.length), color: "text-slate-800" },
            { label: "Total Issuance", value: fmt(grandTotal), color: "text-green-600" },
            { label: "Banks", value: String(filtered.filter((i) => i.type === "bank").length), color: "text-blue-600" },
            { label: "Corporates", value: String(filtered.filter((i) => i.type === "corporate").length), color: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Type Breakdown Sidebar */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm h-fit">
          <h2 className="font-semibold text-slate-800 mb-4 text-sm">By Issuer Type</h2>
          {loading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : (
            <div className="space-y-4">
              {typeBreakdown.map(([type, stats]) => (
                <div key={type}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[type] ?? "bg-gray-100 text-gray-600"}`}>
                      {type}
                    </span>
                    <span className="text-xs text-slate-500">{stats.count} issuer{stats.count !== 1 ? "s" : ""}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{fmt(stats.total)}</p>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${grandTotal > 0 ? Math.round((stats.total / grandTotal) * 100) : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Table */}
        <div className="lg:col-span-3 space-y-4">

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search by issuer name or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-green-500">
              {types.map((t) => <option key={t} value={t}>{t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-green-500">
              <option value="total_usd">Sort: Largest Issuance</option>
              <option value="instrument_count">Sort: Most Instruments</option>
              <option value="name">Sort: Name A–Z</option>
            </select>
          </div>

          {/* Mobile: Cards */}
          {!loading && filtered.length > 0 && (
            <div className="block md:hidden space-y-3">
              {filtered.map((issuer) => (
                <div key={issuer.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-slate-800">{issuer.name}</p>
                      {issuer.website && (
                        <a href={issuer.website} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline">{issuer.website.replace("https://", "")}</a>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium shrink-0 ${TYPE_COLORS[issuer.type] ?? "bg-gray-100 text-gray-600"}`}>{issuer.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-slate-500 text-xs">{issuer.country} · {issuer.instrument_count} instrument{issuer.instrument_count !== 1 ? "s" : ""}</span>
                    <span className="font-bold text-slate-800">{issuer.total_usd > 0 ? fmt(issuer.total_usd) : "—"}</span>
                  </div>
                  {issuer.instrument_types.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {issuer.instrument_types.map((t) => <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">{t}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Desktop: Table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <p className="text-3xl mb-2">🏢</p>
                <p className="font-medium text-slate-600">No issuers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Issuer</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Country</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Issuance</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Instruments</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Instrument Types</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((issuer) => (
                      <tr key={issuer.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-800">{issuer.name}</p>
                          {issuer.website && (
                            <a href={issuer.website} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline">
                              {issuer.website.replace("https://", "")}
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${TYPE_COLORS[issuer.type] ?? "bg-gray-100 text-gray-600"}`}>
                            {issuer.type}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{issuer.country}</td>
                        <td className="px-4 py-4 text-right font-bold text-slate-800">{issuer.total_usd > 0 ? fmt(issuer.total_usd) : "—"}</td>
                        <td className="px-4 py-4 text-right text-slate-600">{issuer.instrument_count}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1">
                            {issuer.instrument_types.map((t) => (
                              <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">{t}</span>
                            ))}
                            {issuer.instrument_types.length === 0 && <span className="text-slate-400 text-xs">—</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

