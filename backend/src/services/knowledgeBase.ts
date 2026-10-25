export interface KnowledgeSection {
  title: string;
  category: string;
  rules: string[];
}

export const BOOKLEAF_KB: Record<string, KnowledgeSection> = {
  ROYALTY_PAYMENTS: {
    title: "Royalty Policy",
    category: "ROYALTY_PAYMENTS",
    rules: [
      "BookLeaf follows an 80/20 royalty split: 80% of net profit per book goes to the author, 20% to BookLeaf.",
      "Net profit calculation: MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping charges.",
      "Royalties are calculated quarterly and paid within 45 days of the quarter ending.",
      "Minimum payout threshold is ₹1,000. If accumulated royalties are below ₹1,000, they roll over to the next quarter.",
      "Payouts are made via direct bank transfer to the account linked in the author's dashboard.",
      "Authors can view a detailed royalty breakdown in their dashboard, showing sales figures per platform.",
      "Tone: Acknowledge frustration empathetically. Explain the quarterly cycle and 45-day window clearly. If payment is genuinely overdue, offer a 48-hour resolution timeline. Never be defensive; offer line-by-line transparency.",
    ],
  },
  ISBN_METADATA: {
    title: "ISBN Policy",
    category: "ISBN_METADATA",
    rules: [
      "Every book published through BookLeaf receives a unique ISBN assigned by BookLeaf.",
      "ISBNs are registered under BookLeaf's publisher imprint. If an author wants an ISBN under their own imprint, they must obtain it independently.",
      "If an author reports an ISBN error (duplicate, wrong book linked, mismatch on Amazon vs physical copy), it is treated as a high-priority issue and escalated directly to the production team with a 48-hour resolution timeline.",
      "Tone: Treat as high priority. Acknowledge this is a serious data issue and confirm immediate escalation.",
    ],
  },
  PRINTING_QUALITY: {
    title: "Printing & Quality Policy",
    category: "PRINTING_QUALITY",
    rules: [
      "In-house printing facility and warehouse are located in Delhi. Overflow or specific format requirements go to Repro India or Epitome Books.",
      "Standard print turnaround: 5–7 business days from order confirmation.",
      "If an author reports a quality issue (misprints, binding defects, blurry images, misaligned pages, color inconsistency), BookLeaf arranges a free reprint after verification.",
      "The author may need to share photos of the defective copies for verification.",
      "Turnaround for reprint: 5–7 business days once verified.",
      "Tone: Apologize sincerely. Request photos of defective copies politely. Confirm free reprint and give the 5–7 business day turnaround.",
    ],
  },
  DISTRIBUTION_AVAILABILITY: {
    title: "Distribution & Availability Policy",
    category: "DISTRIBUTION_AVAILABILITY",
    rules: [
      "Books are listed on Amazon India, Flipkart, Amazon US, Amazon UK, and the BookLeaf Store.",
      "New listings typically go live within 7–10 business days after publication is complete.",
      "If a book is showing as 'Currently Unavailable' on Amazon or other platforms, it usually indicates a stock sync issue.",
      "BookLeaf's team can trigger an inventory re-sync with the distribution team within 24–48 hours for it to go live again.",
      "Tone: Reassure author that this is typically a platform stock sync issue. Confirm re-sync triggered with 24–48 hour timeline.",
    ],
  },
  PRODUCTION_UPDATES: {
    title: "Production Stages & Timelines",
    category: "PRODUCTION_UPDATES",
    rules: [
      "Book publication stages: Manuscript Received -> Editing (if opted) -> Cover Design -> Typesetting -> Proofreading -> ISBN Assignment -> Printing -> Distribution Setup -> Published & Live.",
      "Authors are updated at each stage via email. Delays typically happen at Cover Design (waiting for author approval) and Proofreading (revision rounds).",
      "Tone: Check actual production stage status. Be honest about reasons for delay. Provide a specific updated timeline. Frame collaboratively, never blaming the author even if awaiting their approval.",
    ],
  },
  GENERAL_INQUIRY: {
    title: "General Inquiries & Account Services",
    category: "GENERAL_INQUIRY",
    rules: [
      "BookLeaf Publishing is a leading self-publishing company operating in India and the US, processing 1,200+ books monthly across 22,000+ titles.",
      "Packages: Standard Free (no upfront cost) and Bestseller Breakthrough (premium with marketing and distribution add-ons).",
      "Metadata updates (book description, bio, categories) can be submitted through the dashboard or by contacting BookLeaf support.",
      "Metadata changes typically reflect on distribution platforms within 3–5 business days.",
      "Tone: Friendly, helpful, professional, clear next steps.",
    ],
  },
};

export const BOOKLEAF_COMMUNICATION_GUIDELINES = `
Communication Tone Guidelines:
- Always empathetic and professional. Authors are partners, not customers to be managed.
- Acknowledge the author's concern before jumping to solutions.
- Be specific: include actual numbers, dates, and statuses wherever possible rather than vague reassurances.
- If something is BookLeaf's fault (delayed royalties, ISBN error), own it directly. No corporate deflection.
- If the issue requires escalation or investigation, give a clear timeline ("Our team will look into this and get back to you within 48 hours").
- Always end with a clear next step for the author and/or the BookLeaf team.
`;
