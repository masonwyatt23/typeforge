import { NextRequest, NextResponse } from "next/server";

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = "https://api.x.ai/v1/chat/completions";
const MODEL = "grok-4-1-fast-reasoning";

async function callGrok(messages: { role: string; content: string }[]): Promise<string> {
  if (!XAI_API_KEY) {
    throw new Error("XAI_API_KEY not configured");
  }

  const res = await fetch(XAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: 300,
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    throw new Error(`xAI API error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0]?.message?.content?.trim() || "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "generate_passage": {
        const { topic, difficulty } = body;

        const charTarget =
          difficulty === "easy" ? "60-80" : difficulty === "hard" ? "160-200" : "100-130";

        const message = `Generate a typing practice passage about "${topic}". Requirements:
- Exactly ${charTarget} characters long (including spaces and punctuation)
- Use natural, flowing prose — not a list
- Include varied punctuation (commas, periods) for typing practice
- Make it interesting and engaging to type
- Do NOT include any quotes around the passage
- Do NOT include newlines — it must be a single paragraph
- Respond with ONLY the passage text, nothing else`;

        const passage = await callGrok([
          { role: "system", content: "You generate typing practice passages. Respond with ONLY the passage text." },
          { role: "user", content: message },
        ]);

        return NextResponse.json({ passage: passage.replace(/^["']|["']$/g, "").trim() });
      }

      case "coach": {
        const { wpm, accuracy, maxCombo, errors } = body;

        const message = `A user just completed a typing test with these results:
- Speed: ${wpm} WPM
- Accuracy: ${accuracy}%
- Max Combo: ${maxCombo} consecutive correct characters
- Errors: ${errors}

Give a brief, encouraging coaching tip (2-3 sentences max). Be specific to their stats. If they did well, celebrate it. If they struggled, be encouraging and give one actionable tip. Keep it casual and motivating — like a supportive coach, not a textbook.`;

        const coachMessage = await callGrok([
          { role: "system", content: "You are a friendly, encouraging typing coach. Keep responses brief and motivating." },
          { role: "user", content: message },
        ]);

        return NextResponse.json({ message: coachMessage });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    // Provide fallback responses when API key isn't set
    if (message.includes("XAI_API_KEY")) {
      const { action } = await req.clone().json().catch(() => ({ action: "" }));
      if (action === "generate_passage") {
        return NextResponse.json({
          passage: "The art of typing is a dance between mind and fingers, where each keystroke brings ideas to life on the glowing screen before you.",
        });
      }
      if (action === "coach") {
        return NextResponse.json({
          message: "Great session! Keep practicing consistently and you'll see your speed climb. Focus on accuracy first — speed follows naturally.",
        });
      }
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
