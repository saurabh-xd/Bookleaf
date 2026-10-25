export type UserRole = "AUTHOR" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  authorCode?: string | null;
  phone?: string | null;
  city?: string | null;
  bankDetailsLinked?: boolean;
}

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

export type SSEEventType = "TICKET_CREATED" | "TICKET_UPDATED" | "NEW_MESSAGE" | "CONNECTED";

export interface Book {
  id: string;
  bookCode: string;
  title: string;
  isbn: string;
  genre: string;
  publicationDate: string | null;
  status: string;
  mrp: number | null;
  authorRoyaltyPerCopy: number | null;
  totalCopiesSold: number;
  totalRoyaltyEarned: number;
  royaltyPaid: number;
  royaltyPending: number;
  lastRoyaltyPayoutDate: string | null;
  printPartner: string | null;
  availableOn: string[];
  createdAt: string;
  author?: {
    id: string;
    authorCode: string | null;
    name: string;
    email: string;
  };
  tickets?: Ticket[];
}

export interface BookSummary {
  totalBooks: number;
  totalCopiesSold: number;
  totalRoyaltyEarned: number;
  totalRoyaltyPaid: number;
  totalRoyaltyPending: number;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  isInternalNote: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: UserRole;
    email: string;
  };
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  authorId: string;
  bookId: string | null;
  subject: string;
  description: string;
  category: TicketCategory;
  aiClassifiedCategory: TicketCategory | null;
  isCategoryOverridden: boolean;
  priority: Priority;
  aiPriority: Priority | null;
  isPriorityOverridden: boolean;
  status: TicketStatus;
  assignedAdminId: string | null;
  aiDraftResponse: string | null;
  aiConfidenceScore: number | null;
  aiProcessingStatus: AIProcessingStatus;
  fileAttachmentUrl: string | null;
  fileAttachmentName: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    authorCode?: string | null;
    phone?: string | null;
    city?: string | null;
    bankDetailsLinked?: boolean;
  };
  book?: {
    id: string;
    bookCode: string;
    title: string;
    isbn: string;
    status: string;
  } | null;
  assignedAdmin?: {
    id: string;
    name: string;
    email: string;
  } | null;
  messages?: TicketMessage[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  summary?: BookSummary;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
