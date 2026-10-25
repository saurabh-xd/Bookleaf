import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { registerSSEClient, getActiveSSECount } from "../services/sseService.js";
import type { TokenPayload } from "../types/index.js";

const router = Router();

/**
 * GET /api/events
 * Real-time Server-Sent Events (SSE) connection stream
 * Supports both query param (?token=...) and Authorization header
 */
router.get("/", (req: Request, res: Response) => {
  const queryToken = req.query.token as string | undefined;
  const headerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.substring(7)
    : undefined;

  const rawToken = queryToken || headerToken;

  if (!rawToken) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication token required to connect to real-time event stream",
      },
    });
  }

  try {
    const decoded = jwt.verify(rawToken, config.jwt.secret) as TokenPayload;

    if (!decoded.id || !decoded.role) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid token payload for real-time connection",
        },
      });
    }

    // Register active SSE client stream
    registerSSEClient(decoded.id, decoded.role, res);
  } catch {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or expired token for real-time connection",
      },
    });
  }
});

/**
 * GET /api/events/status
 * Diagnostic endpoint to inspect active SSE connection counts
 */
router.get("/status", (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: {
      activeConnections: getActiveSSECount(),
    },
  });
});

export default router;
