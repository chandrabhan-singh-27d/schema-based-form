export type RawRow = Record<string, string>;

export type ColumnMapping = {
  userMessage: string;
  botReply: string;
  sessionId: string;
  timestamp: string;
  intent: string;
  status: string;
  feedback: string;
  channel: string;
};

export type ConversationRecord = {
  rowNumber: number;
  userMessage: string;
  botReply: string;
  sessionId: string;
  timestamp: string;
  intent: string;
  status: string;
  feedback: string;
  channel: string;
  raw: RawRow;
};

export type MetricCard = {
  label: string;
  value: string;
  caption: string;
};

export type RankedItem = {
  label: string;
  value: number;
};

export type InsightHighlight = {
  title: string;
  description: string;
};

export type AnalyticsSummary = {
  metricCards: MetricCard[];
  topIntents: RankedItem[];
  topChannels: RankedItem[];
  topStatuses: RankedItem[];
  dailyVolume: RankedItem[];
  hourlyVolume: RankedItem[];
  recurringTerms: RankedItem[];
  feedbackBreakdown: RankedItem[];
  unresolvedIntents: RankedItem[];
  previewRows: ConversationRecord[];
  highlights: InsightHighlight[];
  totalRows: number;
  totalConversations: number;
  answeredRows: number;
  unansweredRows: number;
  resolvedRows: number;
  unresolvedRows: number;
  escalationRows: number;
  averageUserLength: number;
  averageBotLength: number;
  replyCoverageRate: number;
  resolutionRate: number;
  containmentRate: number;
  escalationRate: number;
  busiestDay: string | null;
  busiestHour: string | null;
  dateRange: string | null;
};

export type AiDatasetContext = {
  fileName: string;
  totalRows: number;
  mappedColumns: ColumnMapping;
  metricCards: MetricCard[];
  highlights: InsightHighlight[];
  topIntents: RankedItem[];
  topChannels: RankedItem[];
  topStatuses: RankedItem[];
  dailyVolume: RankedItem[];
  hourlyVolume: RankedItem[];
  recurringTerms: RankedItem[];
  feedbackBreakdown: RankedItem[];
  unresolvedIntents: RankedItem[];
  previewRows: Array<{
    rowNumber: number;
    userMessage: string;
    botReply: string;
    intent: string;
    status: string;
    feedback: string;
    channel: string;
    timestamp: string;
  }>;
};

export const EMPTY_VALUE = "__none__";

export const mappingLabels: Record<keyof ColumnMapping, string> = {
  userMessage: "User message",
  botReply: "Bot reply",
  sessionId: "Conversation ID",
  timestamp: "Timestamp",
  intent: "Intent or category",
  status: "Status",
  feedback: "Feedback",
  channel: "Channel",
};

const detectionAliases: Record<keyof ColumnMapping, string[]> = {
  userMessage: ["user", "customer", "query", "question", "prompt", "utterance", "input", "message"],
  botReply: ["bot", "assistant", "agent", "reply", "response", "answer", "output"],
  sessionId: ["session", "conversation", "chat", "thread", "case", "ticket", "id"],
  timestamp: ["time", "date", "created", "updated", "ts", "timestamp"],
  intent: ["intent", "topic", "category", "reason", "tag"],
  status: ["status", "resolution", "resolved", "outcome", "state"],
  feedback: ["feedback", "rating", "csat", "sentiment", "score", "thumb"],
  channel: ["channel", "source", "platform", "queue", "touchpoint"],
};

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "has",
  "have",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "please",
  "that",
  "the",
  "this",
  "to",
  "we",
  "what",
  "when",
  "where",
  "why",
  "with",
  "you",
  "your",
]);

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function countBy(items: string[], limit = 8) {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const normalized = item.trim();
    if (!normalized) {
      return;
    }

    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, limit);
}

function formatPercentValue(value: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export function formatPercent(value: number, total: number) {
  return `${formatPercentValue(value, total)}%`;
}

export function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-IN", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

export function parseCsv(text: string) {
  const rows: string[][] = [];
  let currentCell = "";
  let currentRow: string[] = [];
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentCell = "";
      currentRow = [];
      continue;
    }

    currentCell += char;
  }

  if (currentCell || currentRow.length) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  const [headerRow, ...dataRows] = rows.filter((row) => row.some((cell) => cell.trim() !== ""));

  if (!headerRow) {
    return [];
  }

  return dataRows.map((row) =>
    headerRow.reduce<RawRow>((record, header, columnIndex) => {
      record[(header || `Column ${columnIndex + 1}`).trim()] = (row[columnIndex] ?? "").trim();
      return record;
    }, {})
  );
}

