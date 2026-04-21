'use client'

import { useState } from 'react'
import { useReadContract, useWriteContract, useAccount } from 'wagmi'
import { STARTUPCONTRACT_ABI } from '@/constants/abis'
import { formatEther, parseEther } from 'viem'
import { Loader2, Settings, Lock, Unlock, Copy, ExternalLink, ShieldCheck, Zap } from 'lucide-react'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'
import { useEthPrice } from '@/hooks/useEthPrice'

export function FounderStartupActions({ address, valuation: initialValuation }: { address: `0x${string}`, valuation: bigint }) {
  const { writeContract, isPending } = useWriteContract()

  // Read state
  const { data: currentValuation } = useReadContract({
    address, abi: STARTUPCONTRACT_ABI, functionName: 'valuation',
  })
  const { data: exitOpen } = useReadContract({
    address, abi: STARTUPCONTRACT_ABI, functionName: 'exitOpen',
  })
  const { data: exitValuation } = useReadContract({
    address, abi: STARTUPCONTRACT_ABI, functionName: 'exitValuation',
  })
  const { data: exitPool } = useReadContract({
    address, abi: STARTUPCONTRACT_ABI, functionName: 'exitPool',
  })
  const { data: startupTokenAddress } = useReadContract({
    address, abi: STARTUPCONTRACT_ABI, functionName: 'getStartupToken',
  })

  const [copied, setCopied] = useState<'contract' | 'token' | null>(null)

  const handleCopy = (text: string, type: 'contract' | 'token') => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const [inputValuation, setInputValuation] = useState('')
  const [inputPool, setInputPool] = useState('')
  const [inputCurrency, setInputCurrency] = useState<'USD' | 'ETH'>('USD')
  const ethPrice = useEthPrice()

  const handleOpenExit = () => {
    if (!ethPrice && inputCurrency === 'USD') {
      alert("Fetching ETH price, please wait...")
      return
    }

    if (!inputValuation || !inputPool) return
    const val = Number(inputValuation)
    const pool = Number(inputPool)
    if (isNaN(val) || val <= 0 || isNaN(pool) || pool <= 0) return

    const finalValuationEth = inputCurrency === 'USD' 
      ? (val / ethPrice!).toFixed(18) 
      : inputValuation
    const finalPoolEth = inputCurrency === 'USD' 
      ? (pool / ethPrice!).toFixed(18) 
      : inputPool

    writeContract({
      address,
      abi: STARTUPCONTRACT_ABI,
      functionName: 'openExit',
      args: [parseEther(finalValuationEth)],
      value: parseEther(finalPoolEth),
      chainId: 11155111,
    })
  }

  const handleCloseExit = () => {
    writeContract({
      address,
      abi: STARTUPCONTRACT_ABI,
      functionName: 'closeExit',
      chainId: 11155111,
    })
  }

  return (
    <div className="bg-[#050505] flex flex-col h-full border-r border-[#111]">
      <div className="h-[60px] p-6 border-b border-[#111] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Settings className="w-3.5 h-3.5 text-[#03e1ff]" />
          <h3 className="text-[10px] font-bold font-mono text-white uppercase tracking-widest">Founder Controls</h3>
        </div>
        <div className={`px-2 py-0.5 border text-[8px] font-bold font-mono uppercase tracking-tighter ${exitOpen ? 'bg-[#00ffbd]/5 text-[#00ffbd] border-[#00ffbd]/20' : 'bg-[#333]/5 text-sky-400 border-[#111]'}`}>
          {exitOpen ? 'Stream: Open' : 'Stream: Locked'}
        </div>
      </div>

      <div className="p-6 overflow-y-auto">
        <div className="space-y-px bg-[#111] border border-[#111] mb-6">
          <div className="bg-black p-3 flex items-center justify-between group">
            <div className="flex items-center gap-3 overflow-hidden">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-300" />
              <div className="overflow-hidden">
                <p className="text-[9px] text-sky-300 font-bold uppercase tracking-tight">Contract ID</p>
                <p className="font-mono text-[10px] text-white truncate">{address}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleCopy(address, 'contract')} className="p-1 hover:text-[#03e1ff] transition-colors text-sky-400">
                {copied === 'contract' ? <span className="text-[8px] text-[#00ffbd]">COPIED</span> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a href={`https://sepolia.etherscan.io/address/${address}`} target="_blank" rel="noreferrer" className="p-1 hover:text-[#03e1ff] transition-colors text-sky-400">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {startupTokenAddress && (
            <div className="bg-black p-3 flex items-center justify-between group">
              <div className="flex items-center gap-3 overflow-hidden">
                <Zap className="w-3.5 h-3.5 text-sky-300" />
                <div className="overflow-hidden">
                  <p className="text-[9px] text-sky-300 font-bold uppercase tracking-tight">Token ID</p>
                  <p className="font-mono text-[10px] text-white truncate">{startupTokenAddress as string}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleCopy(startupTokenAddress as string, 'token')} className="p-1 hover:text-[#03e1ff] transition-colors text-sky-400">
                  {copied === 'token' ? <span className="text-[8px] text-[#00ffbd]">COPIED</span> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a href={`https://sepolia.etherscan.io/address/${startupTokenAddress}`} target="_blank" rel="noreferrer" className="p-1 hover:text-[#03e1ff] transition-colors text-sky-400">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 border border-[#111]">
          <div className="p-4 border-r border-[#111] bg-black">
            <p className="text-[9px] font-bold text-sky-300 uppercase mb-2 tracking-wide">Target Valuation</p>
            <CurrencyDisplay value={Number(formatEther(currentValuation ? (currentValuation as bigint) : initialValuation))} />
          </div>
          <div className="p-4 border-r border-[#111] bg-black">
            <p className="text-[9px] font-bold text-sky-300 uppercase mb-2 tracking-wide">Exit Liquidity</p>
            <CurrencyDisplay value={Number(exitValuation ? formatEther(exitValuation as bigint) : '0')} />
          </div>
          <div className="p-4 bg-black">
            <p className="text-[9px] font-bold text-[#00ffbd] uppercase mb-2 tracking-wide">Remaining Liquidity</p>
            <CurrencyDisplay value={Number(exitPool ? formatEther(exitPool as bigint) : '0')} />
          </div>
        </div>
      </div>

      <div className="p-6 bg-[#030303] mt-auto border-t border-[#111]">
        {!exitOpen ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <div className="flex border border-[#111] bg-black rounded overflow-hidden p-0.5">
                <button
                  type="button"
                  onClick={() => setInputCurrency('USD')}
                  className={`px-3 py-1 text-[9px] font-bold tracking-widest transition-colors ${inputCurrency === 'USD' ? 'bg-[#03e1ff]/10 text-[#03e1ff]' : 'text-white/40 hover:text-white'}`}
                >
                  USD
                </button>
                <button
                  type="button"
                  onClick={() => setInputCurrency('ETH')}
                  className={`px-3 py-1 text-[9px] font-bold tracking-widest transition-colors ${inputCurrency === 'ETH' ? 'bg-[#00ffbd]/10 text-[#00ffbd]' : 'text-white/40 hover:text-white'}`}
                >
                  ETH
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[9px] font-bold text-sky-300 uppercase tracking-widest mb-2">New Exit Valuation ({inputCurrency})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 font-mono text-sm">{inputCurrency === 'USD' ? '$' : 'Ξ'}</span>
                  <input 
                    type="number" step={inputCurrency === 'USD' ? "1" : "0.0000001"} min="0"
                    value={inputValuation} onChange={e => setInputValuation(e.target.value)} 
                    className="input-field h-10 pl-8" placeholder="0" 
                  />
                </div>
                {inputCurrency === 'USD' && ethPrice && inputValuation && (
                  <p className="text-[10px] text-[#81d4fa] font-mono mt-1">≈ {(Number(inputValuation) / ethPrice).toFixed(4)} <span className="text-[#81d4fa]/50">ETH</span></p>
                )}
                {inputCurrency === 'ETH' && ethPrice && inputValuation && (
                  <p className="text-[10px] text-[#00ffbd] font-mono mt-1">≈ ${(Number(inputValuation) * ethPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[#00ffbd]/50">USD</span></p>
                )}
              </div>
              <div>
                <label className="block text-[9px] font-bold text-sky-300 uppercase tracking-widest mb-2">Deposit Liquidity ({inputCurrency})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 font-mono text-sm">{inputCurrency === 'USD' ? '$' : 'Ξ'}</span>
                  <input 
                    type="number" step={inputCurrency === 'USD' ? "1" : "0.0000001"} min="0"
                    value={inputPool} onChange={e => setInputPool(e.target.value)} 
                    className="input-field h-10 pl-8" placeholder="0" 
                  />
                </div>
                {inputCurrency === 'USD' && ethPrice && inputPool && (
                  <p className="text-[10px] text-[#81d4fa] font-mono mt-1">≈ {(Number(inputPool) / ethPrice).toFixed(4)} <span className="text-[#81d4fa]/50">ETH</span></p>
                )}
                {inputCurrency === 'ETH' && ethPrice && inputPool && (
                  <p className="text-[10px] text-[#00ffbd] font-mono mt-1">≈ ${(Number(inputPool) * ethPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[#00ffbd]/50">USD</span></p>
                )}
              </div>
            </div>
            <button 
              onClick={handleOpenExit} 
              disabled={isPending || !inputValuation || !inputPool || Number(inputValuation) <= 0 || Number(inputPool) <= 0} 
              className="btn-pro btn-pro-cyan w-full h-10"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Initialize Exit Window'}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-[10px] font-bold font-mono text-sky-400 uppercase mb-6 tracking-wide">Stream active. Subsidizing investor exits from the pool.</p>
            <button 
              onClick={handleCloseExit} 
              disabled={isPending} 
              className="btn-pro btn-pro-outline w-full h-10 border-red-900/20 text-red-500 hover:bg-red-500/5 hover:border-red-500/50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Terminate Exit Window'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
