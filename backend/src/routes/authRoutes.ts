import { Router } from "express";
import { z } from "zod";
import { login, register, me } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Please provide a valid email"),
    password: z.string().min(1, "Password is required"),
  }),
});

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please provide a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().optional(),
    city: z.string().optional(),
  }),
});

router.post("/login", validate(loginSchema), login);
router.post("/register", validate(registerSchema), register);
router.get("/me", authenticate, me);

export default router;
