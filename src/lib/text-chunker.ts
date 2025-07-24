import { CharacterTextSplitter } from "@langchain/textsplitters";

export interface TextChunk {
  content: string;
  index: number;
  metadata: {
    startChar: number;
    endChar: number;
    wordCount: number;
  };
}

export async function chunkText(text: string): Promise<TextChunk[]> {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const splitter = new CharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 50,
  });

  const chunks = await splitter.splitText(text);

  let currentPosition = 0;
  return chunks.map((chunk, index) => {
    const startChar = currentPosition;
    const endChar = currentPosition + chunk.length;
    currentPosition = endChar;

    return {
      content: chunk,
      index,
      metadata: {
        startChar,
        endChar,
        wordCount: chunk.split(/\s+/).length,
      },
    };
  });
}
