import { TicketCategory, Priority } from "./ticket.js";

export type EmbeddingTask = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

export interface TriageResult {
  category: TicketCategory;
  priority: Priority;
  confidenceScore: number;
  reasoning: string;
  source: "AI_MODEL" | "HEURISTIC_FALLBACK";
}

export interface DraftContext {
  authorName: string;
  bookTitle?: string;
  bookStatus?: string;
  mrp?: number | null;
  copiesSold?: number;
  royaltyPending?: number;
  lastPayoutDate?: string | null;
  subject: string;
  description: string;
  category: TicketCategory;
}

export interface RetrievedChunk {
  id: string;
  title: string;
  category: string;
  content: string;
  similarity: number;
}
