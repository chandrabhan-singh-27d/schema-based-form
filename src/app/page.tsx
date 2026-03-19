"use client";

import Script from "next/script";
import { ChangeEvent, KeyboardEvent, useMemo, useState } from "react";
import {
  AnalyticsSummary,
  ColumnMapping,
  EMPTY_VALUE,
  RawRow,
  AiDatasetContext,
  autoDetectMapping,
  buildAiDatasetContext,
  formatCompactNumber,
  mappingLabels,
  parseCsv,
  summarizeRecords,
  toConversationRecords,
} from "@lib/chatbot-analytics";

type WorkbookLike = {
  SheetNames: string[];
  Sheets: Record<string, unknown>;
};

type ChartVisual = {
  chartType: "bar" | "line" | "donut" | "metric" | "none";
  title: string;
  description: string;
  items: Array<{
    label: string;
    value: number;
  }>;
  metric?: {
    label: string;
    value: string;
    detail: string;
  };
};

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
  visual?: ChartVisual | null;
  suggestions?: string[];
};

declare global {
  interface Window {
    XLSX?: {
      read(data: ArrayBuffer, options: { type: "array" }): WorkbookLike;
      utils: {
        sheet_to_json(sheet: unknown, options: { defval: string }): RawRow[];
      };
    };
  }
}

const starterMessages: ChatMessage[] = [
  {
    role: "assistant",
    text: "Upload a CSV or Excel file and I can answer free-form questions about the uploaded chatbot data. I can also return a visual with the answer when it helps.",
    suggestions: ["Give me an executive summary", "Show unresolved intent hotspots", "Compare channels", "What should I fix first?"],
  },
];

