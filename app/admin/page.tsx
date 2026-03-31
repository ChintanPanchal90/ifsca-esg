"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Issuer, Instrument, Loan, Fund } from "@/lib/types";

type Tab = "instruments" | "loans" | "funds" | "issuers";

function fmt(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

// ── Instrument Form ──────────────────────────────────────────────
const emptyInstrument = {
  issuer_id: "",
  instrument_type: "green bond",
  title: "",
  amount_usd: "",
  original_currency: "USD",
  original_amount: "",
  issue_date: "",
  maturity_date: "",
  esg_standard: "ICMA",
  arranger: "",
  sector: "",
  status: "active",
};

// ── Loan Form ────────────────────────────────────────────────────
const emptyLoan = {
  bank_name: "",
  loan_category: "green",
  amount_usd: "",
  sector: "",
  borrower_type: "corporate",
  esg_methodology: "",
  disbursement_date: "",
};

// ── Fund Form ────────────────────────────────────────────────────
const emptyFund = {
  fund_name: "",
  fund_manager: "",
  strategy: "green",
  aum_usd: "",
  domicile: "GIFT IFSC",
  esg_methodology: "",
  sectors: "",
};

// ── Issuer Form ──────────────────────────────────────────────────
const emptyIssuer = {
  name: "",
  type: "corporate",
  country: "India",
  website: "",
};

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("instruments");
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const [instrForm, setInstrForm] = useState({ ...emptyInstrument });
  const [loanForm, setLoanForm] = useState({ ...emptyLoan });
  const [fundForm, setFundForm] = useState({ ...emptyFund });
  const [issuerForm, setIssuerForm] = useState({ ...emptyIssuer });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/login");
      else loadAll();
    });
  }, []);

  async function loadAll() {
    setLoading(true);
    const [{ data: isr }, { data: ins }, { data: ln }, { data: fn }] = await Promise.all([
      supabase.from("issuers").select("*").order("name"),
      supabase.from("instruments").select("*, issuers(name)").order("issue_date", { ascending: false }),
      supabase.from("loans").select("*").order("disbursement_date", { ascending: false }),
      supabase.from("funds").select("*").order("fund_name"),
    ]);
    setIssuers(isr ?? []);
    setInstruments(ins ?? []);
    setLoans(ln ?? []);
    setFunds(fn ?? []);
    setLoading(false);
  }

  function openAdd() {
    setEditId(null);
    setMessage("");
    if (tab === "instruments") setInstrForm({ ...emptyInstrument });
    if (tab === "loans") setLoanForm({ ...emptyLoan });
    if (tab === "funds") setFundForm({ ...emptyFund });
    if (tab === "issuers") setIssuerForm({ ...emptyIssuer });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openEdit(item: Instrument | Loan | Fund | Issuer) {
    setEditId(item.id);
    setMessage("");
    if (tab === "instruments") {
      const i = item as Instrument;
      setInstrForm({
        issuer_id: String(i.issuer_id ?? ""),
        instrument_type: i.instrument_type,
        title: i.title,
        amount_usd: String(i.amount_usd),
        original_currency: i.original_currency ?? "USD",
        original_amount: String(i.original_amount ?? ""),
        issue_date: i.issue_date ?? "",
        maturity_date: i.maturity_date ?? "",
        esg_standard: i.esg_standard ?? "ICMA",
        arranger: i.arranger ?? "",
        sector: i.sector ?? "",
        status: i.status ?? "active",
      });
    }
    if (tab === "loans") {
      const l = item as Loan;
      setLoanForm({
        bank_name: l.bank_name,
        loan_category: l.loan_category,
        amount_usd: String(l.amount_usd),
        sector: l.sector ?? "",
        borrower_type: l.borrower_type ?? "corporate",
        esg_methodology: l.esg_methodology ?? "",
        disbursement_date: l.disbursement_date ?? "",
      });
    }
    if (tab === "funds") {
      const f = item as Fund;
      setFundForm({
        fund_name: f.fund_name,
        fund_manager: f.fund_manager,
        strategy: f.strategy ?? "green",
        aum_usd: String(f.aum_usd ?? ""),
        domicile: f.domicile ?? "GIFT IFSC",
        esg_methodology: f.esg_methodology ?? "",
        sectors: (f.sectors ?? []).join(", "),
      });
    }
    if (tab === "issuers") {
      const i = item as Issuer;
      setIssuerForm({ name: i.name, type: i.type, country: i.country ?? "India", website: i.website ?? "" });
    }
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    let payload: Record<string, unknown> = {};
    let table = tab;

    if (tab === "instruments") {
      payload = { ...instrForm, issuer_id: Number(instrForm.issuer_id), amount_usd: Number(instrForm.amount_usd), original_amount: Number(instrForm.original_amount) || null };
    }
    if (tab === "loans") {
      payload = { ...loanForm, amount_usd: Number(loanForm.amount_usd) };
    }
    if (tab === "funds") {
      payload = { ...fundForm, aum_usd: Number(fundForm.aum_usd), sectors: fundForm.sectors ? fundForm.sectors.split(",").map((s) => s.trim()).filter(Boolean) : [] };
    }
    if (tab === "issuers") {
      payload = { ...issuerForm };
    }

    const { error } = editId !== null
      ? await supabase.from(table).update(payload).eq("id", editId)
      : await supabase.from(table).insert(payload);

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage(editId !== null ? "Record updated successfully." : "Record added successfully.");
      setShowForm(false);
      loadAll();
    }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    await supabase.from(tab).delete().eq("id", id);
    setDeleteConfirm(null);
    loadAll();
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "instruments", label: "Bonds", count: instruments.length },
    { key: "loans", label: "Loans", count: loans.length },
    { key: "funds", label: "Funds", count: funds.length },
    { key: "issuers", label: "Issuers", count: issuers.length },
  ];

  const F = ({ label, value, onChange, type = "text", required = false, placeholder = "" }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
    </div>
  );

  const S = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-green-500">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
          <p className="text-sm text-slate-500 mt-1">Add, edit and delete ESG records</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openAdd} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">
            + Add Record
          </button>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setShowForm(false); setMessage(""); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-green-600 text-green-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            {t.label} <span className="ml-1 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm ${message.startsWith("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-900">{editId !== null ? "Edit" : "Add"} {tabs.find((t) => t.key === tab)?.label}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* INSTRUMENT FORM */}
            {tab === "instruments" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Issuer <span className="text-red-500">*</span></label>
                  <select value={instrForm.issuer_id} onChange={(e) => setInstrForm((f) => ({ ...f, issuer_id: e.target.value }))} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select issuer...</option>
                    {issuers.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
                <F label="Title" value={instrForm.title} onChange={(v) => setInstrForm((f) => ({ ...f, title: v }))} required placeholder="e.g. SBI Green Bond 2025" />
                <S label="Instrument Type" value={instrForm.instrument_type} onChange={(v) => setInstrForm((f) => ({ ...f, instrument_type: v }))} options={["green bond","social bond","sustainability bond","sustainability-linked bond","transition bond"].map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))} />
                <F label="Amount (USD)" value={instrForm.amount_usd} onChange={(v) => setInstrForm((f) => ({ ...f, amount_usd: v }))} type="number" required placeholder="e.g. 500000000" />
                <F label="Original Currency" value={instrForm.original_currency} onChange={(v) => setInstrForm((f) => ({ ...f, original_currency: v }))} placeholder="USD" />
                <F label="Issue Date" value={instrForm.issue_date} onChange={(v) => setInstrForm((f) => ({ ...f, issue_date: v }))} type="date" />
                <F label="Maturity Date" value={instrForm.maturity_date} onChange={(v) => setInstrForm((f) => ({ ...f, maturity_date: v }))} type="date" />
                <S label="ESG Standard" value={instrForm.esg_standard} onChange={(v) => setInstrForm((f) => ({ ...f, esg_standard: v }))} options={["ICMA","CBI","internal","TCFD"].map((s) => ({ value: s, label: s }))} />
                <F label="Arranger" value={instrForm.arranger} onChange={(v) => setInstrForm((f) => ({ ...f, arranger: v }))} placeholder="e.g. HSBC" />
                <F label="Sector" value={instrForm.sector} onChange={(v) => setInstrForm((f) => ({ ...f, sector: v }))} placeholder="e.g. Renewable Energy" />
                <S label="Status" value={instrForm.status} onChange={(v) => setInstrForm((f) => ({ ...f, status: v }))} options={["active","matured","cancelled"].map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} />
              </div>
            )}

            {/* LOAN FORM */}
            {tab === "loans" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Bank Name" value={loanForm.bank_name} onChange={(v) => setLoanForm((f) => ({ ...f, bank_name: v }))} required placeholder="e.g. SBI" />
                <S label="Loan Category" value={loanForm.loan_category} onChange={(v) => setLoanForm((f) => ({ ...f, loan_category: v }))} options={["green","social","sustainability","sustainability-linked","transition"].map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))} />
                <F label="Amount (USD)" value={loanForm.amount_usd} onChange={(v) => setLoanForm((f) => ({ ...f, amount_usd: v }))} type="number" required placeholder="e.g. 100000000" />
                <F label="Sector" value={loanForm.sector} onChange={(v) => setLoanForm((f) => ({ ...f, sector: v }))} placeholder="e.g. Solar Energy" />
                <S label="Borrower Type" value={loanForm.borrower_type} onChange={(v) => setLoanForm((f) => ({ ...f, borrower_type: v }))} options={["corporate","SME","individual"].map((b) => ({ value: b, label: b.charAt(0).toUpperCase() + b.slice(1) }))} />
                <F label="ESG Methodology" value={loanForm.esg_methodology} onChange={(v) => setLoanForm((f) => ({ ...f, esg_methodology: v }))} placeholder="e.g. ICMA Green Loan Principles" />
                <F label="Disbursement Date" value={loanForm.disbursement_date} onChange={(v) => setLoanForm((f) => ({ ...f, disbursement_date: v }))} type="date" />
              </div>
            )}

            {/* FUND FORM */}
            {tab === "funds" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Fund Name" value={fundForm.fund_name} onChange={(v) => setFundForm((f) => ({ ...f, fund_name: v }))} required placeholder="e.g. GIFT ESG Opportunities Fund" />
                <F label="Fund Manager" value={fundForm.fund_manager} onChange={(v) => setFundForm((f) => ({ ...f, fund_manager: v }))} required placeholder="e.g. Mirae Asset" />
                <S label="Strategy" value={fundForm.strategy} onChange={(v) => setFundForm((f) => ({ ...f, strategy: v }))} options={["green","transition","impact","ESG screened"].map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} />
                <F label="AUM (USD)" value={fundForm.aum_usd} onChange={(v) => setFundForm((f) => ({ ...f, aum_usd: v }))} type="number" placeholder="e.g. 250000000" />
                <F label="Domicile" value={fundForm.domicile} onChange={(v) => setFundForm((f) => ({ ...f, domicile: v }))} placeholder="GIFT IFSC" />
                <F label="ESG Methodology" value={fundForm.esg_methodology} onChange={(v) => setFundForm((f) => ({ ...f, esg_methodology: v }))} placeholder="e.g. MSCI ESG Rating" />
                <div className="sm:col-span-2">
                  <F label="Sectors (comma-separated)" value={fundForm.sectors} onChange={(v) => setFundForm((f) => ({ ...f, sectors: v }))} placeholder="e.g. Solar, Wind, Clean Tech" />
                </div>
              </div>
            )}

            {/* ISSUER FORM */}
            {tab === "issuers" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Issuer Name" value={issuerForm.name} onChange={(v) => setIssuerForm((f) => ({ ...f, name: v }))} required placeholder="e.g. State Bank of India" />
                <S label="Type" value={issuerForm.type} onChange={(v) => setIssuerForm((f) => ({ ...f, type: v }))} options={["bank","corporate","sovereign","financial institution"].map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))} />
                <F label="Country" value={issuerForm.country} onChange={(v) => setIssuerForm((f) => ({ ...f, country: v }))} placeholder="India" />
                <F label="Website" value={issuerForm.website} onChange={(v) => setIssuerForm((f) => ({ ...f, website: v }))} placeholder="https://example.com" />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60">
                {saving ? "Saving..." : editId !== null ? "Save Changes" : "Add Record"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Records List */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl border border-gray-100 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {/* INSTRUMENTS */}
          {tab === "instruments" && instruments.map((inst) => (
            <div key={inst.id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{inst.title}</p>
                <p className="text-xs text-slate-400">{(inst.issuers as { name: string } | undefined)?.name} · {inst.sector} · {inst.esg_standard} · {inst.issue_date}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-bold text-slate-700">{fmt(inst.amount_usd)}</span>
                <button onClick={() => openEdit(inst)} className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50">Edit</button>
                {deleteConfirm === inst.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-red-600">Sure?</span>
                    <button onClick={() => handleDelete(inst.id)} className="text-xs px-2 py-1 bg-red-600 text-white rounded-lg">Yes</button>
                    <button onClick={() => setDeleteConfirm(null)} className="text-xs px-2 py-1 border border-gray-200 rounded-lg">No</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(inst.id)} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">Delete</button>
                )}
              </div>
            </div>
          ))}

          {/* LOANS */}
          {tab === "loans" && loans.map((loan) => (
            <div key={loan.id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{loan.bank_name}</p>
                <p className="text-xs text-slate-400 capitalize">{loan.loan_category} · {loan.sector} · {loan.borrower_type} · {loan.disbursement_date}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-bold text-slate-700">{fmt(loan.amount_usd)}</span>
                <button onClick={() => openEdit(loan)} className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50">Edit</button>
                {deleteConfirm === loan.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-red-600">Sure?</span>
                    <button onClick={() => handleDelete(loan.id)} className="text-xs px-2 py-1 bg-red-600 text-white rounded-lg">Yes</button>
                    <button onClick={() => setDeleteConfirm(null)} className="text-xs px-2 py-1 border border-gray-200 rounded-lg">No</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(loan.id)} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">Delete</button>
                )}
              </div>
            </div>
          ))}

          {/* FUNDS */}
          {tab === "funds" && funds.map((fund) => (
            <div key={fund.id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{fund.fund_name}</p>
                <p className="text-xs text-slate-400">{fund.fund_manager} · {fund.strategy} · {fund.domicile}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-bold text-slate-700">{fmt(fund.aum_usd ?? 0)}</span>
                <button onClick={() => openEdit(fund)} className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50">Edit</button>
                {deleteConfirm === fund.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-red-600">Sure?</span>
                    <button onClick={() => handleDelete(fund.id)} className="text-xs px-2 py-1 bg-red-600 text-white rounded-lg">Yes</button>
                    <button onClick={() => setDeleteConfirm(null)} className="text-xs px-2 py-1 border border-gray-200 rounded-lg">No</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(fund.id)} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">Delete</button>
                )}
              </div>
            </div>
          ))}

          {/* ISSUERS */}
          {tab === "issuers" && issuers.map((issuer) => (
            <div key={issuer.id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{issuer.name}</p>
                <p className="text-xs text-slate-400 capitalize">{issuer.type} · {issuer.country}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openEdit(issuer)} className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50">Edit</button>
                {deleteConfirm === issuer.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-red-600">Sure?</span>
                    <button onClick={() => handleDelete(issuer.id)} className="text-xs px-2 py-1 bg-red-600 text-white rounded-lg">Yes</button>
                    <button onClick={() => setDeleteConfirm(null)} className="text-xs px-2 py-1 border border-gray-200 rounded-lg">No</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(issuer.id)} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
