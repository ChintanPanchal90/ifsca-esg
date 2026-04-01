"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Instrument, Rating, Disclosure } from "@/lib/types";

const TYPE_COLORS: Record<string, string> = {
  "green bond": "bg-green-100 text-[#1f4286]",
  "social bond": "bg-blue-100 text-blue-700",
  "sustainability bond": "bg-teal-100 text-teal-700",
  "sustainability-linked bond": "bg-purple-100 text-purple-700",
  "transition bond": "bg-orange-100 text-orange-700",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-50 text-[#1f4286]",
  matured: "bg-gray-100 text-gray-500",
  cancelled: "bg-red-50 text-red-500",
};

function fmt(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

export default function InstrumentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [rating, setRating] = useState<Rating | null>(null);
  const [disclosures, setDisclosures] = useState<Disclosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: inst }, { data: rat }, { data: disc }] = await Promise.all([
        supabase.from("instruments").select("*, issuers(*)").eq("id", id).single(),
        supabase.from("ratings").select("*").eq("instrument_id", id).single(),
        supabase.from("disclosures").select("*").eq("instrument_id", id).order("year", { ascending: false }),
      ]);

      if (!inst) { setNotFound(true); setLoading(false); return; }
      setInstrument(inst);
      setRating(rat ?? null);
      setDisclosures(disc ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
      {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
    </div>
  );

  if (notFound) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <p className="text-4xl mb-3">📋</p>
      <p className="text-xl font-bold text-slate-800">Instrument not found</p>
      <Link href="/instruments" className="mt-4 inline-block text-[#1f4286] hover:underline text-sm">← Back to Bonds</Link>
    </div>
  );

  const issuer = instrument!.issuers as Record<string, string> | undefined;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Back */}
      <Link href="/instruments" className="text-sm text-[#1f4286] hover:underline">← Back to Bonds</Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${TYPE_COLORS[instrument!.instrument_type] ?? "bg-gray-100 text-gray-600"}`}>
                {instrument!.instrument_type}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${STATUS_COLORS[instrument!.status] ?? "bg-gray-100 text-gray-500"}`}>
                {instrument!.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{instrument!.title}</h1>
            <p className="text-sm text-slate-500 mt-1">Issued by <span className="font-semibold text-slate-700">{issuer?.name ?? "—"}</span></p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold text-[#1f4286]">{fmt(instrument!.amount_usd)}</p>
            <p className="text-xs text-slate-400 mt-0.5">{instrument!.original_currency !== "USD" ? `${instrument!.original_currency} ${instrument!.original_amount?.toLocaleString()}` : "USD"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Instrument Details */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Instrument Details</h2>
          <dl className="space-y-3">
            {[
              { label: "ESG Standard", value: instrument!.esg_standard },
              { label: "Sector", value: instrument!.sector },
              { label: "Arranger", value: instrument!.arranger },
              { label: "Issue Date", value: instrument!.issue_date },
              { label: "Maturity Date", value: instrument!.maturity_date },
            ].map((row) => (
              <div key={row.label} className="flex justify-between gap-4">
                <dt className="text-xs text-slate-400 font-medium">{row.label}</dt>
                <dd className="text-xs text-slate-700 font-semibold text-right">{row.value ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Issuer Details */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Issuer Details</h2>
          {issuer ? (
            <dl className="space-y-3">
              {[
                { label: "Name", value: issuer.name },
                { label: "Type", value: issuer.type },
                { label: "Country", value: issuer.country },
                { label: "Website", value: issuer.website },
              ].map((row) => (
                <div key={row.label} className="flex justify-between gap-4">
                  <dt className="text-xs text-slate-400 font-medium">{row.label}</dt>
                  <dd className="text-xs text-slate-700 font-semibold text-right">
                    {row.label === "Website" && row.value ? (
                      <a href={row.value} target="_blank" rel="noopener noreferrer" className="text-[#1f4286] hover:underline">{row.value.replace("https://", "")}</a>
                    ) : (row.value ?? "—")}
                  </dd>
                </div>
              ))}
            </dl>
          ) : <p className="text-sm text-slate-400">No issuer data</p>}
        </div>

        {/* Credit Rating */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Credit Rating</h2>
          {rating ? (
            rating.has_rating ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-slate-800">{rating.rating_value}</span>
                  <span className="text-sm text-slate-500">by {rating.agency}</span>
                </div>
                <p className="text-xs text-slate-400">Rated on: {rating.rated_on ?? "—"}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-2xl">—</span>
                <p className="text-sm">No credit rating obtained</p>
              </div>
            )
          ) : <p className="text-sm text-slate-400">No rating data available</p>}
        </div>

        {/* Disclosures */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Disclosures</h2>
          {disclosures.length === 0 ? (
            <p className="text-sm text-slate-400">No disclosures linked yet</p>
          ) : (
            <div className="space-y-2">
              {disclosures.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{d.title}</p>
                    <p className="text-xs text-slate-400 capitalize">{d.disclosure_type}{d.year ? ` · ${d.year}` : ""}</p>
                  </div>
                  {d.file_url ? (
                    <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1f4286] hover:underline shrink-0">View →</a>
                  ) : (
                    <span className="text-xs text-slate-300">No file</span>
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