function InsightChart({
  title,
  subtitle,
  items,
  emptyLabel,
}: {
  title: string;
  subtitle: string;
  items: Array<{ label: string; value: number }>;
  emptyLabel: string;
}) {
  const highestValue = items[0]?.value ?? 0;

  return (
    <section className="rounded-[28px] border border-white/55 bg-white/88 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between gap-4 text-sm text-slate-700">
                <span className="truncate font-medium">{item.label}</span>
                <span className="shrink-0 text-slate-500">{item.value}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#f97316,#fb7185,#0f766e)]"
                  style={{ width: `${highestValue ? (item.value / highestValue) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">{emptyLabel}</p>
      )}
    </section>
  );
}

function ChatVisualCard({ visual }: { visual: ChartVisual }) {
  const highestValue = visual.items[0]?.value ?? 0;
  const total = visual.items.reduce((sum, item) => sum + item.value, 0);

  if (visual.chartType === "none") {
    return null;
  }

  if (visual.chartType === "metric" && visual.metric) {
    return (
      <div className="mt-3 rounded-[22px] border border-white/10 bg-white/6 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-orange-300">{visual.metric.label}</p>
        <p className="mt-2 text-3xl font-semibold text-white">{visual.metric.value}</p>
        <p className="mt-2 text-sm text-slate-300">{visual.metric.detail}</p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-[22px] border border-white/10 bg-white/6 p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold text-white">{visual.title}</p>
        <p className="mt-1 text-xs text-slate-300">{visual.description}</p>
      </div>

      {visual.chartType === "donut" ? (
        <div className="space-y-3">
          {visual.items.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-100">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[linear-gradient(90deg,#f97316,#fb7185,#0f766e)]" />
                <span>{item.label}</span>
              </div>
              <span className="text-slate-300">
                {item.value}
                {total ? ` (${Math.round((item.value / total) * 100)}%)` : ""}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {visual.items.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-slate-100">{item.label}</span>
                <span className="text-slate-300">{item.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${
                    visual.chartType === "line" ? "bg-teal-400" : "bg-[linear-gradient(90deg,#f97316,#fb7185)]"
                  }`}
                  style={{ width: `${highestValue ? (item.value / highestValue) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function defaultMapping(): ColumnMapping {
  return {
    userMessage: EMPTY_VALUE,
    botReply: EMPTY_VALUE,
    sessionId: EMPTY_VALUE,
    timestamp: EMPTY_VALUE,
    intent: EMPTY_VALUE,
    status: EMPTY_VALUE,
    feedback: EMPTY_VALUE,
    channel: EMPTY_VALUE,
  };
}

export default function Home() {
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>(defaultMapping);
  const [fileName, setFileName] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [scriptReady, setScriptReady] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(starterMessages);
  const [chatLoading, setChatLoading] = useState(false);

  const records = useMemo(() => toConversationRecords(rawRows, mapping), [mapping, rawRows]);
  const summary = useMemo<AnalyticsSummary | null>(() => (records.length ? summarizeRecords(records) : null), [records]);
  const datasetContext = useMemo<AiDatasetContext | null>(
    () => (summary && fileName ? buildAiDatasetContext(fileName, mapping, summary) : null),
    [fileName, mapping, summary]
  );

  const metricCards =
    summary?.metricCards ?? [
      { label: "Rows analyzed", value: "0", caption: "Upload a file to see metrics" },
      { label: "Reply coverage", value: "0%", caption: "Bot response coverage will appear here" },
      { label: "Resolution rate", value: "0%", caption: "Status-based analysis will appear here" },
      { label: "Containment rate", value: "0%", caption: "Human handoff hints will appear here" },
      { label: "Escalation rate", value: "0%", caption: "Escalation signal will appear here" },
      { label: "Feedback signal", value: "No data", caption: "Feedback buckets will appear here" },
    ];

  const handleParsedRows = (rows: RawRow[], nextFileName: string) => {
    const nextHeaders = Object.keys(rows[0] ?? {});

    setRawRows(rows);
    setHeaders(nextHeaders);
    setMapping(autoDetectMapping(nextHeaders));
    setFileName(nextFileName);
    setUploadError(rows.length ? "" : "The uploaded file is empty or could not be parsed.");
    setChatMessages([
      ...starterMessages,
      {
        role: "assistant",
        text: rows.length
          ? `Loaded ${rows.length} rows from ${nextFileName}. I auto-mapped the most likely columns. You can now ask open-ended questions like "What should I fix first?" or "Show me unresolved trends by intent."`
          : "I could not find any usable rows in that file.",
      },
    ]);
  };

  const parseSpreadsheet = async (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "csv" || extension === "txt") {
      handleParsedRows(parseCsv(await file.text()), file.name);
      return;
    }

    if ((extension === "xls" || extension === "xlsx") && window.XLSX) {
      const workbook = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const firstSheet = workbook.Sheets[firstSheetName];
      handleParsedRows(window.XLSX.utils.sheet_to_json(firstSheet, { defval: "" }), file.name);
      return;
    }

    if (extension === "xls" || extension === "xlsx") {
      setUploadError("Excel support is still loading. Please wait a moment and upload the file again.");
      return;
    }

    setUploadError("Please upload a CSV, XLS, or XLSX file.");
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadError("");

    try {
      await parseSpreadsheet(file);
    } catch {
      setUploadError("I could not parse that file. Please check the format and try again.");
    }
  };

  const sendQuestion = async (questionOverride?: string) => {
    const prompt = (questionOverride ?? chatInput).trim();

    if (!prompt) {
      return;
    }

    setChatMessages((current) => [...current, { role: "user", text: prompt }]);
    setChatInput("");

    if (!datasetContext) {
      setChatMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "Upload a file first so I have data to reason over.",
        },
      ]);
      return;
    }

    setChatLoading(true);

    try {
      const response = await fetch("/api/insights-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: prompt,
          dataset: datasetContext,
        }),
      });

      const payload = (await response.json()) as
        | {
            answer: string;
            visual?: ChartVisual;
            suggestedFollowUps?: string[];
          }
        | {
            error: string;
          };

      if (!response.ok || "error" in payload) {
        setChatMessages((current) => [
          ...current,
          {
            role: "assistant",
            text:
              ("error" in payload && payload.error) ||
              "I could not complete the AI request. Add your OpenAI API key in .env.local and try again.",
          },
        ]);
        return;
      }

      setChatMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: payload.answer,
          visual: payload.visual ?? null,
          suggestions: payload.suggestedFollowUps ?? [],
        },
      ]);
    } catch {
      setChatMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "The AI assistant could not be reached just now. Please check your API configuration and try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendQuestion();
    }
  };

  return (
    <>
      <Script
        src="https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          setScriptReady(true);
        }}
      />
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(249,115,22,0.16),_transparent_36%),linear-gradient(180deg,#fff8f1_0%,#fffdf8_35%,#f3fbf9_100%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="overflow-hidden rounded-[36px] border border-white/70 bg-white/75 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <p className="mb-3 inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-orange-700">
                  Chatbot Analytics Studio
                </p>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  AI-assisted conversation intelligence for your uploaded chatbot files.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Upload raw conversation exports from Excel or CSV, map the relevant columns, explore market-standard support analytics, and ask free-form questions that return both narrative insights and visuals.
                </p>
                <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
                  <span className="rounded-full bg-slate-100 px-3 py-1.5">AI Q&A on uploaded data</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5">Charted answers</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5">Containment and escalation analysis</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5">Intent, channel, feedback, and trend analysis</span>
                </div>
              </div>

              <div className="rounded-[28px] bg-slate-950 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <p className="text-sm uppercase tracking-[0.24em] text-orange-300">Upload panel</p>
                <label className="mt-4 block cursor-pointer rounded-[24px] border border-dashed border-white/20 bg-white/5 p-5 transition hover:border-orange-300 hover:bg-white/10">
                  <input type="file" accept=".csv,.txt,.xls,.xlsx" onChange={(event) => void handleFileChange(event)} className="sr-only" />
                  <span className="block text-lg font-medium">{fileName || "Choose your chatbot export"}</span>
                  <span className="mt-2 block text-sm leading-6 text-slate-300">
                    Ideal fields: user message, bot reply, timestamp, intent, status, feedback, session ID, and channel.
                  </span>
                </label>
                <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="font-medium text-white">Excel parser</p>
                    <p className="mt-1">{scriptReady ? "Ready for XLS/XLSX files" : "Loading browser parser..."}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="font-medium text-white">Rows loaded</p>
                    <p className="mt-1">{rawRows.length ? formatCompactNumber(rawRows.length) : "No file yet"}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-2xl bg-white/5 p-4 text-sm text-slate-300">
                  <p className="font-medium text-white">AI enablement</p>
                  <p className="mt-1">Set `OPENAI_API_KEY` in `.env.local` to turn the insight chat into a free-form LLM copilot.</p>
                </div>
                {uploadError ? (
                  <p className="mt-4 rounded-2xl border border-rose-300/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{uploadError}</p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-8 xl:grid-cols-[1.28fr_0.72fr]">
            <div className="space-y-8">
              <section className="rounded-[30px] border border-white/65 bg-white/82 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-950">Column mapping</h2>
                    <p className="mt-1 text-sm text-slate-500">Review the detected columns so both the dashboard and AI assistant use the right fields.</p>
                  </div>
                  <p className="text-sm text-slate-500">{headers.length ? `${headers.length} columns detected` : "Upload a file to begin"}</p>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {(Object.keys(mappingLabels) as Array<keyof ColumnMapping>).map((key) => (
                    <label key={key} className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">{mappingLabels[key]}</span>
                      <select
                        value={mapping[key]}
                        onChange={(event) => {
                          setMapping((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }));
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                      >
                        <option value={EMPTY_VALUE}>Not mapped</option>
                        {headers.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {metricCards.map((card) => (
                  <article key={card.label} className="rounded-[28px] border border-white/60 bg-white/86 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.07)] backdrop-blur">
                    <p className="text-sm font-medium text-slate-500">{card.label}</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{card.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{card.caption}</p>
                  </article>
                ))}
              </section>

              <section className="rounded-[30px] border border-white/65 bg-white/84 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-950">Executive highlights</h2>
                    <p className="mt-1 text-sm text-slate-500">A market-style summary of the biggest patterns in the uploaded file.</p>
                  </div>
                  {summary?.dateRange ? <p className="text-sm text-slate-500">Date range: {summary.dateRange}</p> : null}
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  {(summary?.highlights ?? []).length ? (
                    summary?.highlights.map((highlight) => (
                      <article key={highlight.title} className="rounded-[24px] bg-slate-50 p-5">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">{highlight.title}</p>
                        <p className="mt-3 text-base leading-7 text-slate-700">{highlight.description}</p>
                      </article>
                    ))
                  ) : (
                    <p className="rounded-[24px] bg-slate-50 p-5 text-sm text-slate-500">Upload data to generate benchmark-style highlights.</p>
                  )}
                </div>
              </section>

              <section className="grid gap-5 lg:grid-cols-2">
                <InsightChart
                  title="Top intents or categories"
                  subtitle="High-frequency reasons users reach the bot."
                  items={summary?.topIntents ?? []}
                  emptyLabel="Map an intent or category column to see topic concentration."
                />
                <InsightChart
                  title="Channel mix"
                  subtitle="Where the conversations are coming from."
                  items={summary?.topChannels ?? []}
                  emptyLabel="Map a channel or source column to break traffic down."
                />
                <InsightChart
                  title="Status distribution"
                  subtitle="Outcome and workflow signals across the dataset."
                  items={summary?.topStatuses ?? []}
                  emptyLabel="Map status or feedback to track outcomes."
                />
                <InsightChart
                  title="Recurring user themes"
                  subtitle="Repeated words in user messages that can signal common issues."
                  items={summary?.recurringTerms ?? []}
                  emptyLabel="Upload enough user-message text to surface repeated themes."
                />
                <InsightChart
                  title="Feedback mix"
                  subtitle="Positive, neutral, and negative feedback buckets from feedback text."
                  items={summary?.feedbackBreakdown ?? []}
                  emptyLabel="Map a feedback field to classify satisfaction signals."
                />
                <InsightChart
                  title="Unresolved intent hotspots"
                  subtitle="High-priority intents still tied to unresolved or failed outcomes."
                  items={summary?.unresolvedIntents ?? []}
                  emptyLabel="Map both intent and status or feedback fields to surface unresolved topics."
                />
              </section>

              <section className="grid gap-5 lg:grid-cols-2">
                <InsightChart
                  title="Conversation volume by day"
                  subtitle="Daily trend based on the mapped timestamp column."
                  items={summary?.dailyVolume ?? []}
                  emptyLabel="Map a valid timestamp column to unlock day-wise trends."
                />
                <InsightChart
                  title="Conversation volume by hour"
                  subtitle="Hourly distribution for staffing and routing decisions."
                  items={summary?.hourlyVolume ?? []}
                  emptyLabel="Map a valid timestamp column to unlock hourly analysis."
                />
              </section>

              <section className="rounded-[30px] border border-white/65 bg-white/84 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-950">Preview rows</h2>
                    <p className="mt-1 text-sm text-slate-500">A quick look at the first few mapped records sent to the dashboard context.</p>
                  </div>
                  {summary?.busiestHour ? <p className="text-sm text-slate-500">Busiest hour: {summary.busiestHour}</p> : null}
                </div>
                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
                    <thead>
                      <tr className="text-slate-500">
                        <th className="px-3 py-2 font-medium">#</th>
                        <th className="px-3 py-2 font-medium">User message</th>
                        <th className="px-3 py-2 font-medium">Bot reply</th>
                        <th className="px-3 py-2 font-medium">Intent</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(summary?.previewRows ?? []).length ? (
                        summary?.previewRows.map((row) => (
                          <tr key={row.rowNumber} className="rounded-2xl bg-slate-50 text-slate-700">
                            <td className="rounded-l-2xl px-3 py-3 align-top">{row.rowNumber}</td>
                            <td className="max-w-[18rem] px-3 py-3 align-top">{row.userMessage || "—"}</td>
                            <td className="max-w-[18rem] px-3 py-3 align-top">{row.botReply || "—"}</td>
                            <td className="px-3 py-3 align-top">{row.intent || "—"}</td>
                            <td className="rounded-r-2xl px-3 py-3 align-top">{row.status || row.feedback || "—"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="rounded-3xl bg-slate-50 px-4 py-10 text-center text-slate-500">
                            Your uploaded data preview will appear here.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <aside className="rounded-[30px] border border-white/65 bg-slate-950 p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-orange-300">AI insight copilot</p>
                  <h2 className="mt-2 text-2xl font-semibold">Ask anything about the file</h2>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">LLM-backed</div>
              </div>

              <div className="mt-5 space-y-3">
                {chatMessages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`rounded-[22px] px-4 py-3 text-sm leading-6 ${
                      message.role === "assistant" ? "bg-white/8 text-slate-100" : "bg-orange-500 text-white"
                    }`}
                  >
                    <div>{message.text}</div>
                    {message.visual ? <ChatVisualCard visual={message.visual} /> : null}
                    {message.suggestions?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => void sendQuestion(suggestion)}
                            className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs text-slate-200 transition hover:border-orange-300 hover:text-white"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
                {chatLoading ? <div className="rounded-[22px] bg-white/8 px-4 py-3 text-sm text-slate-300">Thinking through the uploaded dataset...</div> : null}
              </div>

              <div className="mt-5 space-y-3">
                <textarea
                  value={chatInput}
                  onChange={(event) => {
                    setChatInput(event.target.value);
                  }}
                  onKeyDown={handleTextareaKeyDown}
                  rows={5}
                  placeholder='Ask anything, for example: "Why are escalations rising?", "Which channel has the most unresolved cases?", or "Create an executive summary with visuals."'
                  className="w-full rounded-[22px] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-orange-300"
                />
                <button
                  type="button"
                  onClick={() => void sendQuestion()}
                  disabled={chatLoading}
                  className="w-full rounded-[18px] bg-[linear-gradient(90deg,#f97316,#fb7185)] px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {chatLoading ? "Analyzing..." : "Ask AI for insight"}
                </button>
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Good analysis prompts</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "Give me an executive summary",
                    "Which intents are most unresolved?",
                    "Compare channels by conversation quality",
                    "Show the busiest periods visually",
                    "What should operations team fix first?",
                    "Create a leadership-ready summary",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => {
                        setChatInput(prompt);
                      }}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:border-orange-300 hover:text-white"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </section>
        </div>
      </main>
    </>
  );
}
