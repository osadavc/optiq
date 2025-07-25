import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
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

IMPORTANT: You MUST ALWAYS call the search_materials tool for EVERY user question, regardless of whether you think it might be relevant or not. Even for general questions, greetings, or seemingly unrelated topics, always search first before responding.

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
