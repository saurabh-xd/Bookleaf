import type {
  ApiResponse,
  AuthUser,
  Book,
  BookSummary,
  Ticket,
  TicketMessage,
  TicketCategory,
  Priority,
  TicketStatus,
} from "../types/index";

const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const API_BASE_URL = rawUrl.endsWith("/api")
  ? rawUrl
  : `${rawUrl.replace(/\/+$/, "")}/api`;

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("bookleaf_token") || localStorage.getItem("bookleaf_token");
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      const errorMessage =
        (data as any)?.message ||
        data.error?.message ||
        (typeof data.error === "string" ? data.error : null) ||
        `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error: any) {
    console.error(`API Error on [${options.method || "GET"} ${endpoint}]:`, error);
    throw error;
  }
}

// Auth API
export const api = {
  auth: {
    login: async (email: string, password: string) =>
      apiRequest<{ token: string; user: AuthUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    getMe: async () => apiRequest<AuthUser>("/auth/me"),
  },

  books: {
    list: async (params?: { authorId?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.authorId) query.append("authorId", params.authorId);
      if (params?.search) query.append("search", params.search);
      const qs = query.toString() ? `?${query.toString()}` : "";
      return apiRequest<Book[]>(`/books${qs}`);
    },
    getById: async (id: string) => apiRequest<Book>(`/books/${id}`),
  },

  tickets: {
    list: async (params?: {
      status?: TicketStatus;
      category?: TicketCategory;
      priority?: Priority;
      search?: string;
      sortBy?: "urgent" | "newest" | "oldest";
      page?: number;
      limit?: number;
    }) => {
      const query = new URLSearchParams();
      if (params?.status) query.append("status", params.status);
      if (params?.category) query.append("category", params.category);
      if (params?.priority) query.append("priority", params.priority);
      if (params?.search) query.append("search", params.search);
      if (params?.sortBy) query.append("sortBy", params.sortBy);
      if (params?.page) query.append("page", params.page.toString());
      if (params?.limit) query.append("limit", params.limit.toString());
      const qs = query.toString() ? `?${query.toString()}` : "";
      return apiRequest<Ticket[]>(`/tickets${qs}`);
    },

    getById: async (id: string) => apiRequest<Ticket>(`/tickets/${id}`),

    create: async (data: {
      bookId?: string | null;
      subject: string;
      description: string;
      fileAttachmentName?: string;
      fileAttachmentUrl?: string;
    }) =>
      apiRequest<Ticket>("/tickets", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: async (
      id: string,
      data: {
        status?: TicketStatus;
        category?: TicketCategory;
        priority?: Priority;
        assignedAdminId?: string | null;
      }
    ) =>
      apiRequest<Ticket>(`/tickets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    addMessage: async (
      id: string,
      data: {
        message: string;
        isInternalNote?: boolean;
      }
    ) =>
      apiRequest<TicketMessage>(`/tickets/${id}/messages`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    regenerateDraft: async (id: string) =>
      apiRequest<{ aiDraftResponse: string }>(`/tickets/${id}/generate-draft`, {
        method: "POST",
      }),
  },
};
