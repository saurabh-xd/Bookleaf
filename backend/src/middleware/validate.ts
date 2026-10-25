import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { badRequestError } from "../utils/errors.js";

export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.slice(1).join("."),
          message: err.message,
        }));
        return next(badRequestError("Validation failed", formattedErrors));
      }
      next(error);
    }
  };
