export interface TextChunk {
  content: string;
  index: number;
  metadata: {
    startChar: number;
    endChar: number;
    wordCount: number;
  };
}

export interface ChunkingOptions {
  chunkSize: number; // Maximum characters per chunk
  overlap: number; // Number of characters to overlap between chunks
  separators: string[]; // Preferred separators for splitting
}

const DEFAULT_OPTIONS: ChunkingOptions = {
  chunkSize: 1000,
  overlap: 200,
  separators: ['\n\n', '\n', '. ', '! ', '? ', ': ', '; ', ', ', ' ']
};

export function chunkText(text: string, options: Partial<ChunkingOptions> = {}): TextChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let currentPosition = 0;
  let chunkIndex = 0;

  while (currentPosition < text.length) {
    let chunkEnd = Math.min(currentPosition + opts.chunkSize, text.length);
    
    // If we're not at the end of the text, try to find a good breaking point
    if (chunkEnd < text.length) {
      let bestBreakPoint = chunkEnd;
      
      // Look for the best separator within a reasonable range
      const searchStart = Math.max(currentPosition + opts.chunkSize - 200, currentPosition);
      const searchEnd = Math.min(currentPosition + opts.chunkSize + 100, text.length);
      
      for (const separator of opts.separators) {
        const separatorIndex = text.lastIndexOf(separator, searchEnd);
        if (separatorIndex > searchStart && separatorIndex > bestBreakPoint - 300) {
          bestBreakPoint = separatorIndex + separator.length;
          break;
        }
      }
      
      chunkEnd = bestBreakPoint;
    }

    const chunkContent = text.slice(currentPosition, chunkEnd).trim();
    
    if (chunkContent.length > 0) {
      chunks.push({
        content: chunkContent,
        index: chunkIndex,
        metadata: {
          startChar: currentPosition,
          endChar: chunkEnd,
          wordCount: chunkContent.split(/\s+/).length
        }
      });
      chunkIndex++;
    }

    // Move to next chunk with overlap
    const nextPosition = Math.max(chunkEnd - opts.overlap, currentPosition + 1);
    
    // Prevent infinite loop
    if (nextPosition <= currentPosition) {
      currentPosition = chunkEnd;
    } else {
      currentPosition = nextPosition;
    }
  }

  return chunks;
}

export function combineChunks(chunks: TextChunk[], maxCombinedSize: number = 2000): TextChunk[] {
  if (chunks.length === 0) return [];
  
  const combinedChunks: TextChunk[] = [];
  let currentCombined = chunks[0];
  
  for (let i = 1; i < chunks.length; i++) {
    const nextChunk = chunks[i];
    const combinedLength = currentCombined.content.length + nextChunk.content.length + 1; // +1 for space
    
    if (combinedLength <= maxCombinedSize) {
      // Combine chunks
      currentCombined = {
        content: currentCombined.content + ' ' + nextChunk.content,
        index: currentCombined.index,
        metadata: {
          startChar: currentCombined.metadata.startChar,
          endChar: nextChunk.metadata.endChar,
          wordCount: currentCombined.metadata.wordCount + nextChunk.metadata.wordCount
        }
      };
    } else {
      // Save current combined chunk and start new one
      combinedChunks.push(currentCombined);
      currentCombined = nextChunk;
    }
  }
  
  // Add the last combined chunk
  combinedChunks.push(currentCombined);
  
  return combinedChunks;
}