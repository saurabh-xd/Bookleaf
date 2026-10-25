# Implementation Plan: BookLeaf Author Support & Communication Portal

## 1. Project Overview & Architecture
An end-to-end, full-stack author support system for BookLeaf Publishing with role-based dashboards (Author & Admin), AI-powered ticket triage (auto-classification, dynamic priority scoring, contextual response drafting using the BookLeaf Knowledge Base), and real-time messaging.

### Tech Stack
- **Frontend**: Next.js (App Router), React, Lucide Icons, Modern Responsive Design System (Vanilla CSS / TailwindCSS + CSS Variables for sleek dark/light theme, accessible components)
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (with Prisma ORM or Drizzle ORM for type-safe relational modeling, migrations, and seeding)
- **Real-Time Communication**: Server-Sent Events (SSE) or WebSockets (Socket.io) for live ticket and message updates without page reloads
- **AI Engine**: Modular LLM adapter (OpenAI `gpt-4o-mini` / Anthropic `claude-3-haiku` / Google Gemini) with prompt templates grounded in the BookLeaf Knowledge Base, fallback heuristics for graceful degradation, and token-efficient context window management.

---

## 2. System Architecture & Directory Structure

```
bookleaf/
├── backend/
│   ├── src/
│   │   ├── config/             # Environment, DB, LLM clients
│   │   ├── controllers/        # Auth, Books, Tickets, Messages, Admin
│   │   ├── middleware/         # Auth (JWT), RBAC (Author/Admin), Error handler, Validation
│   │   ├── routes/             # REST API routes (/api/auth, /api/books, /api/tickets, etc.)
│   │   ├── services/
│   │   │   ├── aiService.ts    # Classification, Priority Scoring, Draft generation, fallback
│   │   │   ├── knowledgeBase.ts# Structured BookLeaf KB for targeted RAG/prompt injection
│   │   │   └── sseService.ts   # Real-time event streaming / WebSockets
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # PostgreSQL Schema
│   │   │   └── seed.ts         # Seeder for 10 authors & 18 books (bookleaf_sample_data.json)
│   │   └── server.ts           # Express entrypoint
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/login/   # Shared login page (redirects based on role)
│   │   │   ├── author/         # Author Portal
│   │   │   │   ├── dashboard/  # My Books, metrics summary
│   │   │   │   ├── tickets/    # Ticket list & real-time ticket detail view
│   │   │   │   └── new-ticket/ # Submit query with book picker & attachment UI
│   │   │   ├── admin/          # Admin Portal
│   │   │   │   ├── queue/      # Filterable ticket queue (status, priority, category)
│   │   │   │   └── tickets/[id]# Ticket management, AI draft review/edit, internal notes
│   │   ├── components/         # Reusable UI (Navbar, Badges, Modals, Real-time indicators)
│   │   ├── hooks/              # useAuth, useTickets, useRealTimeUpdates
│   │   └── lib/                # API client, tokens, utils
│   ├── .env.example
│   └── package.json
│
├── docs/                       # API documentation (OpenAPI / Swagger / Postman) & Architecture write-up
└── README.md                   # Setup guide, design decisions, AI prompt strategy
```

---

## 3. Database Schema Design (PostgreSQL)

### Models
1. **User**:
   - `id` (UUID, PK)
   - `email` (Unique)
   - `passwordHash` (Bcrypt)
   - `name`
   - `role` (`AUTHOR` | `ADMIN`)
   - `phone`, `bankDetailsLinked` (Boolean), `createdAt`, `updatedAt`

2. **Book**:
   - `id` (UUID, PK)
   - `authorId` (FK -> User.id)
   - `title`, `isbn` (Nullable if in production), `genre`, `publicationDate`
   - `status` (`PUBLISHED` | `TYPESETTING` | `PROOFREADING` | `COVER_DESIGN` | `PRINTING`)
   - `mrp` (Decimal), `copiesSold` (Int), `royaltyEarned` (Decimal), `royaltyPaid` (Decimal), `royaltyPending` (Decimal)

3. **Ticket**:
   - `id` (UUID, PK)
   - `ticketNumber` (e.g. `BL-1001`)
   - `authorId` (FK -> User.id)
   - `bookId` (FK -> Book.id, Nullable for General/Account Level)
   - `subject`, `description`
   - `category` (`ROYALTY_PAYMENTS` | `ISBN_METADATA` | `PRINTING_QUALITY` | `DISTRIBUTION_AVAILABILITY` | `PRODUCTION_UPDATES` | `GENERAL_INQUIRY`)
   - `aiClassifiedCategory`, `isCategoryOverridden` (Boolean)
   - `priority` (`CRITICAL` | `HIGH` | `MEDIUM` | `LOW`)
   - `aiPriority`, `isPriorityOverridden` (Boolean)
   - `status` (`OPEN` | `IN_PROGRESS` | `RESOLVED` | `CLOSED`)
   - `assignedAdminId` (FK -> User.id, Nullable)
   - `aiDraftResponse` (Text, Nullable)
   - `aiConfidenceScore` (Float, Nullable)
   - `aiProcessingStatus` (`SUCCESS` | `FALLBACK` | `FAILED`)
   - `createdAt`, `updatedAt`

