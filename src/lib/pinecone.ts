import { Pinecone } from "@pinecone-database/pinecone";

if (!process.env.PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY is required");
}

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

export const PINECONE_INDEX_NAME =
  process.env.PINECONE_INDEX_NAME || "optiq-documents";

export const PINECONE_INDEX_HOST = process.env.PINECONE_INDEX_HOST || "";

export async function getPineconeIndex() {
  try {
    // Check if index exists, create if it doesn't
    const indexList = await pinecone.listIndexes();
    const indexExists = indexList.indexes?.some(
      (index) => index.name === PINECONE_INDEX_NAME
    );

    if (!indexExists) {
      console.log(
        `Creating Pinecone index with inference: ${PINECONE_INDEX_NAME}`
      );
      await pinecone.createIndex({
        name: PINECONE_INDEX_NAME,
        dimension: 1024, // Standard dimension for most Pinecone inference models
        metric: "cosine",
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-east-1",
          },
        },
      });

      // Wait for index to be ready
      console.log("Waiting for index to be ready...");
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    return pinecone
      .index(PINECONE_INDEX_NAME, PINECONE_INDEX_HOST)
      .namespace("__default__");
  } catch (error) {
    console.error("Error getting Pinecone index:", error);
    throw error;
  }
}

export default pinecone;
