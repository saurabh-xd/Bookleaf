# BookLeaf Support & Communication Portal — API Documentation

Base URL: `http://localhost:5000/api`

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
        "id": "uuid",
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
Registers a new author.
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "Author Name",
    "email": "author@example.com",
    "password": "password123",
    "phone": "+91-99999-99999",
    "city": "Bengaluru"
  }
  ```

### `GET /auth/me`
Retrieves currently logged-in user profile.
- **Access**: Authenticated (`Bearer <token>`)

---

## 2. Books Endpoints

### `GET /books`
Lists books. Authors only see their own books; Admins see all books or filter by `authorId`.
- **Access**: Authenticated
- **Query Parameters**:
  - `authorId` (optional, for Admin filtering)
  - `search` (optional, title / isbn / genre keyword search)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "bookCode": "BK001",
        "title": "Whispers of the Ganges",
        "isbn": "978-93-5XXXX-01-1",
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
Retrieves single book details and past tickets.
- **Access**: Authenticated (Authors can only view their own books)

---

## 3. Tickets Endpoints

### `POST /tickets`
Creates a support ticket. Triggers synchronous or fallback AI classification, priority scoring, and pre-draft generation.
- **Access**: Authenticated (Author or Admin)
- **Request Body**:
  ```json
  {
    "bookId": "uuid-or-null",
    "subject": "Haven't received royalty for Q3",
    "description": "My quarterly royalty payout is pending over 45 days...",
    "fileAttachmentName": "invoice.pdf",
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
      "aiDraftResponse": "Dear Priya,\n\nThank you for reaching out...",
      "aiConfidenceScore": 0.95,
      "aiProcessingStatus": "SUCCESS"
    }
  }
  ```

### `GET /tickets`
Lists tickets. Authors see only their tickets. Admins see all tickets across authors.
- **Access**: Authenticated
- **Query Parameters**:
  - `status`: `OPEN` | `IN_PROGRESS` | `RESOLVED` | `CLOSED`
  - `category`: `ROYALTY_PAYMENTS` | `ISBN_METADATA` | `PRINTING_QUALITY` | `DISTRIBUTION_AVAILABILITY` | `PRODUCTION_UPDATES` | `GENERAL_INQUIRY`
  - `priority`: `CRITICAL` | `HIGH` | `MEDIUM` | `LOW`
  - `search`: string keyword search
  - `sortBy`: `urgent` (default: Critical/High first, oldest first) | `newest` | `oldest`
  - `page`: page number (default 1)
  - `limit`: items per page (default 20)

### `GET /tickets/:id`
Retrieves ticket details and full conversation history.
- **Access**: Authenticated
- **Note**: Internal notes (`isInternalNote: true`) are automatically stripped out when viewed by an Author.

### `PATCH /tickets/:id`
Updates ticket status, overrides AI category / priority, or assigns an admin.
- **Access**: Admin only
- **Request Body**:
  ```json
  {
    "status": "IN_PROGRESS",
    "category": "ROYALTY_PAYMENTS",
    "priority": "CRITICAL",
    "assignedAdminId": "admin-uuid"
  }
  ```

### `POST /tickets/:id/messages`
Sends a response or adds an internal note.
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "message": "We have initiated your bank payout...",
    "isInternalNote": false
  }
  ```
- **Rules**:
  - If `isInternalNote: true`, only admins can create it, and it will only be visible and broadcasted to admins.
  - If an admin posts a public message to an `OPEN` ticket, it automatically transitions to `IN_PROGRESS`.
  - Broadcasts live real-time event via SSE to both author and admins.

### `POST /tickets/:id/generate-draft`
Regenerates an AI response draft using fresh book and author data grounded in the BookLeaf Knowledge Base.
- **Access**: Admin only

---

## 4. Real-Time Streaming Endpoint

### `GET /events`
Server-Sent Events (SSE) connection stream.
- **Access**: Authenticated via query parameter `?token=<jwt>` or `Authorization: Bearer <token>`
- **Event Types**:
  - `CONNECTED`: Dispatched on handshake with client ID
  - `TICKET_CREATED`: Dispatched when any new ticket is raised
  - `TICKET_UPDATED`: Dispatched on status, category, or priority changes
  - `NEW_MESSAGE`: Dispatched when an author or admin posts a message
