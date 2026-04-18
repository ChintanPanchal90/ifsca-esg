import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SYSTEM_PROMPT = `You are an expert ESG bond analytics assistant for the IFSCA ESG Platform — the official ESG disclosure repository for GIFT IFSC (India's International Financial Services Centre).

You analyse structured bond data and answer questions clearly and precisely.

KEY FACTS:
- Amounts in the database are stored in raw USD (e.g. 500000000 = USD 500 million). Always present amounts as "USD X.X Mn" or "USD X.X Bn".
- India's financial year runs April to March. FY 2024-25 = April 2024 – March 2025.
- Today's date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}.
- "Last 5 financial years" from today means FY 2021-22 through FY 2025-26.
- Bond types: green bond, social bond, sustainability bond, sustainability-linked bond.
- ESG standards: ICMA Green Bond Principles, ICMA Social Bond Principles, ICMA Sustainability Bond Guidelines, ICMA Sustainability-Linked Bond Principles.

RESPONSE RULES:
- Always use specific numbers, names, and percentages.
- Format lists with bullet points or numbered rankings.
- For top-N queries, clearly rank and show amounts.
- If a field is missing/empty ("—"), say "data not available".
- Keep answers concise but complete. Use tables where helpful.
- Never make up data — only use what is in the dataset provided.`;

export async function POST(req: NextRequest) {
  try {
    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured. Please add it to your environment variables." },
        { status: 503 }
      );
    }

    const { query } = await req.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }

    // Fetch all relevant data from Supabase
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

    // Build compact data context
    const bondRows = (instruments ?? []).map((i: Record<string, unknown>) => {
      const issuer = i.issuers as Record<string, string> | null;
      const amtMn = ((i.amount_usd as number) / 1_000_000).toFixed(1);
      const date = i.issue_date as string;
      const fy = getFY(date);
      return {
        isin: i.title,
        issuer: issuer?.name ?? "Unknown",
        issuer_type: issuer?.type ?? "",
        country: issuer?.country ?? "",
        bond_type: i.instrument_type,
        amount_usd_mn: parseFloat(amtMn),
        currency: i.original_currency,
        issue_date: date,
        financial_year: fy,
        esg_standard: i.esg_standard || "Not specified",
        arranger: i.arranger || "Not available",
        sector: i.sector || "Not specified",
        status: i.status,
      };
    });

    const dataContext = `
=== BONDS DATA (${bondRows.length} ESG-labelled instruments) ===
${JSON.stringify(bondRows, null, 2)}

=== ISSUERS (${(issuers ?? []).length} entities) ===
${JSON.stringify(issuers ?? [], null, 2)}

=== ESG LOANS (${(loans ?? []).length} records) ===
${JSON.stringify(loans ?? [], null, 2)}

=== ESG FUNDS (${(funds ?? []).length} records) ===
${JSON.stringify(funds ?? [], null, 2)}
`;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here is the complete IFSCA ESG Platform dataset:\n${dataContext}\n\nUser question: ${query}`,
        },
      ],
    });

    const answer =
      message.content[0].type === "text"
        ? message.content[0].text
        : "Sorry, I could not process your query.";

    return NextResponse.json({ answer });
  } catch (err: unknown) {
    console.error("AI query error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to process query: ${message}` }, { status: 500 });
  }
}

// Helper: derive financial year from ISO date string
function getFY(dateStr: string): string {
  if (!dateStr) return "Unknown";
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1; // 1-indexed
  return m >= 4 ? `FY ${y}-${String(y + 1).slice(2)}` : `FY ${y - 1}-${String(y).slice(2)}`;
}
