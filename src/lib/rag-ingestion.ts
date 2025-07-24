import { getPineconeIndex } from "./pinecone";
import { parseDocument, ParsedDocument } from "./document-parser";
import { chunkText, TextChunk } from "./text-chunker";

export interface DocumentRecord {
  id: string;
  text: string;
  metadata: {
    resourceId: number;
    lessonId: number;
    fileName: string;
    fileType: string;
    chunkIndex: number;
    startChar: number;
    endChar: number;
    wordCount: number;
    title?: string;
    author?: string;
    pageCount?: number;
  };
}

export async function ingestDocument(
  resourceId: number,
  lessonId: number,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<void> {
  try {
    console.log(`Starting RAG ingestion for ${fileName}`);

    // Step 1: Parse the document
    console.log("Parsing document...");
    const parsedDoc = await parseDocument(fileBuffer, fileName, mimeType);

    if (!parsedDoc.content || parsedDoc.content.trim().length === 0) {
      console.warn(`No content extracted from ${fileName}`);
      return;
    }

    // Step 2: Chunk the text
    console.log("Chunking text...");
    const chunks = chunkText(parsedDoc.content, {
      chunkSize: 1000,
      overlap: 200,
    });

    if (chunks.length === 0) {
      console.warn(`No chunks created from ${fileName}`);
      return;
    }

    console.log(`Created ${chunks.length} chunks from ${fileName}`);

    // Step 3: Create document records for Pinecone inference
    console.log("Preparing document records...");
    const records = createDocumentRecords(
      chunks,
      resourceId,
      lessonId,
      fileName,
      parsedDoc
    );

    // Step 4: Store records in Pinecone using inference API
    console.log("Storing records in Pinecone...");
    await storeRecords(records);

    console.log(
      `Successfully ingested ${fileName} with ${records.length} records`
    );
  } catch (error) {
    console.error(`Error ingesting document ${fileName}:`, error);
    throw error;
  }
}

function createDocumentRecords(
  chunks: TextChunk[],
  resourceId: number,
  lessonId: number,
  fileName: string,
  parsedDoc: ParsedDocument
): DocumentRecord[] {
  return chunks.map((chunk) => ({
    id: `${resourceId}-${chunk.index}`,
    text: chunk.content,
    metadata: {
      resourceId,
      lessonId,
      fileName,
      fileType: parsedDoc.metadata.fileType,
      chunkIndex: chunk.index,
      startChar: chunk.metadata.startChar,
      endChar: chunk.metadata.endChar,
      wordCount: chunk.metadata.wordCount,
      title: parsedDoc.metadata.title,
      author: parsedDoc.metadata.author,
      pageCount: parsedDoc.metadata.pageCount,
    },
  }));
}

async function storeRecords(records: DocumentRecord[]): Promise<void> {
  const index = await getPineconeIndex();

  // Store records in batches
  const batchSize = 95;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    try {
      // Prepare records for upsert
      // For Pinecone inference, we store text in metadata and let Pinecone handle embeddings
      const upsertData = batch.map((record) => ({
        id: record.id,
        text: record.text,
        ...record.metadata,
      }));

      await index.upsertRecords(upsertData);

      console.log(
        `Stored batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          records.length / batchSize
        )}`
      );

      // Add delay between batches
      if (i + batchSize < records.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(
        `Error storing records batch ${i}-${i + batchSize}:`,
        error
      );
      console.error("Full error details:", error);
      throw error;
    }
  }
}

export async function deleteDocumentEmbeddings(
  resourceId: number
): Promise<void> {
  try {
    const index = await getPineconeIndex();

    // Delete all vectors with the given resourceId
    await index.deleteMany({
      filter: {
        resourceId: { $eq: resourceId },
      },
    });

    console.log(`Deleted embeddings for resource ${resourceId}`);
  } catch (error) {
    console.error(
      `Error deleting embeddings for resource ${resourceId}:`,
      error
    );
    throw error;
  }
}

export async function searchSimilarContent(
  queryText: string,
  lessonId?: number,
  topK: number = 5
): Promise<any[]> {
  try {
    const index = await getPineconeIndex();

    // Build filter
    const filter: any = {};
    if (lessonId) {
      filter.lessonId = { $eq: lessonId };
    }

    // For now, return a placeholder response
    // The actual implementation will depend on configuring Pinecone with an embedding model
    // Once the index is properly configured with inference, this will work automatically

    console.log(`Search query: ${queryText}`);
    console.log(`Lesson filter: ${lessonId || "all lessons"}`);

    // TODO: Implement actual search once Pinecone index is configured with inference
    // This will require setting up the index with an embedding model through Pinecone's console

    return [];
  } catch (error) {
    console.error("Error searching similar content:", error);
    throw error;
  }
}
