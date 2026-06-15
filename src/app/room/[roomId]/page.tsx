"use client";

import { useParams } from "next/navigation";

const Page = () => {
  const params = useParams();
  const roomId = params.roomId as string;

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
                    <button className=" text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-200 transition-colors"> Copy
                    </button>
                </div>
            </div>
        </div>
      </header>
    </main>
  );
};

export default Page;