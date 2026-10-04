import { NextResponse } from "next/server";
import { saveAIConversation } from "@/lib/supabaseClient";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: Request) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI API key is not configured." }, { status: 500 });
  }

  const data = await request.json();
  const query = data?.query?.trim();

  if (!query) {
    return NextResponse.json({ error: "Query is required." }, { status: 400 });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: query }],
      temperature: 0.8,
      max_tokens: 400
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return NextResponse.json({ error: errorBody }, { status: response.status });
  }

  const result = await response.json();
  const message = result?.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";

  try {
    await saveAIConversation(query, message);
  } catch {
    // Ignore analytics persistence errors.
  }

  return NextResponse.json({ message });
}
