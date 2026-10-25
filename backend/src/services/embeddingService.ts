import { embed, embedMany } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import config from "../config/index.js";
import type { EmbeddingTask } from "../types/index.js";

export const EMBEDDING_MODEL_VERSION = "gemini-embedding-001-768-v1";
export const EMBEDDING_DIMENSIONS = 768;

export type { EmbeddingTask };

// Keyword groups to create semantic clustering in the 768-dim vector space (Fallback)
const SEMANTIC_CLUSTERS: Record<string, { start: number; end: number; keywords: string[] }> = {
  ROYALTY: {
    start: 0,
    end: 120,
    keywords: ["royalty", "payout", "payment", "bank", "money", "threshold", "sold", "earnings", "quarter", "split", "profit", "net"],
  },
  ISBN: {
    start: 120,
    end: 240,
    keywords: ["isbn", "imprint", "barcode", "metadata", "catalog", "registered", "duplicate", "mismatch"],
  },
  PRINTING: {
    start: 240,
    end: 360,
    keywords: ["print", "printing", "blurry", "binding", "defect", "quality", "page", "damaged", "misaligned", "reprint", "copies", "photos", "warehouse"],
  },
  DISTRIBUTION: {
    start: 360,
    end: 480,
    keywords: ["distribution", "unavailable", "amazon", "flipkart", "stock", "listing", "store", "sync", "syncing"],
  },
  PRODUCTION: {
    start: 480,
    end: 600,
    keywords: ["typesetting", "cover", "design", "proofreading", "manuscript", "status", "stage", "turnaround", "delayed", "milestone", "editing"],
  },
  GENERAL: {
    start: 600,
    end: 720,
    keywords: ["general", "package", "author", "account", "update", "bio", "support", "help"],
  },
};

/**
 * Deterministic local feature hashing vector generator (Fallback)
 * Embeds text into a 768-dimensional normalized vector with semantic cluster projection.
 */
export const generateDeterministicEmbedding = (text: string): number[] => {
  const vector = new Array(EMBEDDING_DIMENSIONS).fill(0);
  const normalized = text.toLowerCase();
  const words = normalized.split(/\W+/).filter(Boolean);

  for (const cluster of Object.values(SEMANTIC_CLUSTERS)) {
    let matchCount = 0;
    for (const kw of cluster.keywords) {
      if (normalized.includes(kw)) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      for (let idx = cluster.start; idx < cluster.end; idx++) {
        vector[idx] += matchCount * 2.5;
      }
    }
  }

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
      hash |= 0;
    }
    const index = Math.abs(hash) % EMBEDDING_DIMENSIONS;
    vector[index] += 1.0;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map((val) => parseFloat((val / magnitude).toFixed(6)));
};

function assertEmbeddingDimensions(vector: number[]) {
  if (vector.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Expected ${EMBEDDING_DIMENSIONS} dimensions, received ${vector.length}`);
  }
}

/**
 * Generates a 768-dim embedding using Vercel AI SDK (embed) with providerOptions
 */
export const createEmbedding = async (
  text: string,
  taskType: EmbeddingTask = "RETRIEVAL_QUERY"
): Promise<number[]> => {
  if (config.ai.geminiApiKey) {
    try {
      const google = createGoogleGenerativeAI({
        apiKey: config.ai.geminiApiKey,
      });

      const { embedding } = await embed({
        model: google.textEmbeddingModel("gemini-embedding-001"),
        value: text.trim(),
        providerOptions: {
          google: {
            outputDimensionality: EMBEDDING_DIMENSIONS,
            taskType,
          },
        },
      });

      assertEmbeddingDimensions(embedding);
      return embedding;
    } catch (err) {
      console.warn("Vercel AI SDK Gemini embed call failed, using deterministic fallback:", err);
    }
  }

  return generateDeterministicEmbedding(text);
};

/**
 * Generates batch 768-dim embeddings using Vercel AI SDK (embedMany) for document indexing
 */
export const createDocumentEmbeddings = async (texts: string[]): Promise<number[][]> => {
  if (config.ai.geminiApiKey && texts.length > 0) {
    try {
      const google = createGoogleGenerativeAI({
        apiKey: config.ai.geminiApiKey,
      });

      const { embeddings } = await embedMany({
        model: google.textEmbeddingModel("gemini-embedding-001"),
        values: texts.map((t) => t.trim()),
        providerOptions: {
          google: {
            outputDimensionality: EMBEDDING_DIMENSIONS,
            taskType: "RETRIEVAL_DOCUMENT",
          },
        },
      });

      embeddings.forEach(assertEmbeddingDimensions);
      return embeddings;
    } catch (err) {
      console.warn("Vercel AI SDK Gemini embedMany call failed, using deterministic fallback:", err);
    }
  }

  return texts.map(generateDeterministicEmbedding);
};

/**
 * Shortcut for search query embeddings
 */
export const createQueryEmbedding = async (text: string): Promise<number[]> => {
  return createEmbedding(text, "RETRIEVAL_QUERY");
};

/**
 * Backward-compatible single embedding helper
 */
export const getEmbedding = async (
  text: string,
  taskType: EmbeddingTask = "RETRIEVAL_QUERY"
): Promise<number[]> => {
  return createEmbedding(text, taskType);
};
