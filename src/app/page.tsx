"use client";
import { api } from "@/lib/eden";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useUsername } from "@/hooks/use-usename";


export default function Home() {
  const {username} = useUsername()
  const router = useRouter()
  
  const searchParams = useSearchParams()
  const wasDestroyed = searchParams.get("destroyed")==="true"
  const error = searchParams.get("error")


  const {mutate: createRoom} = useMutation({
    mutationFn:async()=>{
      const res = await api.room.post()
      if(res.status===200){
        router.push(`/room/${res.data?.roomId}`)
      }
    }
  })//tanstackQuery


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {wasDestroyed && <div className="p-4 bg-red-900 text-red-100 border border-red-700 rounded-md text-center"><p className="text-red-500 font-bold text-sm">Room Closed</p>
        <p className="text-zinc-500 text-xs mt-1 ">All messages were permanentely deleted</p></div>}
        {error==="room-not-found" && <div className="p-4 bg-red-900 text-red-100 border border-red-700 rounded-md text-center"><p className="text-red-500 font-bold text-sm">Room not found</p>
        <p className="text-zinc-500 text-xs mt-1 ">This room may have expired or never existed</p></div>}
        {error==="room-full" && <div className="p-4 bg-red-900 text-red-100 border border-red-700 rounded-md text-center"><p className="text-red-500 font-bold text-sm">Room full</p>
        <p className="text-zinc-500 text-xs mt-1 ">This room is at maximum capacity</p></div>}


        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-green-400">Dummy</h1>
          <p className="text-red-500 text-sm">A private self destructing room</p>
        </div>
        <div className="border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md">
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="flex-items-center text-zinc-500">Your name</label>
            <div className="flex-items-center gap-3">
              <div className="flex-1 bg-zinc-950 border border-zinc-800 p-3 text-sm text-zinc-400 font-mono"> {username}

            </div>
            </div>
          </div>
          <button onClick={()=> createRoom()} className="w-full bg-zinc-100 text-black p-3 text-sm font-bold hover:bg-zinc-50 hover:text-black transition-colors mt-2 cursor-pointer disabled:opacity-50">Create Secure Room</button>
        </div>
        </div>
      </div>
    </main>
  );
}
