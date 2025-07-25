import { openai } from "@ai-sdk/openai";
import { streamText, tool, generateText } from "ai";
import { searchSimilarContent } from "@/lib/rag-ingestion";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    // Check if API key is set
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("API key:", process.env.OPENAI_API_KEY);

    const { messages, lessonId } = await req.json();

    console.log("Received messages:", messages);
    console.log("Lesson ID:", lessonId);

    // System message
    const systemMessage = {
      role: "system",
      content: `You are Optiq Agent, an AI assistant helping students learn from their uploaded materials. 

QUIZ VERIFICATION: If you receive a message asking to verify a quiz answer (will be in format "VERIFY_ANSWER: Question: [question] User Answer: [answer] Correct Answer: [correct]"), SKIP the search_materials tool and directly use the verifyAnswer tool to evaluate the user's response. Do not show this verification message to the user.

QUIZ GENERATION: When a user asks you to generate questions or create a quiz about a topic (using phrases like "ask me questions about...", "quiz me on...", "test me on...", "create questions from..."), use the generateQuiz tool to create an interactive quiz with both multiple choice and short answer questions. When calling the generateQuiz tool, do NOT provide additional text-based questions in your response - the tool handles the entire interactive quiz experience. Simply call the tool and let it display the quiz interface.

IMPORTANT: For all OTHER questions (not quiz verification): You MUST ALWAYS call the search_materials tool first, regardless of whether you think it might be relevant or not. Even for general questions, greetings, or seemingly unrelated topics, always search first before responding.

After calling the search_materials tool, provide helpful, accurate, and educational responses. If the search results are relevant, base your answer on that context. If the search results are not relevant to the user's question, you can still provide helpful general information while mentioning that you searched their materials but didn't find specific relevant content.

When you reference information from the search results, mention the source file name with the format "Source: filename". At the end of your response, include a "**Sources:**" section that lists the sources you referenced.

Remember: ALWAYS call search_materials first, then respond based on the results.`,
    };

    const enhancedMessages = [systemMessage, ...messages];

    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: enhancedMessages,
      temperature: 0.7,
      tools: {
        search_materials: tool({
          description:
            "Search through the user's uploaded study materials to find relevant content for answering their questions",
          parameters: z.object({
            query: z
              .string()
              .describe("The search query to find relevant content"),
            topK: z
              .number()
              .optional()
              .default(5)
              .describe("Number of results to return (default 5)"),
          }),
          execute: async ({ query, topK = 5 }) => {
            try {
              console.log(
                `Tool call: Searching for "${query}" in lesson ${lessonId}`
              );
              const results = await searchSimilarContent(query, lessonId, topK);

              return {
                results: results.map((chunk, index) => ({
                  source: `${index + 1}: ${chunk.fileName}`,
                  content: chunk.text,
                  score: chunk.score,
                  metadata: {
                    fileName: chunk.fileName,
                    fileType: chunk.fileType,
                    title: chunk.title,
                    author: chunk.author,
                    chunkIndex: chunk.chunkIndex,
                  },
                })),
                totalResults: results.length,
              };
            } catch (error) {
              console.error("Error in search_materials tool:", error);
              return {
                results: [],
                totalResults: 0,
                error: "Failed to search materials",
              };
            }
          },
        }),
        generateQuiz: tool({
          description:
            "Generate quiz questions based on a specific topic from the user's materials",
          parameters: z.object({
            topic: z
              .string()
              .describe("The topic to generate quiz questions about"),
          }),
          execute: async ({ topic }) => {
            try {
              // First search for relevant content about the topic
              const searchResults = await searchSimilarContent(
                topic,
                lessonId,
                10
              );

              if (searchResults.length === 0) {
                return {
                  quizData: null,
                  error:
                    "No relevant content found for this topic in your materials.",
                };
              }

              // Combine the content for quiz generation
              const context = searchResults
                .map((chunk) => chunk.text)
                .join("\n\n");

              // Generate quiz using AI
              const quizResponse = await generateText({
                model: openai("gpt-4o-mini"),
                prompt: `Based on the following content about "${topic}", create a quiz with 5 questions. Mix multiple choice questions (with 4 options each) and short answer questions.

Content:
${context}

IMPORTANT: Respond with ONLY a valid JSON object, no markdown formatting or extra text.

{
  "topic": "${topic}",
  "questions": [
    {
      "id": "unique_id",
      "type": "mcq",
      "question": "Question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": 0,
      "explanation": "Explanation of the correct answer"
    },
    {
      "id": "unique_id",
      "type": "short_answer", 
      "question": "Question text",
      "correctAnswer": "Expected answer",
      "explanation": "Explanation or model answer"
    }
  ]
}

Make sure questions are challenging but fair, and based directly on the provided content.`,
                temperature: 0.7,
                maxTokens: 2000,
              });

              // Clean the response text to extract JSON
              let responseText = quizResponse.text.trim();

              // Remove markdown code blocks if present
              if (responseText.startsWith("```json")) {
                responseText = responseText
                  .replace(/^```json\s*/, "")
                  .replace(/\s*```$/, "");
              } else if (responseText.startsWith("```")) {
                responseText = responseText
                  .replace(/^```\s*/, "")
                  .replace(/\s*```$/, "");
              }

              // Try to find JSON object in the response
              const jsonMatch = responseText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                responseText = jsonMatch[0];
              }

              const quizData = JSON.parse(responseText);

              return {
                quizData: {
                  topic: quizData.topic,
                  questions: quizData.questions.map(
                    (q: any, index: number) => ({
                      ...q,
                      id: `q_${Date.now()}_${index}`,
                    })
                  ),
                  currentQuestionIndex: 0,
                  totalQuestions: quizData.questions.length,
                },
                results: [],
                completed: false,
              };
            } catch (error) {
              console.error("Error generating quiz:", error);
              return {
                quizData: null,
                error: "Failed to generate quiz questions.",
              };
            }
          },
        }),
        verifyAnswer: tool({
          description: "Verify a short answer question using AI",
          parameters: z.object({
            question: z.string().describe("The question that was asked"),
            userAnswer: z.string().describe("The user's answer"),
            correctAnswer: z.string().describe("The expected/correct answer"),
          }),
          execute: async ({ question, userAnswer, correctAnswer }) => {
            try {
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
                responseText = responseText
                  .replace(/^```\s*/, "")
                  .replace(/\s*```$/, "");
              }

              // Try to find JSON object in the response
              const jsonMatch = responseText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                responseText = jsonMatch[0];
              }

              return JSON.parse(responseText);
            } catch (error) {
              console.error("Error verifying answer:", error);
              return {
                isCorrect: false,
                score: 0,
                feedback: "Unable to verify answer at this time.",
              };
            }
          },
        }),
      },
      toolCallStreaming: true,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
