import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Check if API key is set
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const { question, userAnswer, correctAnswer } = await req.json();

    if (!question || !userAnswer || !correctAnswer) {
      return NextResponse.json(
        {
          error: "Missing required fields: question, userAnswer, correctAnswer",
        },
        { status: 400 }
      );
    }

    const verificationResponse = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `You are evaluating a student's answer to a question. 

Question: "${question}"
Student's Answer: "${userAnswer}"
Expected Answer: "${correctAnswer}"

Evaluate the student's answer and provide:
1. A score from 0-100 (100 being perfect, 0 being completely wrong)
2. Whether the answer is correct (true/false) - consider it correct if score >= 70
3. Helpful feedback explaining what was good/missing

IMPORTANT: Respond with ONLY a valid JSON object, no markdown formatting or extra text.

{
  "isCorrect": boolean,
  "score": number,
  "feedback": "detailed feedback string"
}`,
      temperature: 0.3,
      maxTokens: 300,
    });

    // Clean the response text to extract JSON
    let responseText = verificationResponse.text.trim();

    // Remove markdown code blocks if present
    if (responseText.startsWith("```json")) {
      responseText = responseText
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "");
    } else if (responseText.startsWith("```")) {
      responseText = responseText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    // Try to find JSON object in the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }

    const result = JSON.parse(responseText);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error verifying answer:", error);
    return NextResponse.json(
      {
        isCorrect: false,
        score: 0,
        feedback: "Unable to verify answer at this time.",
      },
      { status: 500 }
    );
  }
}
