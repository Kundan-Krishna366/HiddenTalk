"use client";
import { api } from "@/lib/eden";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useUsername } from "@/hooks/use-usename";
import { Suspense } from "react";

const Page = () => {
  return <Suspense><Home/></Suspense>
}

export default Page;

function Home() {
  const {username} = useUsername()
  const router = useRouter()
  
  const searchParams = useSearchParams()
  const wasDestroyed = searchParams.get("destroyed") === "true"
  const error = searchParams.get("error")

  const {mutate: createRoom, isPending} = useMutation({
    mutationFn: async() => {
      const res = await api.room.post()
      if(res.status === 200){
        router.push(`/room/${res.data?.roomId}`)
      }
    }
  })

  const clearErrorsAndGoHome = () => {
    router.push('/')
  }

  return (
<main className="flex min-h-screen flex-col items-center justify-center p-6 bg-neutral-950 relative overflow-hidden">
  {/* Enhanced Background with Grid Pattern */}
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Animated Gradient Mesh */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#0a0a0a_1px,transparent_1px),linear-gradient(to_bottom,#0a0a0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)] opacity-20"></div>
    
    {/* Organic blobs */}
    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-600/8 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-3xl animate-blob"></div>
    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-600/8 rounded-[30%_70%_70%_30%/30%_30%_70%_70%] blur-3xl animate-blob animation-delay-2000"></div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-cyan-500/6 rounded-full blur-3xl"></div>
  </div>

  <div className="w-full max-w-md space-y-8 relative z-10">
    
    {/* Enhanced Alert Components */}
    {wasDestroyed && (
      <div role="alert" className="relative p-4 bg-gradient-to-br from-red-950/50 via-red-900/30 to-red-950/50 border border-red-500/30 rounded-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300 shadow-2xl shadow-red-900/20">
        {/* Animated border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/0 via-red-500/30 to-red-500/0 blur-sm animate-pulse"></div>
        
        <div className="relative flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/30 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg backdrop-blur-sm border border-red-500/20">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-red-300 font-bold text-sm">Room Closed</p>
            <p className="text-neutral-400 text-xs mt-1 leading-relaxed">All messages were permanently deleted</p>
          </div>
        </div>
      </div>
    )}

    {error === "room-not-found" && (
      <div role="alert" className="relative p-4 bg-gradient-to-br from-red-950/50 via-red-900/30 to-red-950/50 border border-red-500/30 rounded-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300 shadow-2xl shadow-red-900/20">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/0 via-red-500/30 to-red-500/0 blur-sm animate-pulse"></div>
        
        <div className="relative flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/30 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg backdrop-blur-sm border border-red-500/20">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-red-300 font-bold text-sm">Room Not Found</p>
            <p className="text-neutral-400 text-xs mt-1 leading-relaxed">This room may have expired or never existed</p>
          </div>
        </div>
      </div>
    )}

    {error === "room-full" && (
      <div role="alert" className="relative p-4 bg-gradient-to-br from-amber-950/50 via-amber-900/30 to-amber-950/50 border border-amber-500/30 rounded-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300 shadow-2xl shadow-amber-900/20">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/0 via-amber-500/30 to-amber-500/0 blur-sm animate-pulse"></div>
        
        <div className="relative flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg backdrop-blur-sm border border-amber-500/20">
            <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 012 0v4a1 1 0 11-2 0V9zm1-5a1 1 0 100 2 1 1 0 000-2z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-amber-300 font-bold text-sm">Room Full</p>
            <p className="text-neutral-400 text-xs mt-1 leading-relaxed">This room is at maximum capacity</p>
          </div>
        </div>
      </div>
    )}

    {/* Enhanced Hero Section with Badge */}
    <button 
      onClick={clearErrorsAndGoHome}
      className="text-center space-y-5 w-full group/logo transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
    >
      {/* Decorative Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-950/50 border border-cyan-800/30 rounded-full text-xs font-semibold text-cyan-400 backdrop-blur-sm shadow-lg shadow-cyan-900/20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        Privacy First • End-to-End Encrypted
      </div>

      <div className="inline-flex items-center gap-4">
        {/* Premium Icon Design */}
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-600/20 blur-2xl rounded-full group-hover/logo:bg-cyan-500/30 transition-all duration-700"></div>
          <div className="relative w-16 h-16 bg-gradient-to-br from-cyan-500 via-cyan-600 to-teal-600 rounded-[40%] flex items-center justify-center shadow-2xl shadow-cyan-900/60 group-hover/logo:shadow-cyan-800/80 transition-all duration-500 group-hover/logo:rounded-[45%] rotate-6 group-hover/logo:rotate-12 border-2 border-cyan-400/20 group-hover/logo:border-cyan-300/30">
            <svg className="w-8 h-8 text-cyan-50 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>
        
        {/* Logo with Text Shadow */}
        <h1 className="text-5xl font-black tracking-tight drop-shadow-2xl">
          <span className="bg-gradient-to-r from-neutral-50 via-neutral-200 to-neutral-300 bg-clip-text text-transparent">Hidden</span>
          <span className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-teal-500 bg-clip-text text-transparent">Talk</span>
        </h1>
      </div>
      
      <p className="text-neutral-400 text-base max-w-sm mx-auto leading-relaxed font-medium">
        Private conversations that disappear after you're done
      </p>
    </button>

    {/* Premium Card with Tabs-like Design */}
    <div className="relative group/card">
      {/* Enhanced Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600/20 via-teal-600/20 to-cyan-600/20 rounded-[34px] blur-2xl opacity-0 group-hover/card:opacity-100 transition-all duration-700"></div>
      
      <div className="relative bg-gradient-to-br from-neutral-900/80 via-neutral-900/60 to-neutral-900/80 border border-neutral-800/80 rounded-[32px] backdrop-blur-2xl shadow-2xl overflow-hidden">
        {/* Top Accent Bar */}
        <div className="h-1 bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500"></div>
        
        <div className="p-8 space-y-6">
          
          {/* Username Input with Icon */}
          <div className="space-y-3">
            <label className="text-neutral-300 text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
              <div className="w-5 h-5 rounded-lg bg-cyan-600/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              Your Identity
            </label>
            
            <div className="relative group/input">
              {/* Animated Ring */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600/0 via-cyan-600/40 to-cyan-600/0 rounded-[22px] opacity-0 group-hover/input:opacity-100 group-focus-within/input:opacity-100 transition-all duration-700 blur-sm"></div>
              
              <div className="relative flex items-center gap-3 bg-neutral-950/90 border-2 border-neutral-800/80 rounded-[22px] px-5 py-4 hover:border-cyan-900/60 focus-within:border-cyan-700/70 transition-all duration-500 shadow-inner">
                {/* Avatar Circle */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-teal-600 flex items-center justify-center font-bold text-sm text-white shadow-lg ring-2 ring-cyan-500/20">
                  {username?.charAt(0)?.toUpperCase() || "?"}
                </div>
                
                <div className="flex-1">
                  <p className="text-neutral-100 font-bold text-base">{username || "Loading..."}</p>
                  <p className="text-neutral-500 text-xs font-medium">Anonymous User</p>
                </div>
                
                {/* Verified Badge */}
                <div className="w-6 h-6 rounded-full bg-cyan-600/20 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800/60"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-neutral-900 px-3 text-neutral-500 font-semibold tracking-wider">Ready to chat?</span>
            </div>
          </div>

          {/* Premium Button with Multiple States */}
          <button 
            onClick={() => createRoom()} 
            disabled={isPending}
            className="group/btn relative overflow-hidden w-full bg-gradient-to-r from-cyan-600 via-cyan-600 to-teal-600 hover:from-cyan-500 hover:via-cyan-500 hover:to-teal-500 text-white font-bold py-4 px-6 rounded-[20px] transition-all duration-500 shadow-2xl shadow-cyan-900/60 hover:shadow-cyan-800/80 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 border-2 border-cyan-500/40 hover:border-cyan-400/60"
          >
            {/* Animated Background Layers */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-white/20 to-cyan-400/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(6,182,212,0.3),transparent_70%)] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
            
            {/* Button Content */}
            <span className="relative flex items-center justify-center gap-3 text-base">
              {isPending ? (
                <>
                  {/* Spinning Loader */}
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-bold tracking-wide">Creating Your Room...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 group-hover/btn:scale-110 group-hover/btn:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="font-bold tracking-wide">Start a Secret Chat</span>
                  <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </span>
          </button>

          {/* Enhanced Feature Pills with Tooltips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="group/pill relative inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-neutral-800/60 to-neutral-900/60 rounded-full text-xs text-neutral-300 font-semibold border border-neutral-700/60 hover:border-cyan-700/60 hover:bg-gradient-to-br hover:from-cyan-950/40 hover:to-cyan-900/20 transition-all duration-300 shadow-lg hover:shadow-cyan-900/30 cursor-default">
              <svg className="w-4 h-4 text-cyan-400 group-hover/pill:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Encrypted
            </span>
            
            <span className="group/pill relative inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-neutral-800/60 to-neutral-900/60 rounded-full text-xs text-neutral-300 font-semibold border border-neutral-700/60 hover:border-cyan-700/60 hover:bg-gradient-to-br hover:from-cyan-950/40 hover:to-cyan-900/20 transition-all duration-300 shadow-lg hover:shadow-cyan-900/30 cursor-default">
              <svg className="w-4 h-4 text-cyan-400 group-hover/pill:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Auto-Destruct
            </span>
            
            <span className="group/pill relative inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-neutral-800/60 to-neutral-900/60 rounded-full text-xs text-neutral-300 font-semibold border border-neutral-700/60 hover:border-cyan-700/60 hover:bg-gradient-to-br hover:from-cyan-950/40 hover:to-cyan-900/20 transition-all duration-300 shadow-lg hover:shadow-cyan-900/30 cursor-default">
              <svg className="w-4 h-4 text-cyan-400 group-hover/pill:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
              No Trace
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* Premium Footer with Icons */}
    <div className="flex items-center justify-center gap-3 p-4 bg-neutral-900/40 border border-neutral-800/40 rounded-2xl backdrop-blur-sm">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-600/20 to-teal-600/20 flex items-center justify-center border border-cyan-700/30">
        <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>
      <p className="text-neutral-400 text-sm font-medium">
        Your privacy matters. <span className="text-cyan-400 font-semibold">Always.</span>
      </p>
    </div>
  </div>
</main>
  );
}
