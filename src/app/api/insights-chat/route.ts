import { NextRequest, NextResponse } from "next/server";
import { AiDatasetContext } from "@lib/chatbot-analytics";

type ChatVisual = {
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

type InsightChatResponse = {
  answer: string;
  visual: ChatVisual;
  suggestedFollowUps: string[];
};

type RequestBody = {
  question: string;
  dataset: AiDatasetContext;
};

const responseSchema = {
  name: "chatbot_insight_answer",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      answer: {
        type: "string",
        description: "Direct answer to the user's question based only on the supplied dataset context.",
      },
      visual: {
        type: "object",
        additionalProperties: false,
        properties: {
          chartType: {
            type: "string",
            enum: ["bar", "line", "donut", "metric", "none"],
          },
          title: {
            type: "string",
          },
          description: {
            type: "string",
          },
          items: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                label: { type: "string" },
                value: { type: "number" },
              },
              required: ["label", "value"],
            },
          },
          metric: {
            type: "object",
            additionalProperties: false,
            properties: {
              label: { type: "string" },
              value: { type: "string" },
              detail: { type: "string" },
            },
            required: ["label", "value", "detail"],
          },
        },
        required: ["chartType", "title", "description", "items", "metric"],
      },
      suggestedFollowUps: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["answer", "visual", "suggestedFollowUps"],
  },
  strict: true,
} as const;

function fallbackResponse(question: string, dataset: AiDatasetContext): InsightChatResponse {
  return {
    answer: `I could not reach the AI model, so here is a grounded fallback. The dataset "${dataset.fileName}" contains ${dataset.totalRows} rows. Try adding an OpenAI API key to enable free-form reasoning over the uploaded analysis context.`,
    visual: {
      chartType: "bar",
      title: "Top intents",
      description: `Fallback visual for: ${question}`,
      items: dataset.topIntents.slice(0, 5),
      metric: {
        label: "Rows analyzed",
        value: String(dataset.totalRows),
        detail: "AI is unavailable, so this response is based on local summary data only.",
      },
    },
    suggestedFollowUps: ["Summarize the biggest issues", "Show unresolved intent hotspots", "Compare channels by volume"],
  };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Missing OPENAI_API_KEY. Add it to .env.local to enable AI-powered conversation insights.",
      },
      { status: 400 }
    );
  }

  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.question?.trim()) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
  }

  if (!body.dataset) {
    return NextResponse.json({ error: "Dataset context is required." }, { status: 400 });
  }

  try {
    const model = process.env.OPENAI_MODEL || "gpt-5-mini";

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        store: false,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
                  "You are a senior conversation analytics copilot. Answer only from the provided dataset context. Do not invent values, rows, calculations, or trends not supported by the supplied data. If the user asks for something unavailable, say so clearly and offer the closest available insight. When useful, attach a visual recommendation using the provided chart schema. Prefer concise business-ready analysis with exact numbers when present.",
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `User question:\n${body.question}\n\nDataset context:\n${JSON.stringify(body.dataset)}`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: responseSchema.name,
            schema: responseSchema.schema,
            strict: true,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText || "OpenAI request failed." }, { status: 500 });
    }

    const payload = (await response.json()) as {
      output_text?: string;
    };

    if (!payload.output_text) {
      return NextResponse.json(fallbackResponse(body.question, body.dataset));
    }

    const parsed = JSON.parse(payload.output_text) as InsightChatResponse;
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(fallbackResponse(body.question, body.dataset));
  }
}
