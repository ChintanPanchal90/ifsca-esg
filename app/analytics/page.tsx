"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
  LineChart, Line,
} from "recharts";

const NAVY   = "#1f4286";
const ORANGE = "#fd5f00";

const CHART_COLORS = [
  "#1f4286", "#fd5f00", "#0d9488", "#8b5cf6",
  "#22c55e", "#f59e0b", "#ef4444", "#3b82f6",
  "#ec4899", "#14b8a6",
];

const SUGGESTED = [
  "Who are the top 5 issuers by total issuance amount?",
  "What is the total issuance in last 5 financial years?",
  "Which ESG standards are most commonly used?",
  "What is the total outstanding amount as on date?",
  "Show me issuance trend year-wise by bond type",
  "Which sectors have the highest green bond issuance?",
  "Who are the top 3 issuers of social bonds?",
  "What is the share of each bond type in total issuance?",
];

type ChartData = { name: string; value: number };
type ChartPayload = {
  type: "bar" | "pie" | "line";
  title: string;
  unit: string;
  data: ChartData[];
};

type Message = {
  role: "user" | "assistant";
  content: string;
  chart?: ChartPayload | null;
  loading?: boolean;
};

// ── Custom tooltip for bar/line ──────────────────────────────────────────────
function CustomTooltip({ active, payload, label, unit }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string; unit: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p style={{ color: NAVY }}>{payload[0].value.toLocaleString()} {unit}</p>
    </div>
  );
}

// ── Custom tooltip for pie ───────────────────────────────────────────────────
function PieTooltip({ active, payload, unit }: {
  active?: boolean; payload?: Array<{ name: string; value: number }>; unit: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-700">{payload[0].name}</p>
      <p style={{ color: NAVY }}>{payload[0].value.toLocaleString()} {unit}</p>
    </div>
  );
}

