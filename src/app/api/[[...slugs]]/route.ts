import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
import { redis } from "@/lib/redis";


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
})
const app = new Elysia({ prefix: "/api" }).use(rooms);

export const GET = app.fetch;
export const POST = app.fetch;

export type App = typeof app;//sbka typescript banadeti h sare routs ka
