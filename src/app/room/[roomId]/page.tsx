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

const Page =() => {
  const params = useParams();
  const roomId = params.roomId as string
  const router = useRouter()
  const queryClient = useQueryClient()
  const {username} = useUsername()
  const [input,setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null);
  const [copyStatus,setCopyStatus] = useState("Copy")
  const [timeRemaining,setTimeRemaining] = useState< number | null >(null)
  
  // FIX: Add refs to prevent duplicate submissions
  const [isSubmitting, setIsSubmitting] = useState(false)
  const lastSubmitTime = useRef(0)

  // FIX: Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // FIX: Auto-focus input when submission completes
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
    // FIX: Don't auto-refetch, rely on realtime updates
    refetchInterval: false,
    staleTime: Infinity
  })
  
  // FIX: Optimized mutation with proper state management
  const {mutate: sendMessage} = useMutation({
    mutationFn: async ({text}:{text:string}) => {
      const res = await api.messages.post({
        sender: username,
        text
      },{query: { roomId }})
      return res.data
    },
    onMutate: async (newMessage) => {
      // FIX: Optimistic update
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
  
  // FIX: Use realtime for instant updates
  useRealtime({
    channels:[roomId],
    events:["chat.message","chat.destroy"],
    onData:({event, data})=>{
      if(event==="chat.message"){
        // FIX: Update query cache directly without refetch
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
      setCopyStatus("Copy")
    }, 2000);
  }

  // FIX: Prevent duplicate submissions with debouncing
  const handleSendMessage = () => {
    const now = Date.now()
    
    // FIX: Prevent spam with 500ms cooldown
    if (isSubmitting || now - lastSubmitTime.current < 500) {
      return
    }
    
    const trimmedInput = input.trim()
    if (!trimmedInput) return
    
    lastSubmitTime.current = now
    setIsSubmitting(true)
    sendMessage({text: trimmedInput})
  }

  // FIX: Prevent Enter key spam
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return( 
 <main className="flex flex-col h-screen max-h-screen overflow-hidden bg-neutral-950 relative">
  {/* Enhanced Background with Grid Pattern */}
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Subtle Grid Overlay */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#0a0a0a_1px,transparent_1px),linear-gradient(to_bottom,#0a0a0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_110%)] opacity-10"></div>
    
    {/* Animated Blobs */}
    <div className="absolute top-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-cyan-900/8 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-3xl animate-blob"></div>
    <div className="absolute bottom-0 left-0 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-teal-900/8 rounded-[30%_70%_70%_30%/30%_30%_70%_70%] blur-3xl animate-blob animation-delay-2000"></div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-cyan-800/6 rounded-full blur-3xl"></div>
  </div>

  {/* Premium Header with Glassmorphism */}
  <header className="relative z-10 border-b border-cyan-800/30 backdrop-blur-2xl overflow-hidden">
    {/* Top Accent Line */}
    <div className="h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
    
    {/* Animated Header Background */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute -top-32 right-0 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-gradient-to-br from-cyan-600/15 to-cyan-800/10 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-2xl animate-blob"></div>
      <div className="absolute top-0 left-0 w-[175px] md:w-[350px] h-[175px] md:h-[350px] bg-gradient-to-br from-teal-600/12 to-teal-800/8 rounded-[40%_60%_70%_30%/40%_60%_30%_70%] blur-2xl animate-blob animation-delay-4000"></div>
      <div className="absolute top-0 left-1/2 w-[150px] md:w-[300px] h-[150px] md:h-[300px] bg-cyan-500/8 rounded-full blur-3xl animate-pulse"></div>
    </div>
    
    <div className="relative bg-gradient-to-br from-neutral-900/70 via-neutral-950/80 to-neutral-900/70 p-3 md:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
        {/* Left Section - Enhanced Room Info */}
        <div className="flex items-center gap-3 md:gap-6 w-full md:w-auto">
          {/* Premium Room Avatar */}
          <div className="relative group">
            <div className="absolute inset-0 bg-cyan-600/30 blur-xl rounded-full group-hover:bg-cyan-500/40 transition-all duration-500 animate-pulse"></div>
            <div className="relative w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-cyan-500 via-cyan-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-900/50 group-hover:scale-110 transition-all duration-300 rotate-3 group-hover:rotate-6 border-2 border-cyan-400/30 group-hover:border-cyan-300/40">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-cyan-50 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>

          {/* Enhanced Room Details */}
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base md:text-lg font-black bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-400 bg-clip-text text-transparent drop-shadow-sm">
                Secret Room
              </h2>
              {/* Premium Badge */}
              <span className="relative inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gradient-to-r from-cyan-900/40 to-cyan-800/40 border border-cyan-600/40 rounded-full text-[10px] md:text-xs font-bold text-cyan-300 shadow-lg backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400"></span>
                </span>
                Active
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] md:text-xs text-neutral-500 font-semibold uppercase tracking-wider">ID:</span>
              <code className="text-xs md:text-sm font-mono font-bold text-cyan-400 truncate max-w-[120px] md:max-w-none bg-cyan-950/20 px-2 py-0.5 rounded-md border border-cyan-900/30">{roomId}</code>
              {/* Enhanced Copy Button */}
              <button 
                onClick={copyLink} 
                className="group/copy relative px-2 md:px-3 py-1 md:py-1.5 bg-gradient-to-br from-neutral-800/60 to-neutral-900/60 hover:from-cyan-900/40 hover:to-cyan-800/40 rounded-lg text-[10px] md:text-xs font-bold text-neutral-400 hover:text-cyan-300 transition-all duration-300 border border-neutral-700/40 hover:border-cyan-700/60 flex items-center gap-1 shadow-lg hover:shadow-cyan-900/30 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/0 via-cyan-600/20 to-cyan-600/0 translate-x-[-100%] group-hover/copy:translate-x-[100%] transition-transform duration-700"></div>
                <svg className="relative w-3 h-3 md:w-3.5 md:h-3.5 group-hover/copy:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="relative hidden sm:inline">{copyStatus}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Section - Enhanced Controls */}
        <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-end">
          {/* Premium Timer Card */}
          <div className="relative group/timer">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-600/20 to-amber-500/20 rounded-xl blur opacity-0 group-hover/timer:opacity-100 transition-opacity duration-500"></div>
            <div className="relative px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-br from-neutral-800/70 to-neutral-900/70 border border-neutral-700/50 rounded-xl backdrop-blur-md shadow-lg">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="relative">
                  <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${timeRemaining !== null && timeRemaining < 60 ? "bg-red-500" : "bg-amber-500"} animate-pulse shadow-lg ${timeRemaining !== null && timeRemaining < 60 ? "shadow-red-500/50" : "shadow-amber-500/50"}`}></div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] md:text-[10px] text-neutral-400 uppercase tracking-widest font-bold">Closes in</span>
                  <span className={`text-sm md:text-base font-black font-mono ${timeRemaining !== null && timeRemaining < 60 ? "text-red-400" : "text-amber-400"}`}>
                    {timeRemaining !== null ? formatTimeRemaining(timeRemaining) : "--:--"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Close Button */}
          <button 
            onClick={() => destroyRoom()} 
            className="group/close relative overflow-hidden px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-br from-red-950/60 to-red-900/60 hover:from-red-600 hover:to-red-700 border-2 border-red-900/50 hover:border-red-500/70 rounded-xl text-red-400 hover:text-white font-black transition-all duration-300 flex items-center gap-1.5 md:gap-2 disabled:opacity-50 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl hover:shadow-red-900/40"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-500/30 to-red-600/0 translate-x-[-100%] group-hover/close:translate-x-[100%] transition-transform duration-700"></div>
            <svg className="relative w-3.5 h-3.5 md:w-4 md:h-4 group-hover/close:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="relative text-xs md:text-sm uppercase tracking-wider font-black">Close</span>
          </button>
        </div>
      </div>
    </div>
  </header>

  {/* Premium Messages Area */}
  <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-5">
    {messages?.messages.length === 0 && (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-5 md:space-y-6 px-4">
          {/* Premium Empty State */}
          <div className="relative w-24 h-24 md:w-28 md:h-28 mx-auto">
            <div className="absolute inset-0 bg-cyan-600/20 blur-3xl rounded-full animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 to-teal-600/10 rounded-full animate-ping"></div>
            <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-[40%] bg-gradient-to-br from-neutral-800/70 via-neutral-900/70 to-neutral-800/70 flex items-center justify-center border-2 border-neutral-700/60 shadow-2xl rotate-6 backdrop-blur-sm">
              <svg className="w-12 h-12 md:w-14 md:h-14 text-cyan-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-neutral-200 text-lg md:text-xl font-black">Start the Conversation</p>
            <p className="text-neutral-500 text-xs md:text-sm font-medium max-w-xs mx-auto">Your messages will appear here and vanish when you close the room</p>
            
            {/* Quick Tips Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/30 border border-cyan-800/30 rounded-full text-[10px] md:text-xs font-semibold text-cyan-400 backdrop-blur-sm">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Press Enter to send
              </span>
            </div>
          </div>
        </div>
      </div>
    )}
    
    {messages?.messages.map((msg, index) => (
      <div 
        key={msg.id} 
        className={`flex gap-2 md:gap-3 ${msg.sender === username ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-4 duration-500`}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Premium Avatar */}
        <div className="flex-shrink-0 relative group/avatar">
          <div className={`absolute inset-0 ${msg.sender === username ? "bg-cyan-600/30" : "bg-teal-600/30"} blur-md rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300`}></div>
          <div className={`relative w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-xs md:text-sm shadow-xl ring-2 ${
            msg.sender === username 
              ? "bg-gradient-to-br from-cyan-500 to-cyan-700 text-cyan-50 ring-cyan-500/30" 
              : "bg-gradient-to-br from-teal-600 to-teal-800 text-teal-50 ring-teal-600/30"
          } group-hover/avatar:scale-110 transition-transform duration-300`}>
            {msg.sender.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Premium Message Content */}
        <div className={`flex flex-col gap-1 md:gap-1.5 max-w-[75%] md:max-w-[65%] ${msg.sender === username ? 'items-end' : 'items-start'}`}>
          {/* Enhanced Username Badge */}
          <div className="flex items-center gap-1.5 md:gap-2 px-2">
            <span className={`text-[10px] md:text-xs font-black uppercase tracking-wide ${msg.sender === username ? "text-cyan-400" : "text-teal-400"}`}>
              {msg.sender === username ? "You" : msg.sender}
            </span>
            <span className="text-neutral-700">•</span>
            <span className="text-[9px] md:text-[10px] text-neutral-600 font-bold">{format(msg.timestamp, "HH:mm")}</span>
          </div>
          
          {/* Premium Message Bubble */}
          <div className="relative group/msg">
            {/* Enhanced Tail */}
            <div className={`absolute top-2 ${msg.sender === username ? '-right-1' : '-left-1'} w-2.5 h-2.5 md:w-3 md:h-3 ${
              msg.sender === username 
                ? "bg-gradient-to-br from-cyan-600 to-cyan-800" 
                : "bg-gradient-to-br from-neutral-800 to-neutral-900"
            } rotate-45 ${msg.sender === username ? 'rounded-br-sm' : 'rounded-bl-sm'}`}></div>
            
            {/* Premium Bubble */}
            <div className={`relative ${
              msg.sender === username 
                ? "bg-gradient-to-br from-cyan-600 via-cyan-700 to-cyan-800 shadow-cyan-900/40" 
                : "bg-gradient-to-br from-neutral-800 via-neutral-850 to-neutral-900 backdrop-blur-sm shadow-neutral-900/60"
            } rounded-3xl px-4 py-3 md:px-5 md:py-3.5 shadow-2xl group-hover/msg:shadow-3xl transition-all duration-300 border-2 ${
              msg.sender === username ? "border-cyan-500/20" : "border-neutral-700/40"
            } group-hover/msg:scale-[1.02]`}>
              {/* Enhanced Shine Effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 via-white/5 to-transparent opacity-0 group-hover/msg:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              
              <p className={`text-sm md:text-[15px] leading-relaxed break-words relative z-10 ${
                msg.sender === username ? "text-cyan-50 font-medium" : "text-neutral-50 font-medium"
              }`}>
                {msg.text}
              </p>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>

  {/* Premium Footer */}
  <footer className="relative z-10 border-t border-cyan-800/30 backdrop-blur-2xl overflow-hidden">
    {/* Top Accent Line */}
    <div className="h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
    
    {/* Animated Footer Background */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute -bottom-32 left-0 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-gradient-to-tr from-teal-600/15 to-teal-800/10 rounded-[40%_60%_70%_30%/40%_60%_30%_70%] blur-2xl animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 right-0 w-[175px] md:w-[350px] h-[175px] md:h-[350px] bg-gradient-to-tl from-cyan-600/12 to-cyan-800/8 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-2xl animate-blob animation-delay-6000"></div>
      <div className="absolute bottom-0 left-1/2 w-[150px] md:w-[300px] h-[150px] md:h-[300px] bg-teal-500/8 rounded-full blur-3xl animate-pulse"></div>
    </div>

    <div className="relative bg-gradient-to-br from-neutral-900/70 via-neutral-950/80 to-neutral-900/70 p-3 md:p-6">
      <div className="flex gap-2 md:gap-3 items-end">
        {/* Premium Input Container */}
        <div className="flex-1 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600/0 via-cyan-600/40 to-cyan-600/0 rounded-[28px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-md"></div>
          
          <div className="relative">
            {/* Enhanced Input Icon */}
            <div className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-cyan-600/20 flex items-center justify-center group-focus-within:bg-cyan-600/30 transition-colors duration-300 border border-cyan-600/20">
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-400 group-focus-within:scale-110 group-focus-within:text-cyan-300 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
            </div>

            {/* Premium Input Field - FIX: Added onKeyDown handler and removed autoFocus */}
            <input 
              ref={inputRef}
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              type="text" 
              placeholder="Type your message..." 
              className="w-full bg-gradient-to-br from-neutral-900/80 to-neutral-950/80 border-2 border-neutral-800/70 focus:border-cyan-600/60 focus:bg-neutral-900/90 focus:outline-none transition-all duration-300 text-neutral-50 placeholder:text-neutral-500 placeholder:font-medium py-3 md:py-4 pl-14 md:pl-16 pr-14 md:pr-16 text-sm md:text-base rounded-[28px] hover:border-neutral-700/80 shadow-xl focus:shadow-2xl focus:shadow-cyan-900/20 font-medium backdrop-blur-sm disabled:opacity-50"
            />

            {/* Enhanced Character Count */}
            {input.length > 0 && (
              <div className="absolute right-4 md:right-5 top-1/2 -translate-y-1/2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-800/60 border border-neutral-700/40 rounded-full text-[10px] md:text-xs text-neutral-500 font-bold backdrop-blur-sm">
                  {input.length}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Premium Send Button - FIX: Updated onClick handler */}
        <button 
          onClick={handleSendMessage}
          disabled={!input.trim() || isSubmitting} 
          className="group/btn relative overflow-hidden bg-gradient-to-br from-cyan-600 via-cyan-600 to-teal-600 hover:from-cyan-500 hover:via-cyan-500 hover:to-teal-500 p-3.5 md:p-4 rounded-full text-white font-bold transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xl shadow-cyan-900/60 hover:shadow-cyan-800/80 hover:scale-110 active:scale-95 disabled:hover:scale-100 border-2 border-cyan-500/40 hover:border-cyan-400/60"
        >
          {/* Multiple Animation Layers */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-white/30 to-cyan-400/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_120%,rgba(6,182,212,0.4),transparent_70%)] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute inset-0 rounded-full bg-cyan-400/0 group-hover/btn:bg-cyan-400/20 group-hover/btn:animate-pulse transition-all duration-500"></div>
          
          {/* Send Icon */}
          {isSubmitting ? (
            <svg className="relative w-5 h-5 md:w-6 md:h-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="relative w-5 h-5 md:w-6 md:h-6 group-hover/btn:rotate-45 group-hover/btn:scale-110 transition-all duration-500 ease-out drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>

      {/* Premium Footer Info Bar */}
      <div className="mt-3 md:mt-4 flex flex-wrap items-center justify-center gap-3 md:gap-4">
        <div className="group/stat inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border border-neutral-700/40 rounded-full text-[10px] md:text-xs text-neutral-400 font-semibold backdrop-blur-sm shadow-lg hover:border-cyan-700/40 hover:text-cyan-400 transition-all duration-300 cursor-default">
          <div className="w-5 h-5 rounded-lg bg-cyan-600/20 flex items-center justify-center border border-cyan-600/20 group-hover/stat:bg-cyan-600/30 transition-colors">
            <svg className="w-3 h-3 text-cyan-500 group-hover/stat:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="hidden sm:inline">End-to-end encrypted</span>
          <span className="sm:hidden">Encrypted</span>
        </div>
        
        <div className="group/stat inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border border-neutral-700/40 rounded-full text-[10px] md:text-xs text-neutral-400 font-semibold backdrop-blur-sm shadow-lg hover:border-cyan-700/40 hover:text-cyan-400 transition-all duration-300 cursor-default">
          <div className="w-5 h-5 rounded-lg bg-cyan-600/20 flex items-center justify-center border border-cyan-600/20 group-hover/stat:bg-cyan-600/30 transition-colors">
            <svg className="w-3 h-3 text-cyan-500 group-hover/stat:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <span>Self-destructs</span>
        </div>
        
        <div className="group/stat inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border border-neutral-700/40 rounded-full text-[10px] md:text-xs text-neutral-400 font-semibold backdrop-blur-sm shadow-lg hover:border-cyan-700/40 hover:text-cyan-400 transition-all duration-300 cursor-default">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </div>
          <span className="font-black">{messages?.messages.length || 0}</span>
          <span>messages</span>
        </div>
      </div>
    </div>
  </footer>
</main>
)
}

export default Page;
