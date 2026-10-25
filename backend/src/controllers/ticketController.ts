import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma.js";
import { throwBadRequest, throwNotFound, throwForbidden } from "../utils/errors.js";
import { triageTicket, generateDraftResponse } from "../services/aiService.js";
import { broadcastTicketEvent, broadcastToAdmins } from "../services/sseService.js";
import type { TicketCategory } from "../types/index.js";

/**
 * Create a new support ticket with automatic AI triage and draft generation
 */
export const createTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const {
      bookId,
      subject,
      description,
      fileAttachmentName,
      fileAttachmentUrl,
    } = req.body;

    if (!subject || !description) {
      return throwBadRequest("Subject and description are required");
    }

    // If bookId is supplied, verify it exists and belongs to the author (if user is author)
    let book: any = null;
    if (bookId) {
      book = await prisma.book.findUnique({
        where: { id: bookId },
      });

      if (!book) {
        return throwBadRequest("Selected book does not exist");
      }

      if (user.role === "AUTHOR" && book.authorId !== user.id) {
        return throwForbidden("You can only raise queries for your own books");
      }
    }

    // Generate sequential ticket number (e.g. BL-1001)
    const count = await prisma.ticket.count();
    const ticketNumber = `BL-${1000 + count + 1}`;

    // 1. AI Auto-Classification & Dynamic Priority Scoring (minimal token context)
    const triage = await triageTicket(subject, description);

    // 2. Category-Routed RAG Draft Generation (grounded in BookLeaf KB + live author stats)
    const aiDraft = await generateDraftResponse({
      authorName: user.name,
      bookTitle: book?.title,
      bookStatus: book?.status,
      mrp: book?.mrp,
      copiesSold: book?.totalCopiesSold,
      royaltyPending: book?.royaltyPending,
      lastPayoutDate: book?.lastRoyaltyPayoutDate?.toISOString(),
      subject: subject.trim(),
      description: description.trim(),
      category: triage.category,
    });

    // 3. Persist Ticket in Database
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        authorId: user.id,
        bookId: bookId || null,
        subject: subject.trim(),
        description: description.trim(),
        category: triage.category,
        aiClassifiedCategory: triage.category,
        priority: triage.priority,
        aiPriority: triage.priority,
        status: "OPEN",
        aiDraftResponse: aiDraft,
        aiConfidenceScore: triage.confidenceScore,
        aiProcessingStatus: triage.source === "AI_MODEL" ? "SUCCESS" : "FALLBACK",
        fileAttachmentName: fileAttachmentName || null,
        fileAttachmentUrl: fileAttachmentUrl || null,
      },
      include: {
        author: {
          select: { id: true, authorCode: true, name: true, email: true },
        },
        book: {
          select: { id: true, bookCode: true, title: true, isbn: true, status: true },
        },
      },
    });

    // 4. Create initial message in thread from author
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: user.id,
        message: description.trim(),
        isInternalNote: false,
      },
    });

    // 5. Broadcast real-time SSE notification (Admin triage queue & Author ticket list)
    broadcastTicketEvent(user.id, "TICKET_CREATED", {
      ticket,
    });

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List tickets with filtering, searching, and urgency-first sorting
 */
