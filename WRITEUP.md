# Technical Approach & Architecture Write-Up

When approaching this assignment, my primary goal was to build a system that solves real operational bottlenecks for BookLeaf's team while keeping the author experience simple, transparent, and responsive. Here is a breakdown of what I prioritized, the engineering trade-offs I made, and how I would evolve this system for large-scale production.

---

### 1. What I Prioritised

- **Zero-Failure Ticket Ingestion**: An author should never see a loading spinner or an error message because an external AI API timed out or hit a rate limit. I built a heuristic fallback layer (`heuristicTriage`) so that classification and ticket creation always succeed with 100% reliability, whether the LLM is available or not.
- **Financial Transparency for Authors**: Most support tickets in publishing revolve around royalties. Instead of hiding numbers behind generic status labels, I prioritized an upfront royalty breakdown (Copies Sold, Total Earned, Paid, and Pending) directly mapped to BookLeaf's 80/20 quarterly payout rules.
- **Vector-Powered RAG for Grounded AI Drafts**: Rather than letting an LLM hallucinate or write generic pleasantries, I built a Retrieval-Augmented Generation (RAG) pipeline. I indexed BookLeaf's operating policies into 768-dimensional vector embeddings in PostgreSQL (`pgvector`). When an author files a ticket, the system semantically retrieves only the relevant policy rules (like 80/20 royalty calculations or the 5–7 day free reprint policy) to formulate an accurate, empathetic draft for human admin approval.
- **Privacy Between Authors and Staff**: Operations teams frequently need to discuss sensitive account details (like bank confirmations or printing partner delays). I enforced database-level filtering so internal notes are stripped before author endpoints return any data.

---

### 2. Trade-Offs Made

- **Server-Sent Events (SSE) instead of WebSockets**: Support tickets are primarily server-pushed updates (new ticket alerts, status changes, new messages). WebSockets introduce stateful connection management, heartbeat ping-pong complexity, and sticky-session requirements across load balancers. SSE runs over plain HTTP/2, handles firewalls effortlessly, has native browser auto-reconnect, and was far simpler to implement reliably.
- **PostgreSQL (`pgvector`) instead of a Standalone Vector Database**: Instead of adding external vector SaaS tools like Pinecone or Qdrant, I used Neon PostgreSQL with the `pgvector` extension. Having relational data (authors, books, tickets) and embeddings in the same database keeps queries simple, avoids dual-write sync bugs, and reduces infrastructure overhead.
- **Two-Stage AI Pipeline vs. Single Big Prompt**: Sending the entire 1,500-word policy document and conversation history on every triage call burns unnecessary tokens and increases latency. I split it into two steps:
  1. *Classification & Urgency*: Uses only the subject and description (~150 tokens) to quickly categorize and assign a priority score.
  2. *Draft Generation*: Retrieves only the top-2 semantically matching policy chunks via cosine similarity (~350 tokens) to write the draft. This keeps the total footprint under 600 tokens per ticket and response times fast.

---

### 3. How I'd Evolve This Into a Production System

If rolling this out to handle BookLeaf's full catalog of 22,000+ titles and 1,200+ monthly books, here is what I would focus on next:

1. **Background Job Queues (BullMQ + Redis)**: AI draft generation and embedding tasks currently run in background promises. In high-concurrency environments, these should be offloaded to worker queues with retries, rate-limiting, and dead-letter queues to prevent blocking API instances.
2. **Hybrid Search (BM25 + Semantic Embeddings)**: While semantic vector search works great for policy questions ("When do I get paid?"), it can struggle with exact keyword matching like ISBNs or specific book codes. A hybrid search setup combining PostgreSQL full-text search (BM25) with dense vector embeddings would offer the best of both worlds.
3. **WhatsApp / Email Integration**: In reality, many authors prefer replying via email or WhatsApp rather than logging into a web dashboard. Adding webhook listeners (e.g., SendGrid Inbound Parse or Twilio WhatsApp API) would let authors reply directly from their phones while keeping the conversation synchronized inside the operations console.
4. **Pre-signed S3 Uploads**: The current file attachment UI persists metadata; in production, I would generate pre-signed Amazon S3 or Cloudflare R2 upload URLs so photos of damaged author copies go straight to object storage without touching application server memory.
