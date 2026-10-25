import { Router } from "express";
import { getBooks, getBookById } from "../controllers/bookController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// Protect all book endpoints with authentication
router.use(authenticate);

router.get("/", getBooks);
router.get("/:id", getBookById);

export default router;
