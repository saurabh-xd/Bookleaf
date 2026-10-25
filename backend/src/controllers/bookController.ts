import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma.js";
import { throwNotFound } from "../utils/errors.js";

/**
 * Get books list with aggregated royalty summary
 * Authors see only their books; Admins see all books or filter by ?authorId=
 */
export const getBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { authorId, search } = req.query;

    const whereClause: any = {};

    // Role scoping
    if (user.role === "AUTHOR") {
      whereClause.authorId = user.id;
    } else if (authorId) {
      whereClause.authorId = String(authorId);
    }

    // Optional keyword search
    if (search) {
      whereClause.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
        { isbn: { contains: String(search), mode: "insensitive" } },
        { genre: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const books = await prisma.book.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            authorCode: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Aggregated metrics summary
    const summary = books.reduce(
      (acc, b) => {
        acc.totalBooks += 1;
        acc.totalCopiesSold += b.totalCopiesSold || 0;
        acc.totalRoyaltyEarned += b.totalRoyaltyEarned || 0;
        acc.totalRoyaltyPaid += b.royaltyPaid || 0;
        acc.totalRoyaltyPending += b.royaltyPending || 0;
        return acc;
      },
      {
        totalBooks: 0,
        totalCopiesSold: 0,
        totalRoyaltyEarned: 0,
        totalRoyaltyPaid: 0,
        totalRoyaltyPending: 0,
      }
    );

    return res.status(200).json({
      success: true,
      data: books,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single book details
 */
export const getBookById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const book = await prisma.book.findUnique({
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
          },
        },
      },
    });

    if (!book) {
      return throwNotFound("Book not found");
    }

    // Authors can only access their own books
    if (user.role === "AUTHOR" && book.authorId !== user.id) {
      return throwNotFound("Book not found");
    }

    return res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    next(error);
  }
};
