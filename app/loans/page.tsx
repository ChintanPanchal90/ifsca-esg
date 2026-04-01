"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loan } from "@/lib/types";
import { exportToCsv } from "@/lib/exportCsv";

function fmt(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

type BankSummary = {
  bank_name: string;
  total_usd: number;
  green: number;
  social: number;
  sustainability: number;
  sustainability_linked: number;
  transition: number;
  loan_count: number;
  sectors: string[];
};

export default function LoansPage() {
  const [banks, setBanks] = useState<BankSummary[]>([]);
  const [filtered, setFiltered] = useState<BankSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("total_usd");

  useEffect(() => {
    supabase
      .from("loans")
      .select("*")
      .then(({ data }) => {
        const loans: Loan[] = data ?? [];

        // Aggregate by bank
        const map: Record<string, BankSummary> = {};
        loans.forEach((l) => {
          if (!map[l.bank_name]) {
            map[l.bank_name] = {
              bank_name: l.bank_name,
              total_usd: 0,
              green: 0,
              social: 0,
              sustainability: 0,
              sustainability_linked: 0,
              transition: 0,
              loan_count: 0,
              sectors: [],
            };
          }
          map[l.bank_name].total_usd += l.amount_usd;
          map[l.bank_name].loan_count += 1;
          if (l.loan_category === "green") map[l.bank_name].green += l.amount_usd;
          if (l.loan_category === "social") map[l.bank_name].social += l.amount_usd;
          if (l.loan_category === "sustainability") map[l.bank_name].sustainability += l.amount_usd;
          if (l.loan_category === "sustainability-linked") map[l.bank_name].sustainability_linked += l.amount_usd;
          if (l.loan_category === "transition") map[l.bank_name].transition += l.amount_usd;
          if (l.sector && !map[l.bank_name].sectors.includes(l.sector)) {
            map[l.bank_name].sectors.push(l.sector);
          }
        });

        const result = Object.values(map).sort((a, b) => b.total_usd - a.total_usd);
        setBanks(result);
        setFiltered(result);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = [...banks];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((b) => b.bank_name.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      if (sortBy === "total_usd") return b.total_usd - a.total_usd;
      if (sortBy === "bank_name") return a.bank_name.localeCompare(b.bank_name);
      if (sortBy === "green") return b.green - a.green;
      return 0;
    });

    setFiltered(result);
  }, [search, sortBy, banks]);

  const grandTotal = filtered.reduce((s, b) => s + b.total_usd, 0);
  const totalGreen = filtered.reduce((s, b) => s + b.green, 0);
  const totalSocial = filtered.reduce((s, b) => s + b.social, 0);
  const totalSustainability = filtered.reduce((s, b) => s + b.sustainability, 0);
  const totalSustainabilityLinked = filtered.reduce((s, b) => s + b.sustainability_linked, 0);
  const totalTransition = filtered.reduce((s, b) => s + b.transition, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ESG Loans</h1>
          <p className="text-sm text-slate-500 mt-1">Cumulative ESG lending by banks under GIFT IFSC mandated reporting</p>
        </div>
        <button
          onClick={() => exportToCsv("esg-loans.csv", filtered.map((b) => ({ bank: b.bank_name, total_usd: b.total_usd, green: b.green, social: b.social, sustainability: b.sustainability, sustainability_linked: b.sustainability_linked, transition: b.transition, sectors: b.sectors.join("; ") })))}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          ↓ Export CSV
        </button>
      </div>
      </div>

      {/* Summary Stats */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Total ESG Lending", value: fmt(grandTotal), color: "text-slate-800" },
            { label: "Green Loans", value: fmt(totalGreen), color: "text-[#1f4286]" },
            { label: "Social Loans", value: fmt(totalSocial), color: "text-blue-600" },
            { label: "Sustainability Loans", value: fmt(totalSustainability), color: "text-teal-600" },
            { label: "Sustainability-Linked", value: fmt(totalSustainabilityLinked), color: "text-purple-600" },
            { label: "Transition Loans", value: fmt(totalTransition), color: "text-orange-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by bank name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-700"
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-700">
          <option value="total_usd">Sort: Largest Total</option>
          <option value="green">Sort: Largest Green</option>
          <option value="bank_name">Sort: Bank A–Z</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white rounded-xl border border-gray-100 animate-pulse" />)}</div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 py-20 text-center text-slate-400">
          <p className="text-3xl mb-2">🏦</p>
          <p className="font-medium text-slate-600">No banks found</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          {/* Mobile: Cards */}
          <div className="block md:hidden space-y-3">
            {filtered.map((b) => (
              <div key={b.bank_name} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-800">{b.bank_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{b.loan_count} loan {b.loan_count === 1 ? "record" : "records"}</p>
                  </div>
                  <p className="text-lg font-bold text-slate-800">{fmt(b.total_usd)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Green", value: b.green, color: "text-[#1f4286]" },
                    { label: "Social", value: b.social, color: "text-blue-600" },
                    { label: "Sustainability", value: b.sustainability, color: "text-teal-600" },
                    { label: "Sust.-Linked", value: b.sustainability_linked, color: "text-purple-600" },
                    { label: "Transition", value: b.transition, color: "text-orange-600" },
                  ].filter((c) => c.value > 0).map((c) => (
                    <div key={c.label} className="bg-slate-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-400">{c.label}</p>
                      <p className={`text-sm font-semibold ${c.color}`}>{fmt(c.value)}</p>
                    </div>
                  ))}
                </div>
                {b.sectors.length > 0 && <p className="text-xs text-slate-400 mt-2">Sectors: {b.sectors.join(", ")}</p>}
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bank</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total ESG Lending</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Green</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Social</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sustainability</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sust.-Linked</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Transition</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sectors Covered</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Share of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((b) => {
                    const pct = grandTotal > 0 ? Math.round((b.total_usd / grandTotal) * 100) : 0;
                    return (
                      <tr key={b.bank_name} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-800">{b.bank_name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{b.loan_count} loan {b.loan_count === 1 ? "record" : "records"}</p>
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-slate-800">{fmt(b.total_usd)}</td>
                        <td className="px-4 py-4 text-right text-[#1f4286] font-medium">{b.green > 0 ? fmt(b.green) : "—"}</td>
                        <td className="px-4 py-4 text-right text-blue-600 font-medium">{b.social > 0 ? fmt(b.social) : "—"}</td>
                        <td className="px-4 py-4 text-right text-teal-600 font-medium">{b.sustainability > 0 ? fmt(b.sustainability) : "—"}</td>
                        <td className="px-4 py-4 text-right text-purple-600 font-medium">{b.sustainability_linked > 0 ? fmt(b.sustainability_linked) : "—"}</td>
                        <td className="px-4 py-4 text-right text-orange-600 font-medium">{b.transition > 0 ? fmt(b.transition) : "—"}</td>
                        <td className="px-4 py-4 text-slate-500 text-xs">{b.sectors.join(", ")}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-100 rounded-full h-1.5">
                              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-slate-500">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                  <tr>
                    <td className="px-4 py-3 font-bold text-slate-800">Total ({filtered.length} banks)</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{fmt(grandTotal)}</td>
                    <td className="px-4 py-3 text-right font-bold text-[#1f4286]">{fmt(totalGreen)}</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-600">{fmt(totalSocial)}</td>
                    <td className="px-4 py-3 text-right font-bold text-teal-600">{fmt(totalSustainability)}</td>
                    <td className="px-4 py-3 text-right font-bold text-purple-600">{fmt(totalSustainabilityLinked)}</td>
                    <td className="px-4 py-3 text-right font-bold text-orange-600">{fmt(totalTransition)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
