#!/usr/bin/env tsx

import { getPineconeIndex } from "../src/lib/pinecone";

async function wipePineconeNamespace() {
  try {
    console.log("Starting Pinecone namespace wipe...");

    const index = await getPineconeIndex();

    console.log("Deleting all vectors from namespace...");
    await index.deleteAll();

    console.log("✅ Successfully wiped Pinecone namespace");
  } catch (error) {
    console.error("❌ Error wiping Pinecone namespace:", error);
    process.exit(1);
  }
}

wipePineconeNamespace();
