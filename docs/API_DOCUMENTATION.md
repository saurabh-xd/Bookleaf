# BookLeaf Support & Communication Portal — API Documentation

**Base URL**: `http://localhost:5000/api`  
**Architecture Style**: Pure functional Node.js (TypeScript, zero classes), Neon Serverless PostgreSQL with `pgvector`, Vercel AI SDK (`@ai-sdk/google`), Server-Sent Events (SSE).

---

## Demo Test Credentials (Pre-Seeded)

| Role | Email | Password | Author Code / Note |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@bookleaf.com` | `Admin@123` | Full access across all author queues & tickets |
| **Author** | `priya.sharma@email.com` | `Author@123` | `AUTH001` (2 books, ₹19,908 royalties earned) |
| **Author** | `rohit.kapoor@email.com` | `Author@123` | `AUTH002` (2 books, Poetry) |
| **Author** | `ananya.reddy@email.com` | `Author@123` | `AUTH003` (2 books, Business/Economics) |

---

## 1. Authentication Endpoints

### `POST /auth/login`
Authenticates an Author or Admin using email and password.
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "priya.sharma@email.com",
    "password": "Author@123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOi...",
      "user": {
        "id": "6e17851e-96b4-455a-a2e7-fa2ab08dfef8",
        "authorCode": "AUTH001",
        "name": "Priya Sharma",
        "email": "priya.sharma@email.com",
        "role": "AUTHOR",
        "phone": "+91-98765-43210",
        "city": "Mumbai",
        "bankDetailsLinked": true
      }
    }
  }
  ```

### `POST /auth/register`
Registers a new author account.
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "Aravind Adiga",
    "email": "aravind@example.com",
    "password": "password123",
    "phone": "+91-99999-99999",
    "city": "Bengaluru"
  }
  ```

### `GET /auth/me`
Retrieves currently logged-in user profile from JWT session.
- **Access**: Authenticated (`Authorization: Bearer <token>`)

---

## 2. Books & Royalty Analytics Endpoints

### `GET /books`
Lists books. Authors see only their own catalog; Admins see all books or filter by `authorId`.
- **Access**: Authenticated
- **Query Parameters**:
  - `authorId` (optional, for Admin filtering)
  - `search` (optional, keyword search by title / ISBN / genre)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "bookCode": "BK001",
        "title": "Whispers of the Ganges",
        "isbn": "978-93-50001-01-1",
        "genre": "Literary Fiction",
        "publicationDate": "2023-06-20T00:00:00.000Z",
        "status": "Published & Live",
        "mrp": 399,
        "authorRoyaltyPerCopy": 35,
        "totalCopiesSold": 342,
        "totalRoyaltyEarned": 11970,
        "royaltyPaid": 8400,
        "royaltyPending": 3570,
        "lastRoyaltyPayoutDate": "2025-10-15T00:00:00.000Z",
        "printPartner": "In-House",
        "availableOn": ["Amazon India", "Flipkart", "BookLeaf Store"]
      }
    ],
    "summary": {
      "totalBooks": 2,
      "totalCopiesSold": 531,
      "totalRoyaltyEarned": 19908,
      "totalRoyaltyPaid": 16338,
      "totalRoyaltyPending": 3570
    }
  }
  ```

### `GET /books/:id`
Retrieves single book details, royalty breakdown, and associated ticket history.
- **Access**: Authenticated (Authors restricted to their own books)

---

## 3. Support Tickets Endpoints

### `POST /tickets`
Creates a support ticket. Automatically triggers:
1. **AI Auto-Triage**: Classifies `category` & scores `priority` via Vercel AI SDK (`generateObject` with Zod validation).
2. **True Vector RAG Draft**: Retrieves closest policy vectors from `pgvector` and drafts an empathetic, data-grounded response using Gemini 3.5 Flash (`generateText`).
3. **Real-Time Notification**: Emits `TICKET_CREATED` event to connected admin dashboards via SSE.

- **Access**: Authenticated (`AUTHOR` or `ADMIN`)
- **Request Body**:
  ```json
  {
    "bookId": "uuid-or-null",
    "subject": "Haven't received royalty for Q3",
    "description": "My quarterly royalty payout is pending over 45 days. Minimum threshold is met.",
    "fileAttachmentName": "bank_statement.pdf",
    "fileAttachmentUrl": "https://..."
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Ticket created successfully",
    "data": {
      "id": "uuid",
      "ticketNumber": "BL-1008",
      "subject": "Haven't received royalty for Q3",
      "category": "ROYALTY_PAYMENTS",
      "priority": "HIGH",
      "status": "OPEN",
      "aiDraftResponse": "Dear Priya,\n\nThank you for reaching out regarding your royalty payout for *The Saffron Diaries*...",
      "aiConfidenceScore": 0.95,
      "aiProcessingStatus": "SUCCESS",
      "createdAt": "2026-10-25T16:30:00.000Z"
    }
  }
  ```

