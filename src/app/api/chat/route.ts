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

🚨 CRITICAL RULE: When calling the generateQuiz tool, your response must contain ONLY the tool call and absolutely NO additional text, questions, or explanations. The tool handles everything.

QUIZ VERIFICATION: If you receive a message asking to verify a quiz answer (will be in format "VERIFY_ANSWER: Question: [question] User Answer: [answer] Correct Answer: [correct]"), SKIP the search_materials tool and directly use the verifyAnswer tool to evaluate the user's response. Do not show this verification message to the user.

QUIZ GENERATION: When a user asks you to generate questions or create a quiz about a topic (using phrases like "ask me questions about...", "quiz me on...", "test me on...", "create questions from..."), you MUST:
1. ONLY call the generateQuiz tool (optionally with questionCount parameter if user specifies a number)
2. NEVER include any text-based questions in your response
3. NEVER write out questions manually
4. NEVER say "Here are some questions..." or similar
5. Let the interactive quiz tool handle everything

FLASH CARDS GENERATION: When a user asks you to create flash cards about a topic (using phrases like "create flash cards about...", "make flash cards for...", "generate flash cards on...", "flash cards from..."), you MUST:
1. ONLY call the generateFlashCards tool (optionally with cardCount parameter if user specifies a number)
2. NEVER include any text-based flash cards in your response
3. NEVER write out flash cards manually
4. NEVER say "Here are some flash cards..." or similar
5. Let the interactive flash cards tool handle everything

MIND MAP GENERATION: When a user asks you to create a mind map about a topic (using phrases like "create a mind map for...", "make a mind map of...", "generate mind map on...", "mind map from..."), you MUST:
1. ONLY call the generateMindMap tool
2. NEVER include any text-based mind maps in your response
3. NEVER write out mind maps manually
4. NEVER say "Here is a mind map..." or similar
5. Let the interactive mind map tool handle everything

