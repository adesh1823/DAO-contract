'use client'

import { useProposals } from '@/hooks/useProposals'
import Link from 'next/link'
import { formatEther } from 'viem'
import { ArrowRight, Loader2, CheckCircle, Clock, XCircle, Zap } from 'lucide-react'
import { StartupAvatar } from '@/components/StartupAvatar'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'

export function ProposalList({ filterFounder }: { filterFounder?: `0x${string}` }) {
  const { proposals, isLoading } = useProposals()

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-4">
        <Loader2 className="w-6 h-6 text-[#03e1ff] animate-spin" />
        <p className="text-[10px] font-bold font-mono text-sky-300 uppercase tracking-widest">Awaiting Chain Response...</p>
      </div>
    )
  }

  const filtered = filterFounder
    ? proposals.filter(p => p.founder.toLowerCase() === filterFounder.toLowerCase())
    : proposals

  if (filtered.length === 0) {
    return (
      <div className="border border-[#111] bg-[#050505] text-sky-300 text-[10px] font-bold font-mono p-12 text-center uppercase tracking-widest">
        <Zap className="w-8 h-8 text-sky-200 mx-auto mb-4" />
        No active data streams found
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {filtered.map((proposal) => {
        const now = Math.floor(Date.now() / 1000)
        const isEnded = Number(proposal.voteEnd) <= now
        const isPassed = proposal.forVotes > proposal.againstVotes

        let badgeColor = 'text-[#03e1ff]'
        let statusText = 'Active'
        
        if (proposal.executed) {
          badgeColor = 'text-[#00ffbd]'
          statusText = 'Executed'
        } else if (isEnded) {
          if (isPassed) {
            badgeColor = 'text-[#00ffbd]'
            statusText = 'Passed'
          } else {
            badgeColor = 'text-red-500'
            statusText = 'Rejected'
          }
        }

        const forVotesNum = Number(formatEther(proposal.forVotes))
        const againstVotesNum = Number(formatEther(proposal.againstVotes))
        const totalVotes = forVotesNum + againstVotesNum
        const forPercent = totalVotes > 0 ? (forVotesNum / totalVotes) * 100 : 0

        return (
          <div key={proposal.id} className="border-b border-l border-[#111] bg-black hover:bg-[#050505] transition-colors group flex flex-col md:flex-row items-stretch md:items-center py-4 px-6 gap-6 relative overflow-hidden">
            {/* Hover Indicator */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#03e1ff] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-4 min-w-[200px] flex-1">
              {/* Deterministic Generative Startup Avatar */}
              <StartupAvatar seed={proposal.id} size={32} />
              <div className="flex flex-col">
                <h3 className="text-xs font-bold text-white mb-0.5 truncate group-hover:text-[#03e1ff] transition-colors max-w-[180px]">{proposal.description}</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-bold font-mono tracking-[0.2em] uppercase ${badgeColor}`}>
                    {statusText}
                  </span>
                  <span className="text-sky-400 text-[8px] font-bold font-mono">/ ID-{proposal.id}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8 shrink-0">
              <div className="text-right">
                <p className="text-[8px] font-bold text-sky-300 uppercase tracking-widest mb-1">Funding</p>
                <CurrencyDisplay value={Number(formatEther(proposal.fundingAmount))} decimals={4} />
              </div>
              <div className="text-right">
                <p className="text-[8px] font-bold text-sky-300 uppercase tracking-widest mb-1">Valuation</p>
                <CurrencyDisplay value={Number(formatEther(proposal.valuation))} decimals={4} />
              </div>
            </div>

            <div className="flex-1 max-w-[200px] hidden lg:block shrink-0 px-4">
              <div className="text-center mb-1.5">
                <span className="text-[8px] font-bold font-mono text-sky-300 uppercase tracking-widest leading-none">Confidence</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[8px] font-bold font-mono text-[#00ffbd] uppercase w-8 text-left">{forPercent.toFixed(0)}%</span>
                <span className="text-[8px] font-bold font-mono text-red-500 uppercase w-8 text-right">{(100 - forPercent).toFixed(0)}%</span>
              </div>
              <div className="h-[2px] w-full bg-[#111] overflow-hidden relative">
                <div 
                  className="absolute inset-y-0 left-0 bg-[#00ffbd] transition-all duration-700 shadow-[0_0_10px_rgba(0,255,189,0.5)]"
                  style={{ width: `${forPercent}%` }}
                />
              </div>
            </div>

            <div className="shrink-0 ml-auto">
              <Link
                href={`/proposal/${proposal.id}`}
                className="flex items-center justify-center px-4 py-2 border border-[#111] group-hover:border-[#333] transition-all bg-[#050505] group-hover:bg-white/[0.03]"
              >
                <span className="text-[9px] font-bold font-mono text-sky-300 group-hover:text-white transition-colors tracking-widest uppercase mr-2.5">Inspect</span>
                <ArrowRight className="w-3 h-3 text-sky-400 group-hover:text-[#03e1ff] group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
