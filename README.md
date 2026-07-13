# Private Chat

A self-destructing, two-person chat room built to explore type-safe API boundaries and TTL-driven data lifecycles. No accounts, no persistence beyond a room's lifetime — create a room, share the link, talk, and the whole thing deletes itself.

Live stack: **Next.js 16** (App Router) on the frontend, **Elysia** running as a Next.js route handler on the backend, **Upstash Redis** for storage and expiry, **Upstash Realtime** for pub/sub, and **Eden Treaty** gluing the two together so the client calls the server through inferred types instead of hand-written fetches.

## Why this exists

Most CRUD-app tutorials don't touch two things that come up constantly in real backend work: expiring state cleanly, and keeping a client in sync with a server's types without codegen. This project is a small, complete surface to practice both.

## How it's put together

**Auth is a scoped Elysia plugin, not a global middleware.** [`auth.ts`](src/app/api/[[...slugs]]/auth.ts) derives an `auth` context (`roomId`, `token`) by checking the `x-auth-token` cookie against the `connected` list stored in Redis for that room, and throws a typed `AuthError` that a shared `.onError` handler maps to a 401. It's mounted with `{ as: "scoped" }` so only the route trees that `.use(authMiddleware)` — `rooms` and `messages` in [`route.ts`](src/app/api/[[...slugs]]/route.ts) — actually require it.

**The API is exported as a type, not documented as one.** `route.ts` exports `type App = typeof app`, and [`client.ts`](src/lib/client.ts) consumes it with `treaty<App>()`. Calling `client.room.create.post()` from a component autocompletes and type-checks against the live Elysia schema — if a route's Zod input changes, the client breaks at compile time instead of at runtime.

**Expiry cascades instead of being recomputed.** A room's Redis TTL (`meta:<roomId>`, 10 minutes, set in `route.ts`) is the single source of truth for when a room dies. Every time a message is sent, the handler reads the room's remaining TTL and re-applies it to `messages:<roomId>`, so message history always expires in lockstep with the room rather than needing its own timer.

**Realtime events are schema-validated, not `any`.** [`realtime.ts`](src/lib/realtime.ts) defines `chat.message` and `chat.destroy` as Zod schemas and threads them through `InferRealtimeEvents`, so both the emit side (server) and the subscribe side (client, via [`realtime-client.ts`](src/lib/realtime-client.ts)) are typed against the same contract.

```
src/
├── app/
│   ├── api/[[...slugs]]/   Elysia app: room + message routes, auth plugin
│   ├── api/realtime/       Upstash Realtime route handler
│   ├── room/[roomId]/      Chat room UI
│   └── page.tsx            Landing page / room creation
├── components/
├── hooks/
├── lib/
│   ├── client.ts            Eden Treaty client
│   ├── realtime.ts           Realtime schema + server instance
│   ├── realtime-client.ts    Client-side realtime subscription
│   └── redis.ts              Upstash Redis client
└── proxy.ts                  Room-capacity / cookie-issuing logic (see Known limitations)
```

## Redis layout

```
meta:<roomId>      { connected: string[], createdAt: number }   TTL: 10 min
messages:<roomId>  [ { id, sender, text, timestamp, roomId } ]  TTL: mirrors meta
```

## Known limitations

- **Room-capacity enforcement isn't wired up.** The logic that checks room size, redirects on `room-full`/`room-not-found`, and issues the `x-auth-token` cookie lives in [`src/proxy.ts`](src/proxy.ts) — but Next.js only auto-runs middleware from a file named `middleware.ts`. Since this file is named `proxy.ts`, it never executes. Practical effect: no cookie is currently issued on room join, so the auth-gated routes will 401. This is the next fix, not a design choice.
- The Eden Treaty client in `client.ts` currently points at `localhost:3000`, so it needs to be made environment-aware before this runs anywhere but a local dev server.
- Room TTL (10 minutes) is a constant, not yet configurable per room.

## Getting started

```bash
git clone https://github.com/<your-username>/realtime-chat.git
cd realtime-chat
npm install
```

Create `.env.local`:

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

NEXT_PUBLIC_UPSTASH_REALTIME_URL=
NEXT_PUBLIC_UPSTASH_REALTIME_TOKEN=
```

```bash
npm run dev
```

## Roadmap

- Fix middleware wiring so room capacity is actually enforced (see above)
- Environment-aware Eden Treaty client for non-local deploys
- End-to-end message encryption
