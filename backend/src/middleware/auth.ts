import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { throwUnauthorized, throwForbidden, unauthorizedError } from "../utils/errors.js";
import prisma from "../config/prisma.js";

export interface AuthUser {
  id: string;
  email: string;
  role: "AUTHOR" | "ADMIN";
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return throwUnauthorized("Authentication token is missing");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.jwt.secret) as AuthUser;

    // Verify user still exists in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, name: true },
    });

    if (!user) {
      return throwUnauthorized("User associated with token no longer exists");
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      next(unauthorizedError("Invalid or expired authentication token"));
    } else {
      next(error);
    }
  }
};

export const requireRole = (allowedRoles: ("AUTHOR" | "ADMIN")[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return throwUnauthorized("Authentication required");
    }

    if (!allowedRoles.includes(req.user.role)) {
      return throwForbidden(
        `Access denied. Requires one of the following roles: ${allowedRoles.join(", ")}`
      );
    }

    next();
  };
};
