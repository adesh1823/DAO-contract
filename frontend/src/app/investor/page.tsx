'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { InvestorActions } from '@/components/InvestorActions'
import { ProposalList } from '@/components/ProposalList'
import { useProposals } from '@/hooks/useProposals'
import { InvestorStartupActions } from '@/components/InvestorStartupActions'
import { AlertCircle, Wallet, Briefcase, Landmark } from 'lucide-react'

export default function InvestorDashboard() {
  const { address, isConnected } = useAccount()
  const { proposals } = useProposals()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  const fundedStartups = proposals.filter(p => p.executed)

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-12 border-b border-[#111] pb-8 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold text-white uppercase tracking-widest mb-2 font-mono">Operations: Investor Dashboard</h1>
          <p className="text-[10px] font-bold font-mono text-sky-300 uppercase tracking-[0.2em]">Acquire voting power, analyze data streams, and manage venture equity.</p>
        </div>
        <div className="hidden lg:block text-right">
          <p className="text-[9px] font-bold text-sky-300 uppercase mb-1">Session ID</p>
          <p className="text-[10px] font-mono text-white">{address?.slice(0, 16).toUpperCase()}...</p>
        </div>
      </div>

      {!isConnected ? (
        <div className="border border-[#111] border-dashed p-20 text-center bg-white/[0.01]">
          <h2 className="text-[10px] font-bold font-mono text-sky-400 uppercase tracking-[0.3em] mb-4">Signal Lost: Wallet Disconnected</h2>
          <p className="text-[9px] font-bold font-mono text-sky-200 uppercase tracking-widest">Connect MetaMask to initialize data synchronization</p>
        </div>
      ) : (
        <div className="space-y-16">
          {/* Active Data Streams */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-[#111] border border-[#111]">
            {/* Left Block: Treasury */}
            <div className="lg:col-span-4">
              <InvestorActions />
            </div>

            {/* Right Block: Proposals */}
            <div className="lg:col-span-8 bg-black">
              <div className="h-[60px] p-6 border-b border-[#111] bg-[#050505] flex justify-between items-center">
                <h2 className="text-[10px] font-bold font-mono text-white uppercase tracking-widest flex items-center gap-2">
                  <Landmark className="w-3.5 h-3.5 text-[#03e1ff]" /> Governance Stream
                </h2>
                <span className="text-[9px] font-bold font-mono text-sky-300 uppercase">{proposals.length} Sessions Active</span>
              </div>
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                <ProposalList />
              </div>
            </div>
          </div>

        </div>

      )}
    </div>
  )
}

function Rocket(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-5c1.62-2.2 5-3 5-3" />
      <path d="M12 15v5s3.03-.55 5-2c2.2-1.62 3-5 3-5" />
    </svg>
  )
}