// ── Chart renderer ───────────────────────────────────────────────────────────
function ChartBlock({ chart }: { chart: ChartPayload }) {
  const { type, title, unit, data } = chart;
  if (!data?.length) return null;

  return (
    <div className="mt-4 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <p className="text-sm font-semibold text-gray-700 mb-4">{title}</p>

      {type === "bar" && (
        <ResponsiveContainer width="100%" height={Math.max(220, data.length * 42)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 60, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => v.toLocaleString()} />
            <YAxis
              type="category" dataKey="name" width={160}
              tick={{ fontSize: 11, fill: "#475569" }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {type === "pie" && (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data} dataKey="value" nameKey="name"
              cx="50%" cy="50%" outerRadius={110} innerRadius={55}
              paddingAngle={2}
              label={({ name, percent }: { name?: string; percent?: number }) =>
                `${name ?? ""} (${((percent ?? 0) * 100).toFixed(1)}%)`
              }
              labelLine={true}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip unit={unit} />} />
            <Legend
              formatter={(value) => (
                <span style={{ fontSize: 11, color: "#475569" }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}

      {type === "line" && (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v.toLocaleString()} />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            <Line
              type="monotone" dataKey="value"
              stroke={NAVY} strokeWidth={2.5}
              dot={{ fill: NAVY, r: 4 }}
              activeDot={{ r: 6, fill: ORANGE }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      <p className="text-xs text-gray-400 mt-2 text-right">Unit: {unit}</p>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail]         = useState("");
  const [messages, setMessages]           = useState<Message[]>([]);
  const [input, setInput]                 = useState("");
  const [busy, setBusy]                   = useState(false);
  const bottomRef                         = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAuthenticated(true);
        setUserEmail(data.user.email ?? "");
      } else {
        setAuthenticated(false);
      }
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendQuery(query: string) {
    if (!query.trim() || busy) return;
    setInput("");
    setBusy(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: query },
      { role: "assistant", content: "", loading: true },
    ]);

    try {
      const res  = await fetch("/api/ai-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role:    "assistant",
          content: data.answer ?? data.error ?? "Sorry, something went wrong.",
          chart:   data.chart  ?? null,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "Network error. Please try again.", chart: null },
      ]);
    } finally {
      setBusy(false);
    }
  }

  // Loading
  if (authenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-[#1f4286] rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!authenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
               style={{ background: "#eef2fb" }}>
            <svg className="w-8 h-8" fill="none" stroke={NAVY} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: NAVY }}>AI Analytics</h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Ask natural language questions about IFSCA ESG bond data — issuance trends, top issuers, standards analysis, and more. Responses include interactive charts.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 text-left">
            <p className="text-xs font-semibold text-amber-700 mb-1">Login Required</p>
            <p className="text-xs text-amber-600">This feature is available to authorised users only.</p>
          </div>
          <button
            onClick={() => router.push("/login?next=/analytics")}
            className="w-full text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: NAVY }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#17326a")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = NAVY)}
          >
            Sign In to Access
          </button>
        </div>
      </div>
    );
  }

  // Logged in
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col"
         style={{ minHeight: "calc(100vh - 120px)" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>AI Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Ask anything about IFSCA ESG bond data — answers include charts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 hidden sm:block">{userEmail}</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            AI Active
          </span>
        </div>
      </div>

      {/* Suggested queries (shown only when no messages yet) */}
      {messages.length === 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Suggested Queries
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((q) => (
              <button
                key={q}
                onClick={() => sendQuery(q)}
                disabled={busy}
                className="text-xs px-3 py-1.5 rounded-full border transition-all disabled:opacity-50 hover:text-white hover:bg-[#1f4286] hover:border-[#1f4286]"
                style={{ borderColor: NAVY, color: NAVY }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-5 mb-4 pr-1" style={{ maxHeight: "65vh" }}>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400">
            <svg className="w-12 h-12 mb-3 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm font-medium text-gray-500">Select a suggested query or type your own</p>
            <p className="text-xs text-gray-400 mt-1">Every answer includes a chart where applicable</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-start gap-2`}>

            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                   style={{ background: NAVY }}>
                <span className="text-white text-xs font-bold">AI</span>
              </div>
            )}

            <div className={`${msg.role === "user" ? "max-w-[75%]" : "flex-1"}`}>
              {/* Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "text-white rounded-tr-sm"
                    : "bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm"
                }`}
                style={msg.role === "user" ? { background: NAVY } : {}}
              >
                {msg.loading ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="flex gap-1">
                      {[0, 150, 300].map((delay) => (
                        <span key={delay} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: `${delay}ms` }} />
                      ))}
                    </div>
                    <span className="text-xs">Analysing data...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>

              {/* Chart — rendered below AI bubble */}
              {msg.role === "assistant" && !msg.loading && msg.chart && (
                <ChartBlock chart={msg.chart as ChartPayload} />
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-gray-200">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
        ))}

        {/* Quick suggested queries after first answer */}
        {messages.length >= 2 && messages.length < 8 && !busy && (
          <div className="flex flex-wrap gap-2 pl-9">
            {SUGGESTED.filter((q) => !messages.some((m) => m.content === q)).slice(0, 3).map((q) => (
              <button
                key={q}
                onClick={() => sendQuery(q)}
                className="text-xs px-3 py-1 rounded-full border text-gray-500 border-gray-200 hover:border-[#1f4286] hover:text-[#1f4286] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex items-end gap-2 p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendQuery(input); }
          }}
          placeholder="Ask about issuance trends, top issuers, standards, sectors... (Enter to send)"
          rows={2}
          disabled={busy}
          className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none resize-none bg-transparent leading-relaxed"
        />
        <button
          onClick={() => sendQuery(input)}
          disabled={busy || !input.trim()}
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
          style={{ background: ORANGE }}
          onMouseEnter={(e) => { if (!busy && input.trim()) (e.currentTarget as HTMLElement).style.background = "#e05400"; }}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = ORANGE)}
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 mt-2">
        Powered by Claude AI · Data from IFSCA ESG Platform
      </p>
    </div>
  );
}