export const getTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const {
      status,
      category,
      priority,
      search,
      sortBy = "urgent",
      page = "1",
      limit = "20",
    } = req.query;

    const whereClause: any = {};

    // Authors only see their own tickets
    if (user.role === "AUTHOR") {
      whereClause.authorId = user.id;
    }

    if (status) {
      whereClause.status = String(status);
    }

    if (category) {
      whereClause.category = String(category);
    }

    if (priority) {
      whereClause.priority = String(priority);
    }

    if (search) {
      whereClause.OR = [
        { subject: { contains: String(search), mode: "insensitive" } },
        { ticketNumber: { contains: String(search), mode: "insensitive" } },
        { author: { name: { contains: String(search), mode: "insensitive" } } },
        { book: { title: { contains: String(search), mode: "insensitive" } } },
      ];
    }

    // Urgency-first sorting: CRITICAL & HIGH first, oldest unresolved first
    let orderBy: any = [{ createdAt: "desc" }];
    if (sortBy === "urgent") {
      orderBy = [{ priority: "asc" }, { createdAt: "asc" }];
    } else if (sortBy === "oldest") {
      orderBy = [{ createdAt: "asc" }];
    } else if (sortBy === "newest") {
      orderBy = [{ createdAt: "desc" }];
    }

    const pageNum = parseInt(String(page), 10) || 1;
    const take = parseInt(String(limit), 10) || 20;
    const skip = (pageNum - 1) * take;

    const [tickets, totalCount] = await Promise.all([
      prisma.ticket.findMany({
        where: whereClause,
        include: {
          author: {
            select: { id: true, authorCode: true, name: true, email: true },
          },
          book: {
            select: { id: true, bookCode: true, title: true, isbn: true, status: true },
          },
          assignedAdmin: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.ticket.count({ where: whereClause }),
    ]);

    return res.status(200).json({
      success: true,
      data: tickets,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(totalCount / take),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single ticket details and conversation thread
 * Strips internal notes for Authors; preserves internal notes for Admins
 */
export const getTicketById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            authorCode: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            bankDetailsLinked: true,
          },
        },
        book: true,
        assignedAdmin: {
          select: { id: true, name: true, email: true },
        },
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      return throwNotFound("Ticket not found");
    }

    // Authors can only view their own tickets
    if (user.role === "AUTHOR" && ticket.authorId !== user.id) {
      return throwForbidden("You cannot view this ticket");
    }

    // Filter internal notes if viewer is an author
    const sanitizedMessages = ticket.messages.filter((msg) => {
      if (user.role === "AUTHOR") {
        return !msg.isInternalNote;
      }
      return true;
    });

    return res.status(200).json({
      success: true,
      data: {
        ...ticket,
        messages: sanitizedMessages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update ticket properties (Admin: status, category, priority, assignment)
 */
export const updateTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, category, priority, assignedAdminId } = req.body;

    const existingTicket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!existingTicket) {
      return throwNotFound("Ticket not found");
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;
    }

    if (category && category !== existingTicket.category) {
      updateData.category = category;
      updateData.isCategoryOverridden = true;
    }

    if (priority && priority !== existingTicket.priority) {
      updateData.priority = priority;
      updateData.isPriorityOverridden = true;
    }

    if (assignedAdminId !== undefined) {
      updateData.assignedAdminId = assignedAdminId || null;
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        assignedAdmin: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Broadcast real-time update to Author and Admin queue
    broadcastTicketEvent(existingTicket.authorId, "TICKET_UPDATED", {
      ticketId: id,
      ticket: updated,
      updatedFields: updateData,
    });

    return res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a message to ticket (Author reply, Admin public reply, or Admin internal note)
 */
export const addMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { message, isInternalNote = false } = req.body;

    if (!message || !message.trim()) {
      return throwBadRequest("Message content is required");
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return throwNotFound("Ticket not found");
    }

    // Reject message if ticket is CLOSED
    if (ticket.status === "CLOSED") {
      return throwBadRequest("Cannot reply to a closed ticket");
    }

    // Authors can only reply to their own tickets
    if (user.role === "AUTHOR" && ticket.authorId !== user.id) {
      return throwForbidden("You cannot reply to this ticket");
    }

    // Only admins can post internal notes
    const effectiveInternalNote = user.role === "ADMIN" ? Boolean(isInternalNote) : false;

    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: user.id,
        message: message.trim(),
        isInternalNote: effectiveInternalNote,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // If an admin posts a public reply to an OPEN ticket, auto-advance status to IN_PROGRESS
    if (user.role === "ADMIN" && !effectiveInternalNote && ticket.status === "OPEN") {
      await prisma.ticket.update({
        where: { id },
        data: { status: "IN_PROGRESS" },
      });
    }

    // Broadcast real-time message event (strictly hides internal notes from author)
    broadcastTicketEvent(
      ticket.authorId,
      "NEW_MESSAGE",
      {
        ticketId: id,
        message: newMessage,
      },
      { isInternalNote: effectiveInternalNote }
    );

    return res.status(201).json({
      success: true,
      message: effectiveInternalNote ? "Internal note added" : "Response sent successfully",
      data: newMessage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Regenerate AI draft response for an existing ticket (Admin only)
 * If category was overridden by admin, uses the newly selected category
 */
export const regenerateDraft = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        author: true,
        book: true,
      },
    });

    if (!ticket) {
      return throwNotFound("Ticket not found");
    }

    // Uses the current ticket category (including admin overrides)
    const freshDraft = await generateDraftResponse({
      authorName: ticket.author.name,
      bookTitle: ticket.book?.title,
      bookStatus: ticket.book?.status,
      mrp: ticket.book?.mrp,
      copiesSold: ticket.book?.totalCopiesSold,
      royaltyPending: ticket.book?.royaltyPending,
      lastPayoutDate: ticket.book?.lastRoyaltyPayoutDate?.toISOString(),
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category as TicketCategory,
    });

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        aiDraftResponse: freshDraft,
      },
    });

    // Broadcast updated draft to active admin sessions
    broadcastToAdmins("TICKET_UPDATED", {
      ticketId: id,
      aiDraftResponse: updated.aiDraftResponse,
    });

    return res.status(200).json({
      success: true,
      message: "AI draft regenerated successfully",
      data: {
        aiDraftResponse: updated.aiDraftResponse,
      },
    });
  } catch (error) {
    next(error);
  }
};
