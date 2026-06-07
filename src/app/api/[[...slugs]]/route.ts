import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";

const rooms=new Elysia({prefix:"/room"}).post("/create",async ()=>{
  console.log("CREATE ROOM")
  const roomId=nanoid();

  await redis.hset()
})
const app = new Elysia({ prefix: "/api" }).use(rooms);

export const GET = app.fetch;
export const POST = app.fetch;

export type App = typeof app;//sbka typescript banadeti h sare routs ka
