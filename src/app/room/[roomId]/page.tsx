"use client";

import { useParams, useRouter } from "next/navigation";
import { useState,useRef, useEffect} from "react";
import {format} from "date-fns";
import { useMutation ,useQuery,useQueryClient} from "@tanstack/react-query";
import { useUsername } from "@/hooks/use-username";
import { client } from "@/lib/client";
import { useRealtime } from "@/lib/realtime-client";


function formatTimeRemaining(seconds:number){
  const mins=Math.floor(seconds/60);
  const secs=seconds%60

  return `${mins}:${secs.toString().padStart(2,"0")}`
}



const Page = () => {
  const params = useParams();
  const roomId = params.roomId as string;
  const {username}=useUsername();

  const router=useRouter() //for destruction of room


  const[input,setInput]=useState("");
  const inputRef=useRef<HTMLInputElement>(null);

  const[copyStatus,setCopyStatus]=useState("COPY");
  const[timeRemaining,setTimeRemaining]=useState<number | null>(null); //so that typescript knows that it will be set to number later or null

  const {data:ttlData} = useQuery({
    queryKey: ["ttl", roomId],

    queryFn: async () => {
     const res=await client.room.ttl.get({
      query:{roomId}})
      return res.data
    },
  });


  useEffect(()=>{
        if(ttlData?.ttl!==undefined)
          setTimeRemaining(ttlData.ttl)
    },[ttlData])

    useEffect(() => {
    if (timeRemaining === null || timeRemaining < 0) return;

    if (timeRemaining === 0) {
      router.push("/?destroyed=true");
    }
  }, [timeRemaining, router]);


useEffect(() => {
  if (timeRemaining === null) return;

  const interval = setInterval(() => {
    setTimeRemaining((prev) => {
      if (prev === null || prev <= 1) {
        clearInterval(interval);
        return 0;
      }

      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(interval);

}, [timeRemaining]);

  // Fetch previous chat messages for the current room.
// React Query caches the result using ["messages", roomId],
// so each room has its own cached chat history.





const { data: messages,refetch } = useQuery({

  // Unique cache key.
  // Different roomId = different cache.
  queryKey: ["messages", roomId],

  // Runs automatically when data is needed.
  queryFn: async () => {

    // Request chat history from backend.
    const res = await client.messages.get({
      query: {
        roomId,
      },
    });

    // Store response in React Query cache.
    return res.data;
  },
});

  // useMutation is used because sending a message changes server data.
// We rename mutate() to sendMessage() for better readability.


///major problem thi ye

const queryClient = useQueryClient();

const { mutate: sendMessage, isPending } = useMutation({
  mutationFn: async ({ text }: { text: string }) => {
    await client.messages.post(
      {
        sender: username,
        text,
      },
      {
        query: {
          roomId,
        },
      }
    );
  },

  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ["messages", roomId],
    });

    setInput("");
    inputRef.current?.focus();
  },
});


// Subscribe to realtime updates for this room.
// Whenever the server emits "chat.message" or "chat.destroy",
// this callback runs automatically without refreshing the page.

useRealtime({

  // Join this room's realtime channel.
  channels: [roomId],

  // Listen only for these events.
  events: [
    "chat.message",
    "chat.destroy",
  ],

  // Runs whenever an event is received.
  onData: ({ event }) => {

    if (event === "chat.message") {
      refetch()

      // Update React Query cache
      // so the UI immediately shows the new message.
    }
    if(event==="chat.destroy"){
      router.push("/?destroyed=true")
    }
  },
});

const{mutate:destroyRoom}=useMutation({
  mutationFn:async()=>{
    await client.room.delete(null,{query:{roomId}})
  }
})


  const copylink=()=>{
    const url=window.location.href
    navigator.clipboard.writeText(url)
    setCopyStatus("COPIED")
    setTimeout(() => {
        setCopyStatus("COPY")
    }, 2000);
  }

  return (
    <main className="flex flex-col h-screen max-h-screen overflow-hidden">
      <header className="border-b border-zinc-800 p-4 flex items-center justify-between bg-zinc-900/30">
        <div className="flex items-center gap-4">
            <div className="flex flex-col">
                <span className="text-xs text-zinc-500 uppercase">
                    room Id
                </span>

                <div className="flex items-center gap-2">
                    <span className="font-bold text-green-500">
                        {roomId}
                    </span>
                    <button onClick={copylink} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-200 transition-colors">
                        {copyStatus}
                    </button>
                </div>
            </div>

            <div className="h-8 w-px bg-zinc-800"/>
              <div className="flex flex-col">
                <span className="text-xs text-zinc-500 uppercase">
                    SELF-DESTRUCT
                </span>

                <span className={`text-sm font-bold flexitems-center gap-2 ${timeRemaining!==null && timeRemaining<60 ? "text-red-500":"text-amber-500"}`}>
                    {timeRemaining!==null ? formatTimeRemaining(timeRemaining):"--:--"}
                </span>
              </div>
            
        </div>
        <button onClick={()=>{
          destroyRoom()
        }} className="text-xs bg-zinc-800 hover:bg-red-500 px-3 py-1.5 rounded text-zinc-400 hover:text-white font-bold transition-all group flexitems-center gap-2 disabled:opacity-50 ">
         <span className="group-hover animate-pulse">💥
         </span>
          DESTROY NOW

        </button>
      </header>


             {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">

         {messages?.messages.length === 0 && (
           <div className="flex items-center justify-center h-full">
             <p className="text-zinc-600 text-sm font-mono">
               No messages yet, start the conversation.
             </p>
           </div>
         )}

         {messages?.messages.map((msg) => (
           <div
             key={msg.id}
             className="flex flex-col items-start"
           >
             <div className="max-w-[80%] group">

               <div className="flex items-baseline gap-3 mb-1">

                 <span
                   className={`text-xs font-bold ${
                     msg.sender === username
                       ? "text-green-500"
                       : "text-blue-500"
                   }`}
                 >
                   {msg.sender === username ? "YOU" : msg.sender}
                 </span>
                 
                 <span className="text-[10px] text-zinc-600">
                   {format(msg.timestamp, "HH:mm")}
                 </span>
                 
               </div>
                 
               <p className="text-sm text-zinc-300 leading-relaxed break-all">
                 {msg.text}
               </p>
                 
             </div>
           </div>
         ))}

        </div>
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
        <div className="flex gap-4">
          <div className="flex-1 relative group">

              <span className="  absolute  left-4  top-1/2  -translate-y-1/2  text-green-500  animate-pulse">
                {">"}
              </span>

              {/* so auto focus se..page khulte hi cursor input box mai ajata hai then value={input} as in input box mai jo text dikhega  wo input state se ayega
              the on keydown maane enter press hua toh send krdo and again cursor input box mai ......onchange mtlb r.target.value jb change ho to usse state mai update krdo
               */}

              <input autoFocus type="text"
               value={input} 
              onKeyDown={(e)=>{if(e.key==="Enter" && input.trim()){
                //todo send msg

                  sendMessage({text:input})
                  setInput("");
                  inputRef.current?.focus()
              }}} 
              onChange={(e)=>setInput(e.target.value)} 

              placeholder="type message..."
              className="   w-full   bg-black   border border-zinc-400   focus:border-zinc-700   focus:outline-none   transition-colors   text-zinc-100   placeholder:text-zinc-700   py-3   pl-8   pr-4   text-sm " />
          </div>
          <button onClick={()=>{ sendMessage({text:input})
                  inputRef.current?.focus()}} disabled={!input.trim() || isPending} className="bg-zinc-800 text-zinc-400 px-6 text-sm font-black hover:text-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cusor-pointer"> SEND</button>
        </div>
      </div>


    </main>
  );
};


export default Page;