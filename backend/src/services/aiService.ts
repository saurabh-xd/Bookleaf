import { generateObject, generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import config from "../config/index.js";
import { BOOKLEAF_KB, BOOKLEAF_COMMUNICATION_GUIDELINES } from "./knowledgeBase.js";
import { retrieveRelevantChunks } from "./ragService.js";
import type {
  TicketCategory,
  Priority,
  TriageResult,
  DraftContext,
  RetrievedChunk,
} from "../types/index.js";

export type { TicketCategory, Priority, TriageResult, DraftContext, RetrievedChunk };

// Zod schema for structured triage output via Vercel AI SDK
const triageSchema = z.object({
  category: z.enum([
    "ROYALTY_PAYMENTS",
    "ISBN_METADATA",
    "PRINTING_QUALITY",
    "DISTRIBUTION_AVAILABILITY",
    "PRODUCTION_UPDATES",
    "GENERAL_INQUIRY",
  ]),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  confidenceScore: z.number().min(0).max(1),
  reasoning: z.string(),
});

/**
 * Intelligent Heuristic Classifier for Graceful Degradation
 * Guarantees ticket creation and classification never fail if Gemini is offline or rate-limited.
 */
const heuristicTriage = (subject: string, description: string): TriageResult => {
  const text = `${subject} ${description}`.toLowerCase();

  // 1. Royalty & Payments
  if (
    text.includes("royalt") ||
    text.includes("payout") ||
    text.includes("payment") ||
    text.includes("bank") ||
    text.includes("money") ||
    text.includes("threshold") ||
    text.includes("sold") ||
    text.includes("earnings")
  ) {
    const isProlongedDelay =
      (text.includes("months") && (text.includes("haven't received") || text.includes("not received") || text.includes("unpaid") || text.includes("no royalt") || text.includes("pending") || text.includes("delay"))) ||
      text.includes("6 months") ||
      text.includes("critical") ||
      text.includes("urgent");

    const isHigh =
      text.includes("haven't received") ||
      text.includes("not received") ||
      text.includes("unpaid") ||
      text.includes("delay") ||
      text.includes("months");

    return {
      category: "ROYALTY_PAYMENTS",
      priority: isProlongedDelay ? "CRITICAL" : isHigh ? "HIGH" : "MEDIUM",
      confidenceScore: isProlongedDelay ? 0.96 : 0.9,
      reasoning: isProlongedDelay
        ? "Flagged as CRITICAL priority due to severe royalty delay (> 3 months)."
        : "Matched royalty and payment inquiries; flagged for finance review.",
      source: "HEURISTIC_FALLBACK",
    };
  }

  // 2. ISBN & Metadata
  if (
    text.includes("isbn") ||
    text.includes("imprint") ||
    text.includes("barcode") ||
    text.includes("wrong book") ||
    text.includes("duplicate")
  ) {
    return {
      category: "ISBN_METADATA",
      priority: "HIGH",
      confidenceScore: 0.95,
      reasoning: "Matched ISBN/catalog discrepancy; prioritized as high per company policy.",
      source: "HEURISTIC_FALLBACK",
    };
  }

  // 3. Printing & Quality
  if (
    text.includes("print") ||
    text.includes("blurry") ||
    text.includes("binding") ||
    text.includes("defect") ||
    text.includes("quality") ||
    text.includes("page") ||
    text.includes("damaged") ||
    text.includes("misaligned")
  ) {
    const isCritical = text.includes("terrible") || text.includes("damaged") || text.includes("defective");
    return {
      category: "PRINTING_QUALITY",
      priority: isCritical ? "HIGH" : "MEDIUM",
      confidenceScore: 0.92,
      reasoning: "Matched physical print defect terms; queued for reprint verification.",
      source: "HEURISTIC_FALLBACK",
    };
  }

  // 4. Distribution & Availability
  if (
    text.includes("unavailable") ||
    text.includes("amazon") ||
    text.includes("flipkart") ||
    text.includes("out of stock") ||
    text.includes("not showing") ||
    text.includes("listing")
  ) {
    return {
      category: "DISTRIBUTION_AVAILABILITY",
      priority: "MEDIUM",
      confidenceScore: 0.88,
      reasoning: "Matched platform inventory and availability status.",
      source: "HEURISTIC_FALLBACK",
    };
  }

  // 5. Production Updates
  if (
    text.includes("typesetting") ||
    text.includes("cover design") ||
    text.includes("proofreading") ||
    text.includes("manuscript") ||
    text.includes("status") ||
    text.includes("when will") ||
    text.includes("stage") ||
    text.includes("delayed")
  ) {
    return {
      category: "PRODUCTION_UPDATES",
      priority: text.includes("weeks") ? "MEDIUM" : "LOW",
      confidenceScore: 0.86,
      reasoning: "Matched publication workflow stages and turnaround inquiries.",
      source: "HEURISTIC_FALLBACK",
    };
  }

  // 6. General Inquiry Default
  return {
    category: "GENERAL_INQUIRY",
    priority: "LOW",
    confidenceScore: 0.78,
    reasoning: "General account or metadata update inquiry.",
    source: "HEURISTIC_FALLBACK",
  };
};

/**
 * Strips raw markdown stars/asterisks (* and **) from AI-generated text,
 * ensuring clean, human-like plain conversational replies without asterisks.
 */
export const stripMarkdownStars = (text: string): string => {
  if (!text) return "";
  return text
    // Replace **bold** with plain text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    // Replace *italic* with plain text
    .replace(/\*([^\*\n]+)\*/g, "$1")
    // Replace list bullets with stars "* " to clean bullet "• "
    .replace(/^(\s*)\*\s+/gm, "$1• ")
    // Clean any residual triple or double stars
    .replace(/\*{2,}/g, "")
    // Clean any stray single asterisks around words
    .replace(/(^|\s)\*([^\s\*]+)\*(\s|$)/g, "$1$2$3")
    .trim();
};

/**
 * Heuristic response draft generator grounded in BookLeaf Knowledge Base policies
 */
const heuristicDraftResponse = (ctx: DraftContext, _retrievedChunks: RetrievedChunk[] = []): string => {
  const bookRef = ctx.bookTitle ? ` regarding "${ctx.bookTitle}"` : "";
  const effectiveCategory = ctx.category;

  switch (effectiveCategory) {
    case "ROYALTY_PAYMENTS": {
      const pendingInfo =
        ctx.royaltyPending !== undefined && ctx.royaltyPending > 0
          ? `Your current pending royalty is ₹${ctx.royaltyPending}. `
          : "";
      return (
        `Dear ${ctx.authorName},\n\n` +
        `Thank you for reaching out to BookLeaf Support${bookRef}. I understand your concern regarding your royalty payout and appreciate your patience.\n\n` +
        `As per BookLeaf's royalty policy, royalties are calculated quarterly based on our 80/20 net profit split and distributed within 45 days of the quarter ending. The minimum payout threshold is ₹1,000; amounts below this threshold automatically roll over to the subsequent quarter.\n\n` +
        `${pendingInfo}Our finance department is reviewing your account and linked bank details. We will provide a definitive update and payment timeline within 48 hours.\n\n` +
        `Please feel free to reply directly to this ticket if you have any questions in the interim.\n\n` +
        `Warm regards,\n` +
        `BookLeaf Author Support Team`
      );
    }
    case "ISBN_METADATA": {
      return (
        `Dear ${ctx.authorName},\n\n` +
        `Thank you for reporting this issue${bookRef}. We treat ISBN and catalog discrepancies with the highest priority, as accurate metadata is vital for your book's distribution.\n\n` +
        `I have escalated this ticket directly to our senior production and catalog team. We are actively cross-verifying the registered ISBN against distribution records and will resolve any platform discrepancies within 48 hours.\n\n` +
        `We will notify you the moment the corrected metadata is re-synchronized across all channels.\n\n` +
        `Warm regards,\n` +
        `BookLeaf Author Support Team`
      );
    }
    case "PRINTING_QUALITY": {
      return (
        `Dear ${ctx.authorName},\n\n` +
        `We sincerely apologize for the quality issue you experienced with your author copies${bookRef}. We hold our print partners to rigorous standards, and we are sorry that your shipment fell short.\n\n` +
        `To ensure we address this immediately, could you please share a few photos of the defective copies (highlighting the binding or print defects)? Once verified, BookLeaf will arrange a complimentary reprint at zero cost to you, with a turnaround of 5–7 business days.\n\n` +
        `Thank you for your partnership and patience.\n\n` +
        `Warm regards,\n` +
        `BookLeaf Production Team`
      );
    }
    case "DISTRIBUTION_AVAILABILITY": {
      return (
        `Dear ${ctx.authorName},\n\n` +
        `Thank you for notifying us about the availability status${bookRef}. When a published title displays as "Currently Unavailable" on Amazon or Flipkart, it typically indicates a temporary platform stock synchronization delay.\n\n` +
        `We have triggered an immediate inventory re-sync with our distribution partner. The listing should refresh and reflect live inventory within 24–48 hours.\n\n` +
        `We will keep this ticket open and monitor the listing until it is confirmed active.\n\n` +
        `Warm regards,\n` +
        `BookLeaf Distribution Support`
      );
    }
    case "PRODUCTION_UPDATES": {
      const currentStage = ctx.bookStatus ? ` (currently at ${ctx.bookStatus})` : "";
      return (
        `Dear ${ctx.authorName},\n\n` +
        `Thank you for following up on the progress of your book${bookRef}${currentStage}.\n\n` +
        `Our editorial and design teams are working to ensure your book meets high publication standards. We are reviewing the current timeline and will send you a detailed update on your next proofing milestone within 48 hours.\n\n` +
        `Please let us know if you have specific revisions or questions.\n\n` +
        `Warm regards,\n` +
        `BookLeaf Publishing Team`
      );
    }
    default: {
      return (
        `Dear ${ctx.authorName},\n\n` +
        `Thank you for reaching out to BookLeaf Author Support${bookRef}.\n\n` +
        `We have received your inquiry and our team is reviewing the details. For metadata or account updates, changes usually take 3–5 business days to propagate across platforms. We will get back to you with a full response shortly.\n\n` +
        `Warm regards,\n` +
        `BookLeaf Author Support Team`
      );
    }
  }
};

/**
 * Type-Safe AI Triage using Vercel AI SDK generateObject
 * Tries Gemini 3.1 Flash-Lite -> 2.5 Flash before falling back to heuristics
 */
export const triageTicket = async (subject: string, description: string): Promise<TriageResult> => {
  if (config.ai.geminiApiKey) {
    const google = createGoogleGenerativeAI({
      apiKey: config.ai.geminiApiKey,
    });

    const prompt = `You are the lead triage AI for BookLeaf Publishing author support.
Classify the ticket into EXACTLY one category and determine its priority score.

Categories:
- ROYALTY_PAYMENTS: queries about sales, unpaid royalties, payout dates, calculations, bank details.
- ISBN_METADATA: ISBN errors, wrong book linked, barcode issues, author bio or title changes.
- PRINTING_QUALITY: physical copy defects, blurry text/images, misaligned pages, damaged shipment.
- DISTRIBUTION_AVAILABILITY: showing "Currently Unavailable" on Amazon/Flipkart, stock sync.
- PRODUCTION_UPDATES: delays in cover design, typesetting, proofreading, publication timeline.
- GENERAL_INQUIRY: general account questions, packages, standard requests.

Priority Guidelines:
- CRITICAL: Severe financial escalation (unpaid royalty > 3 months) or major live disruption.
- HIGH: Serious data discrepancy (ISBN errors), major print defects, or overdue payments.
- MEDIUM: Availability sync issues, royalty breakdown requests, delayed production stages.
- LOW: General questions, minor bio updates, standard turnaround requests.

Ticket Subject: "${subject}"
Ticket Description: "${description}"`;

    const candidateModels = [
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
    ];

    for (const modelName of candidateModels) {
      try {
        const result = await generateObject({
          model: google(modelName),
          schema: triageSchema,
          prompt,
          abortSignal: AbortSignal.timeout(10000),
        });

        return {
          category: result.object.category,
          priority: result.object.priority,
          confidenceScore: result.object.confidenceScore,
          reasoning: result.object.reasoning,
          source: "AI_MODEL",
        };
      } catch (err) {
        // Silently proceed to next model in candidate chain
      }
    }
  }

  // Graceful degradation fallback
  return heuristicTriage(subject, description);
};

/**
 * True Vector RAG with Vercel AI SDK generateText
 * Uses gemini-3.1-flash-lite for grounded, empathetic draft generation
 */
export const generateDraftResponse = async (ctx: DraftContext): Promise<string> => {
  // 1. Vector Search: Retrieve top-2 semantically closest knowledge chunks from PostgreSQL pgvector
  const retrievedChunks = await retrieveRelevantChunks(`${ctx.subject} ${ctx.description}`, 2);

  const knowledgeContext =
    retrievedChunks.length > 0
      ? retrievedChunks
        .map((chunk, i) => `[Policy Chunk ${i + 1} (${chunk.title}) - Similarity: ${chunk.similarity}]:\n${chunk.content}`)
        .join("\n\n")
      : BOOKLEAF_KB[ctx.category]?.rules.join("\n") || "";

  if (config.ai.geminiApiKey) {
    const google = createGoogleGenerativeAI({
      apiKey: config.ai.geminiApiKey,
    });

    const systemPrompt = `You are a professional, empathetic author support representative at BookLeaf Publishing.
Follow BookLeaf policies strictly:
${BOOKLEAF_COMMUNICATION_GUIDELINES}`;

    const userPrompt = `Author Name: ${ctx.authorName}
Associated Book: ${ctx.bookTitle || "General Account"}
Book Status: ${ctx.bookStatus || "N/A"}
Sales Copies: ${ctx.copiesSold ?? "N/A"}
Pending Royalty: ${ctx.royaltyPending !== undefined ? `₹${ctx.royaltyPending}` : "N/A"}
Last Payout Date: ${ctx.lastPayoutDate || "None"}

Author Subject: "${ctx.subject}"
Author Message: "${ctx.description}"

Relevant BookLeaf Knowledge Base Policies (Retrieved via pgvector Similarity Search):
${knowledgeContext}

Rules:
1. Address the author warmly by first name.
2. Acknowledge their concern with sincere empathy before giving solutions.
3. Be specific: include actual numbers, dates, policies, or resolution timelines (e.g. 48 hours for escalation, 5-7 business days for reprints, 24-48 hours for stock sync).
4. Do not make up facts outside the provided context.
5. End with a clear next step and sign off as "BookLeaf Author Support Team".
6. Write in clean, plain conversational text only. DO NOT use markdown asterisks (* or **), bolding stars, italics, or markdown headings. Write clear, natural paragraphs as in a professional email or chat message.`;

    const candidateModels = [
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
    ];

    for (const modelName of candidateModels) {
      try {
        const { text } = await generateText({
          model: google(modelName),
          system: systemPrompt,
          prompt: userPrompt,
          abortSignal: AbortSignal.timeout(15000),
        });

        if (text && text.trim()) {
          return stripMarkdownStars(text);
        }
      } catch (err) {
        // Silently proceed to next model in candidate chain
      }
    }
  }

  // Graceful degradation fallback
  return heuristicDraftResponse(ctx, retrievedChunks);
};
