import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  // Handle custom application errors (functional error object with statusCode)
  if (err && typeof err.statusCode === "number") {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || "An error occurred",
      ...(err.details ? { errors: err.details } : {}),
    });
  }

  // Handle Prisma known errors
  if (err.code === "P2002") {
    const target = (err.meta?.target as string[])?.join(", ") || "field";
    return res.status(409).json({
      success: false,
      message: `A record with this ${target} already exists.`,
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "The requested record was not found.",
    });
  }

  // Unhandled internal server error
  console.error("Unhandled Error:", err);
  return res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "An internal server error occurred"
        : err.message || "Internal Server Error",
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });
};
