"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Fund } from "@/lib/types";
import { exportToCsv } from "@/lib/exportCsv";

const STRATEGY_COLORS: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  transition: "bg-orange-100 text-orange-700",
  impact: "bg-blue-100 text-blue-700",
  "ESG screened": "bg-purple-100 text-purple-700",
};

function fmt(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

export default function FundsPage() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [filtered, setFiltered] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [strategyFilter, setStrategyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("aum_usd");

  useEffect(() => {
    supabase
      .from("funds")
      .select("*")
      .order("aum_usd", { ascending: false })
      .then(({ data }) => {
        setFunds(data ?? []);
        setFiltered(data ?? []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = [...funds];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.fund_name.toLowerCase().includes(q) ||
          f.fund_manager.toLowerCase().includes(q) ||
          f.sectors?.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (strategyFilter !== "all") result = result.filter((f) => f.strategy === strategyFilter);

    result.sort((a, b) => {
      if (sortBy === "aum_usd") return (b.aum_usd ?? 0) - (a.aum_usd ?? 0);
      if (sortBy === "fund_name") return a.fund_name.localeCompare(b.fund_name);
      if (sortBy === "fund_manager") return a.fund_manager.localeCompare(b.fund_manager);
      return 0;
    });

    setFiltered(result);
  }, [search, strategyFilter, sortBy, funds]);

  const strategies = ["all", ...Array.from(new Set(funds.map((f) => f.strategy).filter(Boolean)))];
  const totalAUM = filtered.reduce((s, f) => s + (f.aum_usd ?? 0), 0);

  // Strategy breakdown
  const strategyBreakdown = Object.entries(
    filtered.reduce((acc, f) => {
      if (!acc[f.strategy]) acc[f.strategy] = 0;
      acc[f.strategy] += f.aum_usd ?? 0;
      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ESG Funds</h1>
          <p className="text-sm text-slate-500 mt-1">ESG and sustainable investment funds registered under GIFT IFSC</p>
        </div>
        <button
          onClick={() => exportToCsv("esg-funds.csv", filtered.map((f) => ({ fund_name: f.fund_name, fund_manager: f.fund_manager, strategy: f.strategy, aum_usd: f.aum_usd, domicile: f.domicile, esg_methodology: f.esg_methodology, sectors: (f.sectors ?? []).join("; ") })))}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          ↓ Export CSV
        </button>
      </div>
      </div>

      {/* Summary Stats */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">Total Funds</p>
            <p className="text-2xl font-bold mt-1 text-slate-800">{filtered.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">Total AUM</p>
            <p className="text-2xl font-bold mt-1 text-purple-600">{fmt(totalAUM)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">Fund Managers</p>
            <p className="text-2xl font-bold mt-1 text-slate-800">
              {new Set(filtered.map((f) => f.fund_manager)).size}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">Strategies</p>
            <p className="text-2xl font-bold mt-1 text-slate-800">
              {new Set(filtered.map((f) => f.strategy)).size}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Strategy Breakdown Sidebar */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm h-fit">
          <h2 className="font-semibold text-slate-800 mb-4 text-sm">AUM by Strategy</h2>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3">
              {strategyBreakdown.map(([strategy, amount]) => (
                <div key={strategy}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STRATEGY_COLORS[strategy] ?? "bg-gray-100 text-gray-600"}`}>
                      {strategy}
                    </span>
                    <span className="text-xs text-slate-500">{fmt(amount)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${Math.round((amount / totalAUM) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search by fund name, manager or sector..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            <select value={strategyFilter} onChange={(e) => setStrategyFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-green-500">
              {strategies.map((s) => <option key={s} value={s}>{s === "all" ? "All Strategies" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-green-500">
              <option value="aum_usd">Sort: Largest AUM</option>
              <option value="fund_name">Sort: Name A–Z</option>
              <option value="fund_manager">Sort: Manager A–Z</option>
            </select>
          </div>

          {/* Fund Cards */}
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white rounded-xl border border-gray-100 animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 py-20 text-center text-slate-400">
              <p className="text-3xl mb-2">📊</p>
              <p className="font-medium text-slate-600">No funds found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((fund) => (
                <div key={fund.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:border-purple-200 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-slate-800">{fund.fund_name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${STRATEGY_COLORS[fund.strategy] ?? "bg-gray-100 text-gray-600"}`}>
                          {fund.strategy}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">Manager: <span className="font-medium text-slate-700">{fund.fund_manager}</span></p>
                      <p className="text-xs text-slate-400 mt-1">Domicile: {fund.domicile} · Methodology: {fund.esg_methodology}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold text-purple-600">{fmt(fund.aum_usd ?? 0)}</p>
                      <p className="text-xs text-slate-400">AUM</p>
                    </div>
                  </div>
                  {fund.sectors && fund.sectors.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {fund.sectors.map((s) => (
                        <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
