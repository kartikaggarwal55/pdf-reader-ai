import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful reading assistant. When given a piece of text from a research paper, book, or document, provide a brief, clear explanation that helps the reader understand it quickly.

Guidelines:
- Be concise (2-4 sentences max)
- Use simple, accessible language
- If it's a technical term, define it simply
- If it's a complex concept, break it down
- If it's a claim or finding, clarify what it means
- Don't add unnecessary context or tangents
- Focus on what would help someone continue reading with better understanding`,
        },
        {
          role: "user",
          content: `Explain this in simple terms:\n\n"${text}"`,
        },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    const explanation = completion.choices[0]?.message?.content || "Unable to generate explanation.";

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("OpenAI API error:", error);

    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: "Invalid API key" },
          { status: 401 }
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again." },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate explanation" },
      { status: 500 }
    );
  }
}