### `GET /tickets`
Lists tickets with filtering, searching, and urgency-first queue sorting.
- **Access**: Authenticated (Authors view their tickets; Admins view entire operational queue)
- **Query Parameters**:
  - `status`: `OPEN` | `IN_PROGRESS` | `RESOLVED` | `CLOSED`
  - `category`: `ROYALTY_PAYMENTS` | `ISBN_METADATA` | `PRINTING_QUALITY` | `DISTRIBUTION_AVAILABILITY` | `PRODUCTION_UPDATES` | `GENERAL_INQUIRY`
  - `priority`: `CRITICAL` | `HIGH` | `MEDIUM` | `LOW`
  - `search`: string keyword search across subject, description, ticket number, author name, or book title
  - `sortBy`: `urgent` (default: Critical/High first, oldest first) | `newest` | `oldest`
  - `page`: page number (default `1`)
  - `limit`: items per page (default `20`)

### `GET /tickets/:id`
Retrieves single ticket details and conversation thread.
- **Access**: Authenticated
- **Privacy Rule**: Admin Internal Notes (`isInternalNote: true`) are **automatically stripped** when accessed by an Author.

### `PATCH /tickets/:id`
Updates ticket status, assigns an admin, or manually overrides AI category / priority.
- **Access**: Admin only
- **Request Body**:
  ```json
  {
    "status": "RESOLVED",
    "category": "ROYALTY_PAYMENTS",
    "priority": "CRITICAL",
    "assignedAdminId": "admin-uuid"
  }
  ```
- **Real-Time Hook**: Emits `TICKET_UPDATED` over SSE to both the author and admin sessions.

### `POST /tickets/:id/messages`
Sends a public response or records an internal operational note.
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "message": "We have escalated this to finance; payout will be credited within 48 hours.",
    "isInternalNote": false
  }
  ```
- **Privacy & Real-Time Isolation**:
  - If `isInternalNote: true` (Admin only), the message is broadcast **exclusively** to connected Admins and **never** emitted to the author's stream.
  - If an admin posts a public message to an `OPEN` ticket, it automatically transitions status to `IN_PROGRESS`.

### `POST /tickets/:id/generate-draft`
Regenerates an AI response draft using fresh book and author data grounded in the nearest PostgreSQL `pgvector` knowledge chunks.
- **Access**: Admin only

---

## 4. Real-Time Server-Sent Events (SSE)

### `GET /events`
Opens a persistent real-time event stream.
- **Access**: Authenticated via `?token=<jwt>` query param or `Authorization: Bearer <jwt>`
- **Response Headers**:
  ```http
  Content-Type: text/event-stream
  Cache-Control: no-cache, no-transform
  Connection: keep-alive
  X-Accel-Buffering: no
  ```
- **Keep-Alive**: Automatic comment ping (`: ping <timestamp>\n\n`) every 25 seconds.
- **Events Emitted**:
  - `CONNECTED`: Handshake event with client ID upon connection.
  - `TICKET_CREATED`: Real-time notification when a new ticket is raised.
  - `TICKET_UPDATED`: Real-time notification when status, priority, or assignment changes.
  - `NEW_MESSAGE`: Real-time chat message (strictly omitting internal notes for authors).

### `GET /events/status`
Diagnostic endpoint to inspect active SSE connection counts.
- **Access**: Public
- **Response**: `{"success": true, "data": {"activeConnections": 2}}`

---

## 5. Vector RAG Architecture

- **Vector Database**: PostgreSQL with `pgvector` extension hosted on Neon Serverless Cloud.
- **Embedding Model**: Gemini `gemini-embedding-001` configured to 768 dimensions via Vercel AI SDK `providerOptions.google.outputDimensionality = 768`.
- **Indexing Task**: `taskType: "RETRIEVAL_DOCUMENT"` using batch `embedMany`.
- **Query Task**: `taskType: "RETRIEVAL_QUERY"` using `embed`.
- **Similarity Metric**: Cosine Distance operator (`<=>`):
  $$\text{Similarity} = 1 - (\text{embedding} \Leftrightarrow \text{queryVector})$$
- **Graceful Fallback**: Local deterministic semantic clustering vector generator ensures tickets are processed even during API network drops.

---

## 6. Service Level Agreement (SLA) Targets

| Priority | Target Response Window | Target Resolution | Escalation Policy |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | **< 4 Hours** | **24 Hours** | Immediate operational escalation (Unpaid royalties > 3 months) |
| **HIGH** | **< 8 Hours** | **48 Hours** | Priority catalog audit (ISBN mismatch, physical print defects) |
| **MEDIUM** | **< 16 Hours** | **72 Hours** | Stock re-sync (Currently Unavailable on Amazon/Flipkart) |
| **LOW** | **< 24 Hours** | **120 Hours** | General author account questions, package inquiries |
