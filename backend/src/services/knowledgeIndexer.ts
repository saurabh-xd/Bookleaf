import prisma from "../config/prisma.js";
import { createDocumentEmbeddings } from "./embeddingService.js";

export interface RawPolicyChunk {
  title: string;
  category: string;
  content: string;
}

export const BOOKLEAF_POLICY_CHUNKS: RawPolicyChunk[] = [
  {
    title: "Royalty 80/20 Split & Net Profit Formula",
    category: "ROYALTY_PAYMENTS",
    content:
      "BookLeaf follows an 80/20 royalty split where 80% of net profit per book goes to the author, and 20% to BookLeaf. Net profit is calculated as: MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping charges. Authors receive full line-by-line transparency for printing and platform deductions.",
  },
  {
    title: "Quarterly Royalty Payout Schedule & Threshold",
    category: "ROYALTY_PAYMENTS",
    content:
      "Royalties are calculated quarterly and distributed within 45 days of the quarter ending. The minimum payout threshold is ₹1,000. If accumulated royalties for an author are below ₹1,000, they roll over to the subsequent quarter. Payouts are transferred directly to the bank account linked in the author dashboard.",
  },
  {
    title: "ISBN Assignment, Imprint & Metadata Resolution",
    category: "ISBN_METADATA",
    content:
      "Every book published through BookLeaf receives a unique ISBN registered under BookLeaf's publisher imprint. If an author wants an ISBN under their own imprint, they must obtain it independently. Any report of duplicate ISBNs, wrong book linked, or metadata mismatch on Amazon vs physical copy is treated as a high-priority incident escalated directly to the production team with a 48-hour resolution timeline.",
  },
  {
    title: "Printing Standards, Defect Verification & Free Reprints",
    category: "PRINTING_QUALITY",
    content:
      "BookLeaf's in-house printing facility and warehouse are located in Delhi, with overflow handled by Repro India and Epitome Books. Standard print turnaround is 5–7 business days from order confirmation. If an author reports printing defects (misprints, binding defects, blurry images, misaligned pages, color inconsistency), BookLeaf arranges a complimentary reprint once the author shares photos for defect verification, with a 5–7 business day reprint turnaround.",
  },
  {
    title: "Distribution Channels & 24–48h Stock Re-sync",
    category: "DISTRIBUTION_AVAILABILITY",
    content:
      "Published books are listed across Amazon India, Flipkart, Amazon US, Amazon UK, and the BookLeaf Store. New listings typically go live within 7–10 business days after publication is complete. If a published book displays as 'Currently Unavailable' on Amazon or other platforms, it indicates a stock synchronization issue. BookLeaf triggers an inventory re-sync with the distribution partner within 24–48 hours for the listing to go live again.",
  },
  {
    title: "Production Stages, Proofing Delays & Turnaround",
    category: "PRODUCTION_UPDATES",
    content:
      "Book publication stages: Manuscript Received -> Editing (if opted) -> Cover Design -> Typesetting -> Proofreading -> ISBN Assignment -> Printing -> Distribution Setup -> Published & Live. Authors are updated at each stage via email. Delays typically occur during Cover Design waiting for author approval or Proofreading revision rounds. Support provides specific milestone timelines and collaborative updates without deflecting blame.",
  },
  {
    title: "General Inquiries, Publishing Packages & Author Metadata",
    category: "GENERAL_INQUIRY",
    content:
      "BookLeaf Publishing processes 1,200+ books monthly across a catalog of 22,000+ titles in India and the US. Packages include Standard Free (no upfront cost) and Bestseller Breakthrough (marketing and distribution add-ons). Metadata updates (author bio, book description) submitted via dashboard or email reflect on distribution platforms within 3–5 business days.",
  },
];

/**
 * Indexes the Knowledge Base chunks into Neon PostgreSQL with vector embeddings
 */
export const indexKnowledgeBase = async (): Promise<number> => {
  console.log("🔍 Checking existing vector knowledge base chunks...");

  const existingCount = await prisma.knowledgeChunk.count();
  if (existingCount >= BOOKLEAF_POLICY_CHUNKS.length) {
    console.log(`✅ Vector knowledge base already indexed (${existingCount} chunks).`);
    return existingCount;
  }

  // Clear any partial chunks
  await prisma.knowledgeChunk.deleteMany();
  console.log("⚡ Generating batch document embeddings via Vercel AI SDK embedMany...");

  const texts = BOOKLEAF_POLICY_CHUNKS.map((c) => `${c.title}. ${c.content}`);
  const embeddings = await createDocumentEmbeddings(texts);

  let indexedCount = 0;

  for (let i = 0; i < BOOKLEAF_POLICY_CHUNKS.length; i++) {
    const chunk = BOOKLEAF_POLICY_CHUNKS[i];
    const embedding = embeddings[i];
    const vectorString = `[${embedding.join(",")}]`;

    // Insert into Neon PostgreSQL using raw SQL with vector cast
    await prisma.$executeRawUnsafe(
      `INSERT INTO "KnowledgeChunk" ("id", "title", "category", "content", "embedding", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4::vector, NOW());`,
      chunk.title,
      chunk.category,
      chunk.content,
      vectorString
    );

    indexedCount++;
    console.log(`   📄 Indexed chunk [${chunk.category}]: "${chunk.title}"`);
  }

  console.log(`✅ Indexed ${indexedCount} policy chunks into pgvector successfully!`);
  return indexedCount;
};
