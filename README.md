# BookLeaf Author Support & Communication Portal

A full-stack author support and operations portal featuring AI-assisted ticket triage, grounded RAG response generation, and real-time updates.

---

## 1. How to Set Up and Run the Project Locally

### Prerequisites
- Node.js `v18.x` or higher
- Git
- PostgreSQL database (or free Neon serverless Postgres)

### Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```
2. Configure environment variables in `backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="your-postgresql-connection-string"
   JWT_SECRET="your-jwt-secret-key"
   GEMINI_API_KEY="your-gemini-api-key"
   FRONTEND_URL="http://localhost:3000"
   ```
3. Initialize the database schema and seed the initial dataset:
   ```bash
   # Push schema to PostgreSQL
   npx prisma db push

   # Seed authors, books, and policy vectors from bookleaf_sample_data.json
   npx tsx src/seeds/seed.ts

   # Start backend development server
   npm run dev
   ```
   *Backend runs on `http://localhost:5000/api`.*

### Frontend Setup
1. Open a second terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```
2. Configure environment variables in `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *Frontend runs on `http://localhost:3000`.*

### Test Login Credentials
- **Operations Admin**: `admin@bookleaf.com` / `Admin@123`
- **Author (Priya Sharma)**: `priya.sharma@email.com` / `Author@123`
- **Author (Rohit Kapoor)**: `rohit.kapoor@email.com` / `Author@123`
- **Author (Ananya Reddy)**: `ananya.reddy@email.com` / `Author@123`

---

## 2. Architecture Decisions & Why We Made Them

| Component | Choice | Rationale |
| :--- | :--- | :--- |
| **Backend Architecture** | **Express + TypeScript (Functional Style)** | Functional request handlers and service composition rather than heavy class hierarchies. Keeps code predictable, easy to test, and reduces runtime overhead. |
| **Database & Vector Store** | **PostgreSQL + `pgvector` (Neon)** | Storing relational domain entities (authors, books, tickets, messages) and 768-dimensional knowledge embeddings in the same database avoids dual-database sync issues, keeps data ACID-compliant, and eliminates third-party vector DB costs. |
| **Real-Time Communication** | **Server-Sent Events (SSE)** | Author support tickets are primarily server-to-client push events (new tickets, staff replies, status updates). SSE operates over standard HTTP/2, traverses corporate proxies and firewalls without configuration, and provides built-in browser reconnection without the complexity of stateful WebSocket clusters. |
| **Frontend Framework** | **Next.js 16 (App Router) + React 19** | Fast server rendering, clean route-based code splitting, and native client/server component separation. Global styling uses Tailwind CSS with clean design tokens. |
| **Data Privacy & Isolation** | **Database-Level RBAC** | Authors are strictly query-scoped to their own records (`where: { authorId: user.id }`). Private internal staff notes (`isInternalNote: true`) are filtered out at the controller level before responses reach the author. |

---

## 3. How the AI Integration Works

### A. Prompt Strategy
- **Tone & Empathy**: Prompts enforce BookLeaf's author-first principle: *"Authors are publishing partners, not tickets to be managed."* The system acknowledges the author's frustration first, provides concrete details (royalty payout dates, net profit formulas), and commits to specific turnaround windows (48-hour escalations, 5–7 business days reprint).
- **Clean Conversational Output**: Strips raw markdown asterisks (`**bold**` and `*bullet*`) so generated drafts read naturally like human-written support messages.
- **Categorization & Urgency**: Classifies queries into 6 BookLeaf categories (`Royalty & Payments`, `ISBN & Metadata Issues`, `Printing & Quality`, `Distribution & Availability`, `Book Status & Production Updates`, `General Inquiry`) and scores priority (`Critical`, `High`, `Medium`, `Low`). Prolonged unpaid royalties (> 3 months) automatically escalate to `Critical`, while author bio edits receive `Low`.

### B. Error Handling & Graceful Degradation
- **Zero-Downtime Fallback**: If the external Gemini API is rate-limited, offline, or an API key is missing, a deterministic heuristic engine (`heuristicTriage` & `heuristicDraftResponse`) immediately handles classification and drafting.
- **Unbroken Workflow**: Ticket creation **never fails or hangs** due to external AI downtime. Admins retain full ability to edit drafts, override categories, and override priority scores manually.

### C. Cost Management & Token Optimization
- **2-Stage Split Pipeline**:
  1. *Classification Stage*: Sends only the ticket `subject` and `description` to `generateObject` (~150 tokens) to determine category and priority.
  2. *Draft Formulation Stage*: Uses `pgvector` Cosine Similarity (`<=>`) to retrieve strictly the **top-2 relevant policy chunks** (~350 tokens) from the knowledge base, rather than dumping the full 1,500-word policy document.
- **Efficiency**: Total inference footprint is **< 600 tokens per ticket**, reducing token consumption by over 85% compared to raw multi-shot prompting.

---

## 4. API Documentation

Comprehensive REST API endpoint specifications with sample request and response payloads are documented in:  
👉 [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md)

### Key Endpoint Groups:
- **Auth**: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`
- **Books**: `GET /api/books` (scoped by role: author's own books or all books for admin)
- **Tickets**: `GET /api/tickets`, `POST /api/tickets`, `GET /api/tickets/:id`, `PATCH /api/tickets/:id`
- **Messages & Notes**: `POST /api/tickets/:id/messages` (supports public author replies and private internal notes)
- **AI Operations**: `POST /api/tickets/:id/generate-draft` (on-demand RAG draft regeneration)
- **Real-Time Stream**: `GET /api/events/subscribe?token=...` (Server-Sent Events)

---

## 5. Known Limitations & Things to Improve Given More Time

1. **Object Storage for Attachments**:
   - The current implementation accepts file attachment uploads and persists simulated metadata (filename, URL, size). In production, files should stream directly to Amazon S3 or Cloudflare R2 with pre-signed URLs.
2. **Asynchronous Background Worker Queue**:
   - For high-volume concurrent spikes, embedding generation and outbound email/SMS alerts should run via an asynchronous worker queue (e.g., BullMQ + Redis) rather than unblocking Node.js promises.
3. **Multi-Channel Ingestion (WhatsApp & Email-to-Ticket)**:
   - Integrating Twilio WhatsApp Business API or SendGrid Inbound Parse would allow authors to respond directly via email or WhatsApp, syncing messages seamlessly into the portal thread.
4. **Departmental Role Scoping**:
   - Expanding from two basic roles (`AUTHOR` and `ADMIN`) to departmental tiers (`FINANCE_ADMIN`, `EDITORIAL_ADMIN`, `PRODUCTION_ADMIN`) with role-scoped queue visibility.
