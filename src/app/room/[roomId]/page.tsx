"use client";

import { useParams } from "next/navigation";
import { useState,useRef } from "react";

function formatTimeRemaining(seconds:number){
  const mins=Math.floor(seconds/60);
  const secs=seconds%60

  return `${mins}:${secs.toString().padStart(2,"0")}`
}



const Page = () => {
  const params = useParams();
  const roomId = params.roomId as string;


  const[input,setInput]=useState("");
  const inputRef=useRef<HTMLInputElement>(null);

  const[copyStatus,setCopyStatus]=useState("COPY");
  const[timeRemaining,setTimeRemainng]=useState<number | null>(null); //so that typescript knows that it will be set to number later or null

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
        <button className="text-xs bg-zinc-800 hover:bg-red-500 px-3 py-1.5 rounded text-zinc-400 hover:text-white font-bold transition-all group flexitems-center gap-2 disabled:opacity-50 ">
         <span className="group-hover animate-pulse">💥
         </span>
          DESTROY NOW

        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4  scrollbar-thin"></div>
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
                  inputRef.current?.focus()
              }}} 
              onChange={(e)=>setInput(e.target.value)} 

              placeholder="type message..."
              className="   w-full   bg-black   border border-zinc-400   focus:border-zinc-700   focus:outline-none   transition-colors   text-zinc-100   placeholder:text-zinc-700   py-3   pl-8   pr-4   text-sm " />
          </div>
          <button className="bg-zinc-800 text-zinc-400 px-6 text-sm font-black hover:text-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cusor-pointer"> SEND</button>
        </div>
      </div>


    </main>
  );
};


export default Page;