export function autoDetectMapping(headers: string[]): ColumnMapping {
  const findMatchingHeader = (key: keyof ColumnMapping) => {
    const aliases = detectionAliases[key];
    return (
      headers.find((header) => {
        const normalized = normalizeHeader(header);
        return aliases.some((alias) => normalized.includes(alias));
      }) ?? EMPTY_VALUE
    );
  };

  return {
    userMessage: findMatchingHeader("userMessage"),
    botReply: findMatchingHeader("botReply"),
    sessionId: findMatchingHeader("sessionId"),
    timestamp: findMatchingHeader("timestamp"),
    intent: findMatchingHeader("intent"),
    status: findMatchingHeader("status"),
    feedback: findMatchingHeader("feedback"),
    channel: findMatchingHeader("channel"),
  };
}

export function toConversationRecords(rows: RawRow[], mapping: ColumnMapping) {
  return rows
    .map<ConversationRecord>((row, index) => ({
      rowNumber: index + 1,
      userMessage: mapping.userMessage !== EMPTY_VALUE ? row[mapping.userMessage] ?? "" : "",
      botReply: mapping.botReply !== EMPTY_VALUE ? row[mapping.botReply] ?? "" : "",
      sessionId: mapping.sessionId !== EMPTY_VALUE ? row[mapping.sessionId] ?? "" : "",
      timestamp: mapping.timestamp !== EMPTY_VALUE ? row[mapping.timestamp] ?? "" : "",
      intent: mapping.intent !== EMPTY_VALUE ? row[mapping.intent] ?? "" : "",
      status: mapping.status !== EMPTY_VALUE ? row[mapping.status] ?? "" : "",
      feedback: mapping.feedback !== EMPTY_VALUE ? row[mapping.feedback] ?? "" : "",
      channel: mapping.channel !== EMPTY_VALUE ? row[mapping.channel] ?? "" : "",
      raw: row,
    }))
    .filter((record) => Object.values(record.raw).some((value) => value.trim() !== ""));
}

function classifyFeedback(feedback: string) {
  const normalized = feedback.toLowerCase();

  if (!normalized.trim()) {
    return "";
  }

  if (["good", "great", "happy", "positive", "satisfied", "thumbs up", "resolved", "5", "4"].some((token) => normalized.includes(token))) {
    return "Positive";
  }

  if (["bad", "poor", "negative", "angry", "unsatisfied", "thumbs down", "1", "2"].some((token) => normalized.includes(token))) {
    return "Negative";
  }

  return "Neutral";
}

