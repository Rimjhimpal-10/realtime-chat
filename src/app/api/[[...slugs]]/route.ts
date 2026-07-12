import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
import { redis } from "@/lib/redis";
import { authMiddleware } from "./auth";
import {z} from "zod";
import { error, timeStamp } from "console";

import { realtime,Message } from "@/lib/realtime";


const ROOM_TTL_SECONDS=10*60;

const rooms=new Elysia({prefix:"/room"}).post("/create",async ()=>{
  console.log("CREATE ROOM")
  const roomId=nanoid();

  await redis.hset(`meta:${roomId}`,{
    connected:[],
    createdAt:Date.now(),
  })

  await redis.expire(`meta:${roomId}`,ROOM_TTL_SECONDS)

  return {roomId,};
}).use(authMiddleware).get("/ttl", async ({ auth }) => {

    // Ask Redis how many seconds are left before
    // this room automatically expires.
    const ttl = await redis.ttl(`meta:${auth.roomId}`);

    // Redis returns:
    // > 0  -> seconds remaining
    // -1   -> key exists but has no expiry
    // -2   -> key doesn't exist
    //
    // We only want to send a positive number.
    return {
      ttl: ttl > 0 ? ttl : 0,
    };
  },

  {
    // Validate that roomId is provided.
    query: z.object({
      roomId: z.string(),
    }),
  }).delete(
  "/",
  async ({ auth }) => {

    await realtime.channel(auth.roomId).emit("chat.destroy",{isDestroyed:true})
    
    await Promise.all([
      redis.del(auth.roomId),
      redis.del(`meta:${auth.roomId}`),
      redis.del(`messages:${auth.roomId}`),
    ])

    
  },{
    query:z.object({roomId:z.string()})
  }
)

const messages= new Elysia({prefix :"/messages"}).use(authMiddleware).post("/",
  async ({body,auth})=>{
    const {sender,text}=body

    const {roomId}=auth;
    const roomExists=await redis.exists(`meta:${roomId}`)
    if(!roomExists){
      throw new Error("room does not exists")
    }
    //construct message
    const message: Message={
      id:nanoid(),
      sender,
      text,
      timestamp:Date.now(),
      roomId
    }

    // Add message to history
    // Store every chat message in Redis so new users or page refreshes
    // can load previous messages (chat history).
    await redis.rpush(
      `messages:${roomId}`,
      {...message,token: auth.token,}
    );

    // Instantly broadcast the message to everyone connected
    // to this room. No page refresh required.

    await realtime
      .channel(roomId)
      .emit("chat.message", message);

    // Housekeeping
    const remaining = await redis.ttl(`meta:${roomId}`);// Get how many seconds are left before the room expires.
    await redis.expire(`messages:${roomId}`,remaining);
    // Keep messages alive only as long as the room exists.
    // When the room expires, its messages/history should also disappear.
    await redis.expire(`history:${roomId}`,remaining);
    await redis.expire(roomId,remaining)

  },
  {
    query: z.object({roomId : z.string()}),
    body:z.object({
      sender : z.string().max(100),
      text : z.string().max(1000),
    }),
    
  }) //so we automatically used this middle ware check before implementing the logic

  .get(
  "/",
  async ({ auth }) => {

    // Load complete chat history for this room.
    // LRANGE 0 -1 = fetch every message stored in Redis.
    const messages = await redis.lrange<Message>(
      `messages:${auth.roomId}`,
      0,
      -1
    );

    return {

      // Send messages to frontend.
      // Only expose the current user's token.
      // Hide everyone else's token for security.
      messages: messages.map((m) => ({
        ...m,
        token:
          m.token === auth.token
            ? auth.token
            : undefined,
      })),
    };
  },

  // Validate that roomId is present in the query string.
  {
    query: z.object({
      roomId: z.string(),
    }),
  }
);


  //prev : const app = new Elysia({ prefix: "/api" }).use(rooms); after sending implementation
const app = new Elysia({ prefix: "/api" }).use(rooms).use(messages);

export const GET = app.fetch;
export const POST = app.fetch;
export const DELETE=app.fetch;

export type App = typeof app;//sbka typescript banadeti h sare routs ka
