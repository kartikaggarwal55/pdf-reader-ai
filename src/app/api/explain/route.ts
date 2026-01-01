import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

const MODELS = {
  "gpt-4o-mini": "gpt-4o-mini",
  "gpt-4o": "gpt-4o",
} as const;

type ModelType = keyof typeof MODELS;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const { text, model = "gpt-4o-mini" } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    if (text.length > 2000) {
      return NextResponse.json(
        { error: "Text too long. Please select a shorter passage." },
        { status: 400 }
      );
    }

    const selectedModel = MODELS[model as ModelType] || MODELS["gpt-4o-mini"];

    const systemPrompt = `You are a helpful reading assistant. When given a piece of text from a research paper, book, or document, provide a brief, clear explanation that helps the reader understand it quickly.

Guidelines:
- Be concise (2-4 sentences max)
- Use simple, accessible language
- If it's a technical term, define it simply
- If it's a complex concept, break it down
- If it's a claim or finding, clarify what it means
- Don't add unnecessary context or tangents
- Focus on what would help someone continue reading with better understanding`;

    const completion = await openai.chat.completions.create({
      model: selectedModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Explain this in simple terms:\n\n"${text}"` },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    const explanation = completion.choices[0]?.message?.content || "Unable to generate explanation.";

    return NextResponse.json({ explanation });
  } catch (error: unknown) {
    console.error("OpenAI API error:", error);

    const err = error as { status?: number; message?: string };

    if (err.status === 401) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }
    if (err.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: err.message || "Failed to generate explanation" },
      { status: 500 }
    );
  }
}
