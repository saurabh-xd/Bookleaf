import express from "express";
import cors from "cors";
import morgan from "morgan";
import config from "./config/index.js";
import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import { indexKnowledgeBase } from "./services/knowledgeIndexer.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundError } from "./utils/errors.js";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin.startsWith("http://localhost")) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "BookLeaf Author Support Portal API",
    timestamp: new Date().toISOString(),
  });
});

// Authentication Routes
app.use("/api/auth", authRoutes);

// Books & Royalty Routes
app.use("/api/books", bookRoutes);

// Support Tickets Routes
app.use("/api/tickets", ticketRoutes);

// Catch 404
app.use((req, res, next) => {
  next(notFoundError(`Cannot ${req.method} ${req.originalUrl}`));
});

// Centralized Error Handler
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(` BookLeaf Support API running on port ${config.port}`);
  console.log(` Health Check: http://localhost:${config.port}/api/health`);
  indexKnowledgeBase().catch((err) => console.error("Vector index error:", err));
});

export default app;
