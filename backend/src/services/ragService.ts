import prisma from "../config/prisma.js";
import { createQueryEmbedding } from "./embeddingService.js";
import type { RetrievedChunk } from "../types/index.js";

export type { RetrievedChunk };

/**
 * Performs true Vector Similarity Search using pgvector in PostgreSQL
 * Computes Cosine Similarity: 1 - (embedding <=> queryVector)
 */
export const retrieveRelevantChunks = async (
  queryText: string,
  limit = 2
): Promise<RetrievedChunk[]> => {
  try {
    // 1. Generate 768-dim query embedding vector using Vercel AI SDK
    const queryEmbedding = await createQueryEmbedding(queryText);
    const vectorString = `[${queryEmbedding.join(",")}]`;

    // 2. Query Neon PostgreSQL pgvector using Cosine Distance operator (<=>)
    const results = await prisma.$queryRawUnsafe<RetrievedChunk[]>(
      `SELECT "id", "title", "category", "content",
              ROUND((1 - ("embedding" <=> $1::vector))::numeric, 4)::float AS similarity
       FROM "KnowledgeChunk"
       ORDER BY "embedding" <=> $1::vector
       LIMIT $2;`,
      vectorString,
      limit
    );

    return results;
  } catch (error) {
    console.warn("Vector similarity search failed, falling back to empty retrieval:", error);
    return [];
  }
};
