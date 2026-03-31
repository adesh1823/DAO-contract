'use client'

import Link from 'next/link'
import { ArrowRight, ShieldCheck, Zap, TrendingUp } from 'lucide-react'
import { StatsBar } from '@/components/StatsBar'
import { useProposals } from '@/hooks/useProposals'
import { useBalance } from 'wagmi'
import { VENTUREDAO_ADDRESS } from '@/constants/abis'
import { formatEther } from 'viem'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'

export default function LandingPage() {
  const { proposals, isLoading: isLoadingProposals } = useProposals()
  const { data: balanceData, isLoading: isLoadingBalance } = useBalance({
    address: VENTUREDAO_ADDRESS,
  })

  // Calculate live metrics
  const activeStreams = proposals.filter(p => !p.executed && Number(p.voteEnd) > Math.floor(Date.now() / 1000)).length
  const tvl = balanceData ? Number(formatEther(balanceData.value)).toFixed(4) : '0.0000'
  return (
    <div className="flex flex-col min-h-screen bg-black overflow-hidden selection:bg-[#03e1ff] selection:text-black">
      {/* High-fidelity Neon Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#03e1ff]/[0.05] via-[#000] to-[#000]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_30%,transparent_100%)]" />
      </div>

      {/* Floating Kinetic Geometry */}
      <div className="fixed top-[20%] right-[10%] w-[500px] h-[500px] bg-[#03e1ff]/[0.02] rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="fixed bottom-[10%] left-[5%] w-[400px] h-[400px] bg-[#00ffbd]/[0.02] rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-24 relative z-10 flex flex-col justify-center min-h-[calc(100vh-80px)]">
        
        {/* Asymmetric Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative">
          
          {/* Left Hero Block */}
          <div className="lg:col-span-7 relative z-20">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/[0.03] border border-white/[0.05] backdrop-blur-md shadow-[0_0_30px_rgba(3,225,255,0.05)] rounded-sm mb-12">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#03e1ff] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#03e1ff]"></span>
              </span>
              <span className="text-[10px] font-bold font-mono text-white tracking-[0.2em] uppercase">V-DAO // SYNAPSE ACTIVE</span>
            </div>
            
            <h1 className="text-6xl md:text-[5.5rem] font-black text-white leading-[0.9] tracking-tighter uppercase mb-8 relative">
              <span className="relative z-10 block">Venture</span>
              <span className="relative z-10 block text-transparent bg-clip-text bg-gradient-to-r from-[#03e1ff] to-[#00ffbd] drop-shadow-[0_0_20px_rgba(3,225,255,0.3)]">
                Syndicate
              </span>
              <div className="absolute top-0 left-[-40px] w-1 h-full bg-gradient-to-b from-[#03e1ff] via-[#00ffbd] to-transparent" />
            </h1>

            <p className="text-sm md:text-base font-mono text-sky-400 uppercase tracking-widest leading-relaxed max-w-xl mb-12 border-l border-white/[0.1] pl-6 py-2">
              The apex architecture for decentralized capital. Unrestricted liquidity flows. High-frequency governance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/investor"
                className="group relative px-8 py-5 bg-white/[0.03] backdrop-blur-md border border-white/[0.1] hover:border-[#03e1ff]/50 transition-all overflow-hidden flex items-center justify-between min-w-[260px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#03e1ff]/20 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                <div className="relative z-10 flex flex-col">
                  <span className="text-[9px] font-bold font-mono text-sky-400 group-hover:text-[#03e1ff] transition-colors uppercase mb-1">Engage Capital</span>
                  <span className="text-sm font-bold text-white tracking-widest uppercase">Investor Nexus</span>
                </div>
                <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 group-hover:text-[#03e1ff] transition-all relative z-10" />
              </Link>

              <Link
                href="/founder"
                className="group relative px-8 py-5 bg-white/[0.03] backdrop-blur-md border border-white/[0.1] hover:border-[#00ffbd]/50 transition-all overflow-hidden flex items-center justify-between min-w-[260px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#00ffbd]/20 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                <div className="relative z-10 flex flex-col">
                  <span className="text-[9px] font-bold font-mono text-sky-400 group-hover:text-[#00ffbd] transition-colors uppercase mb-1">Initialize Stream</span>
                  <span className="text-sm font-bold text-white tracking-widest uppercase">Founder Forge</span>
                </div>
                <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 group-hover:text-[#00ffbd] transition-all relative z-10" />
              </Link>
            </div>
          </div>

          {/* Right Floating Display Panel */}
          <div className="lg:col-span-5 relative z-10 lg:pl-10 hidden lg:block perspective-1000">
             {/* 3D Glassmorphism Panel */}
             <div className="relative transform-gpu hover:rotate-y-[-5deg] hover:rotate-x-[5deg] transition-transform duration-700">
               <div className="absolute inset-0 bg-gradient-to-br from-[#03e1ff]/10 to-[#00ffbd]/10 blur-2xl" />
               <div className="relative bg-black/[0.6] backdrop-blur-xl border border-white/[0.1] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                 
                 {/* Internal Panel Header */}
                 <div className="flex justify-between items-center border-b border-white/[0.1] pb-6 mb-8">
                   <div className="flex items-center gap-3">
                     <div className="w-3 h-3 bg-[#03e1ff] animate-pulse rounded-sm" />
                     <span className="font-mono text-[10px] text-white font-bold tracking-[0.3em] uppercase">Network Status</span>
                   </div>
                   <span className="font-mono text-[10px] text-sky-400 uppercase">
                     {isLoadingProposals || isLoadingBalance ? 'SYNCING...' : 'SYS_OK'}
                   </span>
                 </div>

                 {/* Metric Rows */}
                 <div className="space-y-8">
                   <div>
                     <p className="text-[9px] font-mono text-sky-200 uppercase tracking-widest mb-2 border-l-2 border-[#111] pl-3">Total Value Locked</p>
                     <div className="flex items-end gap-2 pl-3">
                       <CurrencyDisplay value={Number(isLoadingBalance ? 0 : tvl)} decimals={4} featured={true} />
                     </div>
                   </div>
                   <div>
                     <p className="text-[9px] font-mono text-sky-200 uppercase tracking-widest mb-2 border-l-2 border-[#111] pl-3">Active Data Streams</p>
                     <div className="flex items-end gap-2 pl-3">
                       <span className="text-2xl font-light text-white font-mono tracking-tighter">
                         {isLoadingProposals ? '--' : activeStreams}
                       </span>
                       <span className="text-xs text-sky-400 font-mono mb-1 uppercase tracking-widest">Syndicates</span>
                     </div>
                   </div>
                 </div>

                 {/* Geometric Accent */}
                 <div className="mt-12 pt-6 border-t border-white/[0.05] flex justify-between items-center">
                    <svg width="40" height="12" viewBox="0 0 40 12" fill="none">
                      <rect width="12" height="12" fill="url(#paint0_linear)"/>
                      <rect x="14" width="12" height="12" fill="#111"/>
                      <rect x="28" width="12" height="12" fill="#111"/>
                      <defs>
                        <linearGradient id="paint0_linear" x1="0" y1="0" x2="12" y2="12" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#03e1ff"/>
                          <stop offset="1" stopColor="#00ffbd"/>
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="text-[8px] font-mono text-sky-400 tracking-[0.5em]">TENSOR.ARCH</span>
                 </div>

               </div>
               
               {/* Decorative border frames */}
               <div className="absolute -inset-0.5 border border-white/[0.05] pointer-events-none transform translate-x-2 -translate-y-2" />
               <div className="absolute -inset-1 border border-white/[0.02] pointer-events-none transform translate-x-4 -translate-y-4" />
             </div>
          </div>
        </div>
      </main>

      {/* Floating Bottom Ticker / Stats */}
      <div className="border-t border-white/[0.05] bg-black/[0.8] backdrop-blur-md relative z-20">
        <StatsBar />
      </div>

    </div>
  )
}
