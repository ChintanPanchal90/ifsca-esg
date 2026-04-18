"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const NAVY   = "#1f4286";
const ORANGE = "#fd5f00";

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

type Message = {
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
};

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

    const userMsg: Message = { role: "user", content: query };
    const loadingMsg: Message = { role: "assistant", content: "", loading: true };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    try {
      const res = await fetch("/api/ai-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      const answer = data.answer ?? data.error ?? "Sorry, something went wrong.";
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: answer },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "Network error. Please try again." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  // ── Loading auth state ──────────────────────────────────────────────────
  if (authenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-[#1f4286] rounded-full animate-spin" />
      </div>
    );
  }

  // ── Not logged in ───────────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
               style={{ background: "#eef2fb" }}>
            <svg className="w-8 h-8" fill="none" stroke={NAVY} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.607L5 14.5m14.8.5l-1.15 2.9A9.065 9.065 0 0112 18a9.065 9.065 0 00-1.65.4m0 0L5 14.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: NAVY }}>AI Analytics</h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Ask natural language questions about IFSCA ESG bond data — issuance trends, top issuers, standards analysis, and more.
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

  // ── Logged in — AI Chat ─────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col" style={{ minHeight: "calc(100vh - 120px)" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>AI Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ask anything about IFSCA ESG bond data in plain English</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 hidden sm:block">{userEmail}</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            AI Active
          </span>
        </div>
      </div>

      {/* Suggested queries */}
      {messages.length === 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Suggested Queries</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((q) => (
              <button
                key={q}
                onClick={() => sendQuery(q)}
                disabled={busy}
                className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:text-white disabled:opacity-50"
                style={{ borderColor: NAVY, color: NAVY }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = NAVY; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = NAVY; }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1" style={{ maxHeight: "60vh" }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400">
            <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm font-medium text-gray-500">Start by selecting a suggested query above</p>
            <p className="text-xs text-gray-400 mt-1">or type your own question below</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 mt-1 shrink-0"
                   style={{ background: NAVY }}>
                <span className="text-white text-xs font-bold">AI</span>
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "text-white rounded-tr-sm"
                  : "bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm"
              }`}
              style={msg.role === "user" ? { background: NAVY } : {}}
            >
              {msg.loading ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs">Analysing data...</span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center ml-2 mt-1 shrink-0 bg-gray-200">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Show suggested queries again after first exchange */}
      {messages.length > 0 && messages.length < 6 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTED.slice(0, 4).map((q) => (
            <button
              key={q}
              onClick={() => sendQuery(q)}
              disabled={busy}
              className="text-xs px-3 py-1 rounded-full border text-gray-500 border-gray-200 hover:border-blue-900 hover:text-blue-900 transition-colors disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex items-end gap-2 p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendQuery(input);
            }
          }}
          placeholder="Ask a question about IFSCA ESG bond data... (Enter to send, Shift+Enter for new line)"
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
      <p className="text-center text-xs text-gray-400 mt-2">
        Powered by Claude AI · Data from IFSCA ESG Platform
      </p>
    </div>
  );
}
