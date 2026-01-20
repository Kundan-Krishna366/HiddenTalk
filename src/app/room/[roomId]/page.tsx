"use client";
import { api } from "@/lib/eden";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useUsername } from "@/hooks/use-usename";
import { format } from "date-fns";
import { useRealtime } from "@/lib/realtime-client";

function formatTimeRemaining(seconds: number){
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2,'0')}`;
}

const Page = () => {
  const params = useParams();
  const roomId = params.roomId as string
  const router = useRouter()
  const queryClient = useQueryClient()
  const {username} = useUsername()
  const [input,setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null);
  const [copyStatus,setCopyStatus] = useState("Copy ID")
  const [timeRemaining,setTimeRemaining] = useState< number | null >(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const lastSubmitTime = useRef(0)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    if (!isSubmitting && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isSubmitting])

  const {data: ttlData } = useQuery({
    queryKey: ["ttl",roomId],
    queryFn: async () => {
       const res = await api.room.ttl.get({query:{roomId}})
        return res.data
    }   
  })

  useEffect(() => {
    if (ttlData?.ttl !== undefined) setTimeRemaining(ttlData.ttl)
  }, [ttlData])

  useEffect(() => {
    if (timeRemaining === null || timeRemaining < 0) return

    if (timeRemaining === 0) {
      router.push("/?destroyed=true")
      return
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining, router])

  const {data:messages} = useQuery({
    queryKey: ["messages",roomId],
    queryFn: async () => {
      const res = await api.messages.get({query:{roomId}})
      return res.data
    },
    refetchInterval: false,
    staleTime: Infinity
  })
  
  const {mutate: sendMessage} = useMutation({
    mutationFn: async ({text}:{text:string}) => {
      const res = await api.messages.post({
        sender: username,
        text
      },{query: { roomId }})
      return res.data
    },
    onMutate: async (newMessage) => {
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        sender: username,
        text: newMessage.text,
        timestamp: Date.now(),
        roomId,
        token: 'current'
      }
      
      queryClient.setQueryData(["messages", roomId], (old: any) => ({
        messages: [...(old?.messages || []), optimisticMessage]
      }))
      
      return { optimisticMessage }
    },
    onSuccess: () => {
      setInput("")
      setIsSubmitting(false)
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(["messages", roomId], (old: any) => ({
        messages: old?.messages.filter((m: any) => m.id !== context?.optimisticMessage.id) || []
      }))
      setIsSubmitting(false)
    }
  })
  
  useRealtime({
    channels:[roomId],
    events:["chat.message","chat.destroy"],
    onData:({event, data})=>{
      if(event==="chat.message"){
        queryClient.setQueryData(["messages", roomId], (old: any) => {
          const exists = old?.messages.some((m: any) => m.id === data.id)
          if (exists) return old
          return {
            messages: [...(old?.messages || []).filter((m: any) => !m.id.startsWith('temp-')), data]
          }
        })
      }
      if(event==="chat.destroy"){
        router.push("/?destroyed=true")
      }
    }
  })
   
  const {mutate:destroyRoom} = useMutation({
    mutationFn: async () => {
      await api.room.delete(null,{query:{roomId}})
    }
  })

  const copyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setCopyStatus("Copied")
    setTimeout(() => {
      setCopyStatus("Copy ID")
    }, 2000);
  }

  const handleSendMessage = () => {
    const now = Date.now()
    
    if (isSubmitting || now - lastSubmitTime.current < 500) {
      return
    }
    
    const trimmedInput = input.trim()
    if (!trimmedInput) return
    
    lastSubmitTime.current = now
    setIsSubmitting(true)
    sendMessage({text: trimmedInput})
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return( 
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-black text-zinc-100 font-sans selection:bg-white selection:text-black">
      <header className="h-14 border-b border-zinc-900 bg-black/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 z-20">
        <div className="flex items-center gap-6">
          <div className="font-bold tracking-tight text-sm text-white select-none">
            HiddenTalk
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-2 py-1 bg-zinc-900/50 rounded border border-zinc-800">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="text-[10px] font-mono text-zinc-400">{roomId}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={copyLink}
            className="group flex items-center gap-2 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500 hover:text-white bg-zinc-900/50 hover:bg-zinc-900 rounded border border-zinc-800/50 hover:border-zinc-800 transition-all"
          >
            <svg className="w-3 h-3 text-zinc-600 group-hover:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            <span>{copyStatus}</span>
          </button>
          
          <div className="h-4 w-px bg-zinc-900 mx-1"></div>

          <div className="flex flex-col items-end mr-1">
            <span className="text-[9px] uppercase font-bold text-zinc-600 tracking-widest">Purge</span>
            <span className={`text-xs font-mono font-medium ${timeRemaining !== null && timeRemaining < 60 ? "text-red-500" : "text-white"}`}>
               {timeRemaining !== null ? formatTimeRemaining(timeRemaining) : "--:--"}
            </span>
          </div>

          <button 
            onClick={() => destroyRoom()} 
            className="flex items-center gap-2 px-3 py-1.5 ml-1 text-[10px] font-medium uppercase tracking-wider text-red-500 hover:text-red-400 bg-red-950/20 hover:bg-red-900/30 rounded border border-red-900/30 hover:border-red-800/50 transition-all"
            title="Close Room"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            <span>Close</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-black relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-50"></div>
        
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          {messages?.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center select-none">
              <div className="w-12 h-12 bg-zinc-900/50 rounded-lg flex items-center justify-center mb-4 border border-zinc-800">
                <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <h3 className="text-sm font-medium text-white tracking-tight">Encrypted Channel Established</h3>
              <p className="text-xs text-zinc-500 mt-2 max-w-[200px] leading-relaxed">This room and its contents will be permanently erased upon closure.</p>
            </div>
          )}

          {messages?.messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-3 group ${msg.sender === username ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold border transition-colors ${
                msg.sender === username 
                  ? "bg-white text-black border-white" 
                  : "bg-zinc-950 text-zinc-400 border-zinc-800 group-hover:border-zinc-700"
              }`}>
                {msg.sender.charAt(0).toUpperCase()}
              </div>

              <div className={`flex flex-col max-w-[80%] md:max-w-[70%] ${msg.sender === username ? 'items-end' : 'items-start'}`}>
                <div className="flex items-baseline gap-2 mb-1 px-0.5">
                  <span className={`text-[10px] font-semibold ${msg.sender === username ? "text-white" : "text-zinc-400"}`}>{msg.sender === username ? "You" : msg.sender}</span>
                  <span className="text-[9px] font-mono text-zinc-600">{format(msg.timestamp, "HH:mm")}</span>
                </div>
                
                <div className={`px-4 py-2.5 rounded-lg text-sm leading-relaxed border transition-all ${
                  msg.sender === username 
                    ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                    : "bg-zinc-900/80 text-zinc-200 border-zinc-800"
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="bg-black border-t border-zinc-900 p-4 z-20">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input 
            ref={inputRef}
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            type="text" 
            placeholder="Write a message..." 
            className="flex-1 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 focus:border-zinc-600 focus:bg-black rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-600 transition-all outline-none disabled:opacity-50"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!input.trim() || isSubmitting} 
            className="bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-lg transition-colors disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed flex items-center justify-center min-w-[3rem]"
          >
            {isSubmitting ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg className="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            )}
          </button>
        </div>
        <div className="max-w-3xl mx-auto mt-3 text-center">
             <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">## After the timer ends the chat vanishes ##</p>
        </div>
      </footer>
    </div>
  )
}

export default Page;