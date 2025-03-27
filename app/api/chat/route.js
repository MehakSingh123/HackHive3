// app/api/chat/route.js
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages } = body;

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: "llama3-70b-8192",
    });

    return NextResponse.json({
      content: chatCompletion.choices[0]?.message?.content || "",
    });
  } catch (error) {
    console.error("Groq API error:", error);
    return NextResponse.json(
      { error: "Failed to get AI response" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }
  });
}