4. **TicketMessage**:
   - `id` (UUID, PK)
   - `ticketId` (FK -> Ticket.id)
   - `senderId` (FK -> User.id)
   - `message` (Text)
   - `isInternalNote` (Boolean, default: false — hidden from authors)
   - `createdAt`

5. **Attachment** (Optional / Bonus):
   - `id`, `ticketId`, `fileName`, `fileSize`, `fileUrl`

---

## 4. AI Engine & Prompt Strategy

### Core Principles
1. **Context-Aware RAG / Grounding**:
   - System prompts inject exact BookLeaf rules:
     - 80/20 royalty split formula: `Net profit = MRP - printing - platform commission - shipping`.
     - Quarterly payout cycle + 45-day window, ₹1,000 threshold.
     - 5-7 days printing turnaround, free reprints for verified defects.
     - 24-48 hours distribution sync for "Currently Unavailable".
     - Empathy first, owning BookLeaf mistakes without corporate deflection, specific timelines.
2. **Selective Context & Cost Optimization**:
   - When auto-classifying and scoring priority: send only the `subject` + `description` (requires ~150-250 tokens).
   - When generating draft response: inject only the relevant Knowledge Base section based on the detected category rather than the entire 1,500-word KB document, keeping token usage minimal.
3. **Graceful Degradation**:
   - If AI service fails or hits rate limits, fallback to keyword heuristic classifier + `MEDIUM` priority default. Ticket creation **never fails**. Admin can manually classify and compose reply.

---

## 5. Implementation Phases

### Phase 1: Environment & Project Scaffolding
- Initialize backend with Express, TypeScript, Prisma, CORS, Morgan, Dotenv.
- Initialize frontend with Next.js App Router and modern clean UI structure.
- Configure PostgreSQL connection and setup sample dataset seeder (`bookleaf_sample_data.json`).

### Phase 2: Database Models & Sample Data Seeder
- Define Prisma schema matching authors, books, tickets, messages.
- Seed database with all 10 authors and 18 books (covering edge cases: zero royalties, in-production books, pending payouts).
- Create test admin account (`admin@bookleaf.com` / `admin123`).

### Phase 3: REST API & Role-Based Access Control
- `/api/auth`: Login, register, token refresh, `/api/auth/me`.
- `/api/books`: Author's books (filtered by logged-in user), Admin book overview.
- `/api/tickets`:
  - `POST /api/tickets`: Create ticket (triggers async AI classification & priority scoring).
  - `GET /api/tickets`: Author gets their tickets; Admin gets all tickets with filters (`status`, `category`, `priority`, `search`, `sortBy`).
  - `GET /api/tickets/:id`: Ticket details with message history & internal notes.
  - `PATCH /api/tickets/:id`: Admin updates status, overrides priority/category, assigns admin.
  - `POST /api/tickets/:id/messages`: Add author message, admin public reply, or admin internal note.
  - `POST /api/tickets/:id/generate-draft`: Regenerate or fetch AI draft response.
- `/api/events`: Real-time SSE endpoint for ticket and message events.

### Phase 4: AI Integration Service
- Prompt engineering implementation with BookLeaf tone and knowledge base rules.
- Classification & Priority scorer with structured JSON schema output.
- Response draft generator with author book context injection.
- Failover handling (try-catch, exponential backoff, fallback heuristics).

### Phase 5: Author Portal Frontend
- Modern clean UI layout (Sidebar, Header, Profile summary).
- **Dashboard / My Books**: Responsive cards or data table showing books, status, MRP, sales, and detailed royalty breakdown.
- **Submit Query**: Interactive modal/page with book selector, category preview, description, and file attachment dropzone.
- **My Tickets**: List with live status badges (`Open`, `In Progress`, `Resolved`, `Closed`), and ticket conversation view updating via real-time SSE.

### Phase 6: Admin Portal Frontend
- **Ticket Queue**: Urgency-first queue highlighting Critical/High priority and oldest unresolved tickets.
- Multi-dimensional filters (Category, Status, Priority, Date).
- **Ticket Management & Triage Workspace**:
  - One-click override for AI Category & Priority with visual indicators.
  - AI Draft Response card: Pre-filled draft, "Insert to Editor", live editing, and sending.
  - Internal Notes tab (distinct yellow/amber banner, clearly differentiated from author-visible chat).
  - Status transitions (`In Progress`, `Resolved`, `Closed`) and assignment selector.

### Phase 7: Real-Time Synchronization
- SSE event stream broadcaster in backend.
- Author ticket view instantly shows admin replies without page reload.
- Admin queue updates ticket status and shows badge alerts on incoming queries.

### Phase 8: Documentation, Testing & Polish
- Swagger / OpenAPI documentation or comprehensive Postman collection.
- Detailed README explaining local setup, architecture decisions, AI prompt strategy, error handling, and trade-offs.
- 1-page write-up covering product thinking and production evolution path.
