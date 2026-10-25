import { Response } from "express";
import type { SSEEventType, UserRole } from "../types/index.js";

interface SSEClient {
  id: string;
  userId: string;
  role: UserRole;
  res: Response;
}

// In-memory active SSE client connections
const clients = new Map<string, SSEClient>();

let heartbeatInterval: NodeJS.Timeout | null = null;

/**
 * Sends a raw SSE event payload formatted according to the W3C EventSource standard
 */
const sendRawEvent = (res: Response, event: SSEEventType, data: any) => {
  try {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (err) {
    console.warn("Failed to write to SSE client stream:", err);
  }
};

/**
 * Starts standard SSE keep-alive comment ping (: ping) every 25 seconds
 * Prevents Nginx, Vercel, and cloud load-balancer idle stream timeouts
 */
const ensureHeartbeat = () => {
  if (heartbeatInterval) return;

  heartbeatInterval = setInterval(() => {
    if (clients.size === 0) {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      return;
    }

    const timestamp = new Date().toISOString();
    for (const [clientId, client] of clients.entries()) {
      try {
        client.res.write(`: ping ${timestamp}\n\n`);
      } catch {
        clients.delete(clientId);
      }
    }
  }, 25000);
};

/**
 * Registers an authenticated SSE connection and initializes headers
 */
export const registerSSEClient = (
  userId: string,
  role: UserRole,
  res: Response
): string => {
  const clientId = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Set standard SSE response headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // Disables Nginx buffering for immediate delivery
  });

  res.flushHeaders?.();

  const client: SSEClient = { id: clientId, userId, role, res };
  clients.set(clientId, client);

  // Send initial connection confirmation event
  sendRawEvent(res, "CONNECTED", {
    status: "CONNECTED",
    clientId,
    timestamp: new Date().toISOString(),
  });

  ensureHeartbeat();

  // Clean up when client disconnects
  res.on("close", () => {
    clients.delete(clientId);
  });

  return clientId;
};

/**
 * Broadcasts an event to all connected Admins
 */
export const broadcastToAdmins = (event: SSEEventType, data: any): void => {
  for (const client of clients.values()) {
    if (client.role === "ADMIN") {
      sendRawEvent(client.res, event, data);
    }
  }
};

/**
 * Sends an event to all active sessions of a specific User
 */
export const sendToUser = (userId: string, event: SSEEventType, data: any): void => {
  for (const client of clients.values()) {
    if (client.userId === userId) {
      sendRawEvent(client.res, event, data);
    }
  }
};

/**
 * Broadcasts a ticket-related event with strict server-side security:
 * - Always dispatches to all connected Admins
 * - Dispatches to the author ONLY if it is not an internal admin note
 */
export const broadcastTicketEvent = (
  authorId: string,
  event: SSEEventType,
  data: any,
  options: { isInternalNote?: boolean } = {}
): void => {
  // 1. Admins always receive all ticket events (including internal notes)
  broadcastToAdmins(event, data);

  // 2. Author receives public events only (NEVER internal notes)
  if (!options.isInternalNote) {
    sendToUser(authorId, event, data);
  }
};

/**
 * Returns current count of connected SSE streams
 */
export const getActiveSSECount = (): number => clients.size;
