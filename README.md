# 🔒 Private Chat

A secure, anonymous, self-destructing real-time chat application built with **Next.js**, **Elysia**, **Redis**, **Upstash Realtime**, and **React Query**. Users can instantly create private chat rooms, exchange messages in real time, and automatically destroy conversations after a configurable time period.

---

## ✨ Features

- 🔐 Anonymous usernames generated automatically
- 🚀 One-click private room creation
- ⚡ Real-time messaging using Upstash Realtime
- 📨 Persistent chat history while the room is active
- ⏳ Self-destruct countdown timer for every room
- 💥 Manual room destruction
- 🔗 Shareable room links
- 👥 Maximum two users per room
- 🚫 Automatic validation for:
  - Room not found
  - Room full
  - Expired rooms
- 🎯 Type-safe API with Elysia + Eden Treaty
- 📦 Efficient server-state management with React Query

---

## 🛠 Tech Stack

### Frontend
- Next.js 15 (App Router)
- React
- TypeScript
- Tailwind CSS
- React Query

### Backend
- Elysia
- Eden Treaty (Type-safe API client)
- Upstash Redis
- Upstash Realtime
- Zod

---

## 📂 Project Structure

```text
src/
│
├── app/
│   ├── api/
│   │   ├── [[...slugs]]/
│   │   └── realtime/
│   ├── room/
│   └── page.tsx
│
├── components/
│
├── hooks/
│
├── lib/
│   ├── client.ts
│   ├── realtime.ts
│   ├── realtime-client.ts
│   └── redis.ts
│
└── middleware/
```

---

## ⚙️ How It Works

### Room Creation

1. User creates a room.
2. A unique room ID is generated.
3. Room metadata is stored in Redis with a TTL.
4. A shareable room link is generated.

---

### Joining a Room

- Middleware verifies:
  - Room exists
  - Room isn't full
  - User authentication cookie
- User joins the room if validation succeeds.

---

### Sending Messages

1. Client sends a POST request.
2. Message is stored in Redis.
3. Upstash Realtime broadcasts the message.
4. Connected clients instantly receive updates.

---

### Self Destruct

Each room has a configurable expiration timer.

When the timer expires:

- Room metadata is deleted.
- Chat history is deleted.
- Connected users are redirected.
- A room destroyed notification is displayed.

Users can also destroy the room manually.

---

## 🗄 Redis Storage

```text
meta:<roomId>

{
  connected: [],
  createdAt: ...
}
```

```text
messages:<roomId>

[
  {
    id,
    sender,
    text,
    timestamp
  }
]
```

---

## 🔄 Real-Time Flow

```text
User A
   │
   ▼
POST /messages
   │
   ▼
Redis
   │
   ▼
Upstash Realtime
   │
   ▼
chat.message event
   │
   ▼
All connected clients
```

---

## 🚀 Getting Started

Clone the repository

```bash
git clone https://github.com/your-username/private-chat.git
```

Install dependencies

```bash
npm install
```

Create a `.env.local`

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

NEXT_PUBLIC_UPSTASH_REALTIME_URL=
NEXT_PUBLIC_UPSTASH_REALTIME_TOKEN=
```

Run the development server

```bash
npm run dev
```

---

## 📸 Screenshots

> Add screenshots or a demo GIF here.

Example:

- Home Page
- Chat Room
- Self Destruct Timer
- Room Destroyed Screen

---

## 🎯 Future Improvements

- End-to-end encryption
- File sharing
- Typing indicators
- Read receipts
- Emoji reactions
- Online presence
- Message search
- Mobile responsive improvements

---

## 📄 License

This project is licensed under the MIT License.