CRITICAL: If you call generateQuiz, generateFlashCards, or generateMindMap, your response should contain ONLY the tool call and no additional text content whatsoever.

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
            questionCount: z
              .number()
              .optional()
              .default(5)
              .describe("Number of questions to generate (default 5)"),
          }),
          execute: async ({ topic, questionCount = 5 }) => {
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
                prompt: `Based on the following content about "${topic}", create a quiz with ${questionCount} questions. Mix multiple choice questions (with 4 options each) and short answer questions.

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
        generateFlashCards: tool({
          description:
            "Generate flash cards based on a specific topic from the user's materials",
          parameters: z.object({
            topic: z
              .string()
              .describe("The topic to generate flash cards about"),
            cardCount: z
              .number()
              .optional()
              .default(10)
              .describe("Number of flash cards to generate (default 10)"),
          }),
          execute: async ({ topic, cardCount = 10 }) => {
            try {
              // First search for relevant content about the topic
              const searchResults = await searchSimilarContent(
                topic,
                lessonId,
                15
              );

              if (searchResults.length === 0) {
                return {
                  flashCardsData: null,
                  error:
                    "No relevant content found for this topic in your materials.",
                };
              }

              // Combine the content for flash cards generation
              const context = searchResults
                .map((chunk) => chunk.text)
                .join("\n\n");

              // Generate flash cards using AI
              const flashCardsResponse = await generateText({
                model: openai("gpt-4o-mini"),
                prompt: `Based on the following content about "${topic}", create ${cardCount} flash cards for studying. Each flash card should have a concise question/prompt on the front and a clear, comprehensive answer on the back.

Content:
${context}

IMPORTANT: Respond with ONLY a valid JSON object, no markdown formatting or extra text.

{
  "topic": "${topic}",
  "cards": [
    {
      "id": "unique_id",
      "front": "Question or prompt for the front of the card",
      "back": "Detailed answer or explanation for the back of the card",
      "difficulty": "easy|medium|hard"
    }
  ]
}

Make sure the flash cards:
- Cover key concepts from the provided content
- Have clear, concise questions on the front
- Provide comprehensive but not overwhelming answers on the back
- Vary in difficulty level
- Are directly based on the provided content`,
                temperature: 0.7,
                maxTokens: 2500,
              });

              // Clean the response text to extract JSON
              let responseText = flashCardsResponse.text.trim();

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

              const flashCardsData = JSON.parse(responseText);

              return {
                flashCardsData: {
                  topic: flashCardsData.topic,
                  cards: flashCardsData.cards.map(
                    (card: any, index: number) => ({
                      ...card,
                      id: `card_${Date.now()}_${index}`,
                    })
                  ),
                  currentCardIndex: 0,
                  totalCards: flashCardsData.cards.length,
                },
                completed: false,
              };
            } catch (error) {
              console.error("Error generating flash cards:", error);
              return {
                flashCardsData: null,
                error: "Failed to generate flash cards.",
              };
            }
          },
        }),
        generateMindMap: tool({
          description:
            "Generate an interactive mind map based on a specific topic from the user's materials",
          parameters: z.object({
            topic: z.string().describe("The topic to create a mind map for"),
            depth: z
              .number()
              .optional()
              .default(3)
              .describe(
                "How many levels deep the mind map should go (default 3)"
              ),
          }),
          execute: async ({ topic, depth = 3 }) => {
            try {
              // First search for relevant content about the topic
              const searchResults = await searchSimilarContent(
                topic,
                lessonId,
                25
              );

              if (searchResults.length === 0) {
                return {
                  mindMapData: null,
                  error:
                    "No relevant content found for this topic in your materials.",
                };
              }

              // Combine the content for mind map generation
              const context = searchResults
                .map((chunk) => chunk.text)
                .join("\n\n");

              // Generate mind map using AI
              const mindMapResponse = await generateText({
                model: openai("gpt-4o-mini"),
                prompt: `Based on the following content about "${topic}", create a hierarchical mind map with ${depth} levels of depth. The mind map should capture the key concepts, relationships, and details.

Content:
${context}

IMPORTANT: Respond with ONLY a valid JSON object, no markdown formatting or extra text.

{
  "topic": "${topic}",
  "centerNode": {
    "id": "root",
    "title": "${topic}",
    "description": "Brief description of the main topic",
    "x": 400,
    "y": 300,
    "level": 0,
    "color": "#3B82F6",
    "expanded": true
  },
  "nodes": [
    {
      "id": "node1",
      "title": "Main Concept 1",
      "description": "Description of main concept",
      "x": 200,
      "y": 200,
      "level": 1,
      "parentId": "root",
      "color": "#10B981",
      "expanded": true
    },
    {
      "id": "node2", 
      "title": "Main Concept 2",
      "description": "Description of another concept",
      "x": 600,
      "y": 200,
      "level": 1,
      "parentId": "root",
      "color": "#10B981",
      "expanded": true
    },
    {
      "id": "node3",
      "title": "Sub Concept",
      "description": "Description of sub concept",
      "x": 150,
      "y": 100,
      "level": 2,
      "parentId": "node1",
      "color": "#F59E0B",
      "expanded": true
    }
  ],
  "connections": [
    {
      "id": "conn1",
      "sourceId": "root",
      "targetId": "node1",
      "label": "contains",
      "type": "hierarchical"
    },
    {
      "id": "conn2",
      "sourceId": "root",
      "targetId": "node2", 
      "label": "contains",
      "type": "hierarchical"
    },
    {
      "id": "conn3",
      "sourceId": "node1",
      "targetId": "node3",
      "label": "includes",
      "type": "hierarchical"
    }
  ]
}

CRITICAL REQUIREMENTS:
- Create at least 5-8 nodes with the central node
- EVERY node (except root) must have a connection FROM its parent or TO the root
- Connection sourceId and targetId must exactly match node ids
- Use hierarchical connections between parent-child nodes
- Place nodes at different x,y coordinates in a radial pattern around center
- Use different colors for different levels: Level 0=#3B82F6, Level 1=#10B981, Level 2=#F59E0B, Level 3=#EF4444
- Make sure all node IDs are unique and connections reference valid node IDs`,
                temperature: 0.7,
                maxTokens: 3500,
              });

              // Clean the response text to extract JSON
              let responseText = mindMapResponse.text.trim();

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

              const mindMapData = JSON.parse(responseText);

              // Create ID mapping to maintain relationships
              const timestamp = Date.now();
              const nodeIdMap = new Map();
              nodeIdMap.set(mindMapData.centerNode.id, `node_${timestamp}_root`);
              
              mindMapData.nodes.forEach((node: any, index: number) => {
                nodeIdMap.set(node.id, `node_${timestamp}_${index + 1}`);
              });

              return {
                mindMapData: {
                  topic: mindMapData.topic,
                  centerNode: {
                    ...mindMapData.centerNode,
                    id: nodeIdMap.get(mindMapData.centerNode.id),
                  },
                  nodes: mindMapData.nodes.map(
                    (node: any) => ({
                      ...node,
                      id: nodeIdMap.get(node.id),
                      parentId: node.parentId ? nodeIdMap.get(node.parentId) : undefined,
                    })
                  ),
                  connections: mindMapData.connections.map(
                    (conn: any, index: number) => ({
                      ...conn,
                      id: `conn_${timestamp}_${index}`,
                      sourceId: nodeIdMap.get(conn.sourceId),
                      targetId: nodeIdMap.get(conn.targetId),
                    })
                  ),
                  selectedNode: null,
                  zoom: 1,
                  panX: 0,
                  panY: 0,
                },
                completed: false,
              };
            } catch (error) {
              console.error("Error generating mind map:", error);
              return {
                mindMapData: null,
                error: "Failed to generate mind map.",
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
