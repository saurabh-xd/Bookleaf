export type TicketCategory =
  | "ROYALTY_PAYMENTS"
  | "ISBN_METADATA"
  | "PRINTING_QUALITY"
  | "DISTRIBUTION_AVAILABILITY"
  | "PRODUCTION_UPDATES"
  | "GENERAL_INQUIRY";

export type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type AIProcessingStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "FALLBACK";
