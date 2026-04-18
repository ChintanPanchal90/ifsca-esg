import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SYSTEM_PROMPT = `You are an expert ESG bond analytics assistant for the IFSCA ESG Platform — the official ESG disclosure repository for GIFT IFSC (India's International Financial Services Centre).

KEY FACTS:
- Amounts are stored in raw USD. Always present as "USD X.X Mn".
- India's financial year runs April–March. FY 2024-25 = April 2024 – March 2025.
- Today's date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}.
- "Last 5 financial years" means FY 2021-22 through FY 2025-26.
- Bond types: green bond, social bond, sustainability bond, sustainability-linked bond.
- Never fabricate data — only use what is in the dataset.

OUTPUT FORMAT — You MUST respond with a single valid JSON object (no markdown, no code fences):
{
  "answer": "Detailed text explanation with specific numbers, bullet points, and rankings.",
  "chart": {
    "type": "bar" | "pie" | "line",
    "title": "Short descriptive chart title",
    "unit": "USD Mn" | "Count" | "%",
    "data": [
      { "name": "Short label (max 25 chars)", "value": 123.4 }
    ]
  }
}

CHART SELECTION RULES:
- "bar"  → top-N rankings, comparisons between entities, amounts by issuer/sector/country
- "pie"  → proportions, shares, distributions (bond types, standards, sectors)
- "line" → trends over time, year-wise issuance, time series
- Set "chart" to null ONLY if no data can meaningfully be visualised (e.g. a simple yes/no question).
- For "bar" charts with many labels keep to top 10 max.
- "value" must always be a plain number (no strings, no currency symbols).
- Keep "name" short so it fits on chart axes.`;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured. Please add it to Vercel environment variables." },
        { status: 503 }
      );
    }

    const { query } = await req.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }

    // Fetch all data
    const [{ data: instruments }, { data: issuers }, { data: loans }, { data: funds }] =
      await Promise.all([
        supabase
          .from("instruments")
          .select("id, title, instrument_type, amount_usd, original_currency, original_amount, issue_date, esg_standard, arranger, sector, status, issuers(name, type, country)")
          .order("issue_date", { ascending: false }),
        supabase.from("issuers").select("id, name, type, country, website"),
        supabase.from("loans").select("*"),
        supabase.from("funds").select("*"),
      ]);

    const bondRows = (instruments ?? []).map((i: Record<string, unknown>) => {
      const issuer = i.issuers as Record<string, string> | null;
      return {
        isin:          i.title,
        issuer:        issuer?.name ?? "Unknown",
        issuer_type:   issuer?.type ?? "",
        country:       issuer?.country ?? "",
        bond_type:     i.instrument_type,
        amount_usd_mn: parseFloat(((i.amount_usd as number) / 1_000_000).toFixed(1)),
        currency:      i.original_currency,
        issue_date:    i.issue_date,
        financial_year: getFY(i.issue_date as string),
        esg_standard:  i.esg_standard || "Not specified",
        arranger:      i.arranger || "Not available",
        sector:        i.sector || "Not specified",
        status:        i.status,
      };
    });

    const dataContext = `
=== BONDS (${bondRows.length} instruments) ===
${JSON.stringify(bondRows, null, 2)}

=== ISSUERS (${(issuers ?? []).length}) ===
${JSON.stringify(issuers ?? [], null, 2)}

=== ESG LOANS (${(loans ?? []).length}) ===
${JSON.stringify(loans ?? [], null, 2)}

=== ESG FUNDS (${(funds ?? []).length}) ===
${JSON.stringify(funds ?? [], null, 2)}`;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Dataset:\n${dataContext}\n\nQuestion: ${query}`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";

    // Robustly parse JSON from Claude's response
    let parsed: { answer: string; chart: unknown } = { answer: raw, chart: null };
    try {
      // Try direct parse first
      parsed = JSON.parse(raw);
    } catch {
      // Extract JSON from within the text if wrapped in markdown
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { /* fall through */ }
      }
    }

    return NextResponse.json({
      answer: parsed.answer ?? raw,
      chart:  parsed.chart  ?? null,
    });
  } catch (err: unknown) {
    console.error("AI query error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to process query: ${msg}` }, { status: 500 });
  }
}

function getFY(dateStr: string): string {
  if (!dateStr) return "Unknown";
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return m >= 4 ? `FY ${y}-${String(y + 1).slice(2)}` : `FY ${y - 1}-${String(y).slice(2)}`;
}