export function summarizeRecords(records: ConversationRecord[]): AnalyticsSummary {
  const totalRows = records.length;
  const answeredRows = records.filter((record) => record.botReply.trim()).length;
  const unresolvedKeywords = ["unresolved", "open", "pending", "failed", "dropped"];
  const resolvedKeywords = ["resolved", "closed", "done", "success", "completed", "helpful"];
  const escalationKeywords = ["agent", "human", "handoff", "escalat", "transfer"];

  const resolvedRows = records.filter((record) => {
    const content = `${record.status} ${record.feedback}`.toLowerCase();
    return resolvedKeywords.some((keyword) => content.includes(keyword));
  }).length;

  const escalationRows = records.filter((record) => {
    const content = `${record.userMessage} ${record.botReply} ${record.status}`.toLowerCase();
    return escalationKeywords.some((keyword) => content.includes(keyword));
  }).length;

  const unresolvedRows = records.filter((record) => {
    const content = `${record.status} ${record.feedback}`.toLowerCase();
    return unresolvedKeywords.some((keyword) => content.includes(keyword));
  }).length;

  const unansweredRows = totalRows - answeredRows;
  const sessionIds = new Set(records.map((record) => record.sessionId.trim()).filter(Boolean));
  const totalConversations = sessionIds.size || totalRows;

  const averageUserLength = Math.round(
    records.reduce((total, record) => total + record.userMessage.trim().split(/\s+/).filter(Boolean).length, 0) / (totalRows || 1)
  );
  const averageBotLength = Math.round(
    records.reduce((total, record) => total + record.botReply.trim().split(/\s+/).filter(Boolean).length, 0) / (totalRows || 1)
  );

  const datedRows = records
    .map((record) => {
      const date = new Date(record.timestamp);
      if (Number.isNaN(date.getTime())) {
        return null;
      }

      return date;
    })
    .filter((item): item is Date => item !== null);

  const dailyVolume = countBy(datedRows.map((date) => date.toISOString().slice(0, 10))).map((item) => ({
    label: formatDateLabel(item.label),
    value: item.value,
  }));

  const hourlyVolume = countBy(
    datedRows.map((date) => `${date.getHours().toString().padStart(2, "0")}:00`),
    24
  ).sort((left, right) => left.label.localeCompare(right.label));

  const busiestDay = dailyVolume[0]?.label ?? null;
  const busiestHour = [...hourlyVolume].sort((left, right) => right.value - left.value)[0]?.label ?? null;

  const orderedDates = datedRows.map((date) => date.toISOString().slice(0, 10)).sort((left, right) => left.localeCompare(right));
  const dateRange =
    orderedDates.length > 1 ? `${formatDateLabel(orderedDates[0])} to ${formatDateLabel(orderedDates[orderedDates.length - 1])}` : orderedDates[0] ? formatDateLabel(orderedDates[0]) : null;

  const recurringTerms = countBy(
    records.flatMap((record) =>
      record.userMessage
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .map((word) => word.trim())
        .filter((word) => word.length > 2 && !stopWords.has(word))
    )
  );

  const feedbackBreakdown = countBy(records.map((record) => classifyFeedback(record.feedback)));
  const unresolvedIntents = countBy(
    records
      .filter((record) => {
        const content = `${record.status} ${record.feedback}`.toLowerCase();
        return unresolvedKeywords.some((keyword) => content.includes(keyword));
      })
      .map((record) => record.intent)
  );

  const replyCoverageRate = formatPercentValue(answeredRows, totalRows);
  const resolutionRate = formatPercentValue(resolvedRows, totalRows);
  const escalationRate = formatPercentValue(escalationRows, totalRows);
  const containmentRate = Math.max(0, 100 - escalationRate);

  const topIntent = countBy(records.map((record) => record.intent))[0];
  const topChannel = countBy(records.map((record) => record.channel))[0];

  const highlights: InsightHighlight[] = [
    {
      title: "Coverage",
      description: `${replyCoverageRate}% of rows contain a bot reply, leaving ${formatCompactNumber(unansweredRows)} without coverage.`,
    },
    {
      title: "Containment",
      description: `${containmentRate}% containment signal with ${formatCompactNumber(escalationRows)} escalation-like rows.`,
    },
    {
      title: "Primary driver",
      description: topIntent ? `${topIntent.label} is the highest-volume intent with ${formatCompactNumber(topIntent.value)} rows.` : "No clear intent column is mapped yet.",
    },
    {
      title: "Channel leader",
      description: topChannel ? `${topChannel.label} is the leading source channel.` : "No clear channel mapping is available yet.",
    },
  ];

  return {
    metricCards: [
      {
        label: "Rows analyzed",
        value: formatCompactNumber(totalRows),
        caption: `${formatCompactNumber(totalConversations)} distinct conversations`,
      },
      {
        label: "Reply coverage",
        value: `${replyCoverageRate}%`,
        caption: `${formatCompactNumber(unansweredRows)} rows without a bot reply`,
      },
      {
        label: "Resolution rate",
        value: `${resolutionRate}%`,
        caption: unresolvedRows ? `${formatCompactNumber(unresolvedRows)} rows still look unresolved` : "No unresolved markers detected",
      },
      {
        label: "Containment rate",
        value: `${containmentRate}%`,
        caption: `${formatCompactNumber(escalationRows)} rows look escalated or transferred`,
      },
      {
        label: "Escalation rate",
        value: `${escalationRate}%`,
        caption: `${averageUserLength} user words vs ${averageBotLength} bot words on average`,
      },
      {
        label: "Feedback signal",
        value: feedbackBreakdown[0]?.label ?? "No data",
        caption: feedbackBreakdown.length ? `${feedbackBreakdown[0].value} rows in the dominant sentiment bucket` : "Map feedback to classify sentiment signals",
      },
    ],
    topIntents: countBy(records.map((record) => record.intent)),
    topChannels: countBy(records.map((record) => record.channel)),
    topStatuses: countBy(records.map((record) => record.status || record.feedback)),
    dailyVolume,
    hourlyVolume,
    recurringTerms,
    feedbackBreakdown,
    unresolvedIntents,
    previewRows: records.slice(0, 8),
    highlights,
    totalRows,
    totalConversations,
    answeredRows,
    unansweredRows,
    resolvedRows,
    unresolvedRows,
    escalationRows,
    averageUserLength,
    averageBotLength,
    replyCoverageRate,
    resolutionRate,
    containmentRate,
    escalationRate,
    busiestDay,
    busiestHour,
    dateRange,
  };
}

export function buildAiDatasetContext(fileName: string, mapping: ColumnMapping, summary: AnalyticsSummary): AiDatasetContext {
  return {
    fileName,
    totalRows: summary.totalRows,
    mappedColumns: mapping,
    metricCards: summary.metricCards,
    highlights: summary.highlights,
    topIntents: summary.topIntents,
    topChannels: summary.topChannels,
    topStatuses: summary.topStatuses,
    dailyVolume: summary.dailyVolume,
    hourlyVolume: summary.hourlyVolume,
    recurringTerms: summary.recurringTerms,
    feedbackBreakdown: summary.feedbackBreakdown,
    unresolvedIntents: summary.unresolvedIntents,
    previewRows: summary.previewRows.map((row) => ({
      rowNumber: row.rowNumber,
      userMessage: row.userMessage,
      botReply: row.botReply,
      intent: row.intent,
      status: row.status,
      feedback: row.feedback,
      channel: row.channel,
      timestamp: row.timestamp,
    })),
  };
}
