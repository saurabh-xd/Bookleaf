import { Router } from "express";
import { z } from "zod";
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
} from "../controllers/ticketController.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

// Protect all ticket routes with authentication
router.use(authenticate);

const createTicketSchema = z.object({
  body: z.object({
    bookId: z.string().uuid("Invalid book ID format").nullable().optional(),
    subject: z.string().min(5, "Subject must be at least 5 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    category: z
      .enum([
        "ROYALTY_PAYMENTS",
        "ISBN_METADATA",
        "PRINTING_QUALITY",
        "DISTRIBUTION_AVAILABILITY",
        "PRODUCTION_UPDATES",
        "GENERAL_INQUIRY",
      ])
      .optional(),
    priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
    fileAttachmentName: z.string().optional(),
    fileAttachmentUrl: z.string().optional(),
  }),
});

const updateTicketSchema = z.object({
  body: z.object({
    status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
    category: z
      .enum([
        "ROYALTY_PAYMENTS",
        "ISBN_METADATA",
        "PRINTING_QUALITY",
        "DISTRIBUTION_AVAILABILITY",
        "PRODUCTION_UPDATES",
        "GENERAL_INQUIRY",
      ])
      .optional(),
    priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
    assignedAdminId: z.string().uuid().nullable().optional(),
  }),
});

// Author & Admin: List tickets & Get single ticket
router.get("/", getTickets);
router.get("/:id", getTicketById);

// Author: Create a support ticket
router.post("/", validate(createTicketSchema), createTicket);

// Admin-only: Update status, priority, category, or assignment
router.patch("/:id", requireRole(["ADMIN"]), validate(updateTicketSchema), updateTicket);

export default router;
