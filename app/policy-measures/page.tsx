"use client";

import { useState } from "react";

const NAVY = "#1f4286";
const ORANGE = "#fd5f00";

type TabKey = "regulations" | "circulars" | "government";

const tabs: { key: TabKey; label: string }[] = [
  { key: "regulations", label: "Regulations" },
  { key: "circulars", label: "Circulars" },
  { key: "government", label: "Govt. of India / Other Authorities" },
];

const regulations = [
  {
    sr: 1,
    date: "17/04/2025",
    title:
      "IFSCA (Capital Market Intermediaries) Regulations, 2025 – ESG Ratings and Data Product Providers (ERDPP)",
    url: "https://ifsca.gov.in/Common/PreviewPdf?id=21626bde60601ef44a0ed022016d0592&fileName=IFSCA__Capital_Market_Intermediaries__Regulations_2025___ESG_Rating_and_Data_Product_Providers__ERDPP__20250806_0607.pdf",
  },
  {
    sr: 2,
    date: "30/08/2024",
    title:
      "IFSCA (Listing) Regulations 2024 – Framework for ESG Labelled Debt Securities",
    url: "https://ifsca.gov.in/Common/PreviewPdf?id=21626bde60601ef44a0ed022016b1fa9&fileName=IFSCA__Listing__Regulations_2024___Framework_for_ESG_labelled_debt_securities_20250806_1155.pdf",
  },
];

const circulars = [
  {
    sr: 1,
    date: "05/08/2025",
    title:
      "Master Circular for ESG Ratings and Data Products Providers in the IFSC",
    url: "https://ifsca.gov.in/Common/PreviewPdf?id=21626bde60601ef44a0ed022016b12f1&fileName=Master_Circular_for_ESG_Ratings_and_Data_Products_Providers_in_the_IFSC_20250806_1153.pdf",
  },
  {
    sr: 2,
    date: "29/07/2025",
    title: "Framework for Transition Bonds",
    url: "https://ifsca.gov.in/Common/PreviewPdf?id=21626bde60601ef44a0ed022016b5046&fileName=Framework_for_Transition_Bonds_20250806_1207.pdf",
  },
  {
    sr: 3,
    date: "21/11/2024",
    title:
      "Principles to Mitigate the Risk of Greenwashing in ESG Labelled Debt Securities in the IFSC",
    url: "https://ifsca.gov.in/Common/PreviewPdf?id=21626bde60601ef44a0ed022016b2c71&fileName=Principles_to_mitigate_the_Risk_of_Greenwashing_in_ESG_labelled_debt_securities_in_the_IFSC_20250806_1155.pdf",
  },
  {
    sr: 4,
    date: "24/09/2024",
    title:
      "Trading and Settlement of Sovereign Green Bonds (SGrBs) in IFSC",
    url: "https://ifsca.gov.in/Common/PreviewPdf?id=21626bde60601ef44a0ed022016b313f&fileName=Trading_and_Settlement_of_Sovereign_Green_Bonds__SGrBs__in_IFSC_20250806_1156.pdf",
  },
  {
    sr: 5,
    date: "18/01/2023",
    title:
      "Disclosures by Fund Management Entities for Environmental, Social or Governance (ESG) Schemes",
    url: "https://ifsca.gov.in/Common/PreviewPdf?id=21626bde60601ef44a0ed022016b3c3f&fileName=Disclosures_by_Fund_Management_Entities_for_Environmental__Social_or_Governance__ESG__Schemes_20250806_1156.pdf",
  },
  {
    sr: 6,
    date: "26/04/2022",
    title:
      "Guidance Framework on Sustainable and Sustainability Linked Lending by Financial Institutions",
    url: "https://ifsca.gov.in/Common/PreviewPdf?id=21626bde60601ef44a0ed022016b43d3&fileName=Guidance_framework_on_Sustainable_and_Sustainability_linked_lending_by_financial_institutions_20250806_1157.pdf",
  },
];

const government = [
  {
    sr: 1,
    date: "29/08/2024",
    title:
      "RBI Scheme for Trading and Settlement of Sovereign Green Bonds in the International Financial Services Centre in India",
    url: "https://ifsca.gov.in/Common/PreviewPdf?id=21626bde60601ef44a0ed022016b49a1&fileName=RBI_Scheme_for_Trading_and_Settlement_of_Sovereign_Green_Bonds_in_the_International_Financial_Services_Centre_in_India_20250806_1157.pdf",
  },
];

const dataMap: Record<TabKey, typeof regulations> = {
  regulations,
  circulars,
  government,
};

const tabDescriptions: Record<TabKey, string> = {
  regulations:
    "Key IFSCA regulations governing ESG frameworks and sustainable finance within the GIFT IFSC.",
  circulars:
    "IFSCA circulars providing guidance on ESG ratings, greenwashing, green bonds, and sustainable lending.",
  government:
    "Circulars, notifications, and public notices from Government of India and other regulatory authorities.",
};

export default function PolicyMeasuresPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("regulations");

  const rows = dataMap[activeTab];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
          Policy Measures
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Regulations, circulars, and government notifications related to sustainable finance in GIFT IFSC
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="rounded-lg p-4 text-left transition-all border"
            style={
              activeTab === t.key
                ? { background: NAVY, borderColor: NAVY }
                : { background: "white", borderColor: "#e5e7eb" }
            }
          >
            <p
              className="text-2xl font-bold"
              style={{ color: activeTab === t.key ? "#fff" : NAVY }}
            >
              {dataMap[t.key].length}
            </p>
            <p
              className={`text-sm font-medium mt-1 ${
                activeTab === t.key ? "text-blue-100" : "text-gray-500"
              }`}
            >
              {t.label}
            </p>
          </button>
        ))}
      </div>

      {/* Tab buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={
              activeTab === t.key
                ? { background: NAVY, color: "#fff" }
                : { background: "#e5e7eb", color: "#374151" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-500 mb-4">{tabDescriptions[activeTab]}</p>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: NAVY }}>
              <th className="text-left text-white px-4 py-3 font-semibold w-16">
                Sr. No
              </th>
              <th className="text-left text-white px-4 py-3 font-semibold w-28">
                Date
              </th>
              <th className="text-left text-white px-4 py-3 font-semibold">
                Title
              </th>
              <th className="text-center text-white px-4 py-3 font-semibold w-24">
                View
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.sr}
                className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                style={{ borderBottom: "1px solid #e5e7eb" }}
              >
                <td className="px-4 py-3 font-medium" style={{ color: NAVY }}>
                  {row.sr}
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {row.date}
                </td>
                <td className="px-4 py-3 text-gray-800">{row.title}</td>
                <td className="px-4 py-3 text-center">
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                    style={{ background: ORANGE }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "#e05400")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        ORANGE)
                    }
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {rows.map((row) => (
          <div
            key={row.sr}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <span
                  className="inline-block text-xs font-bold text-white px-2 py-0.5 rounded mb-2"
                  style={{ background: NAVY }}
                >
                  #{row.sr}
                </span>
                <p className="text-sm font-medium text-gray-800 mb-1">
                  {row.title}
                </p>
                <p className="text-xs text-gray-500">{row.date}</p>
              </div>
              <a
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-white text-xs font-semibold px-3 py-1.5 rounded"
                style={{ background: ORANGE }}
              >
                PDF
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Source attribution */}
      <div className="mt-6 text-xs text-gray-400 text-center">
        Source:{" "}
        <a
          href="https://ifsca.gov.in/Pages/Contents/Sustainable_Finance"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-600"
        >
          IFSCA — Sustainable Finance
        </a>
      </div>
    </div>
  );
}
