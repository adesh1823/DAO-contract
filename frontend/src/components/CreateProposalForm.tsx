'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { VENTUREDAO_ADDRESS, VENTUREDAO_ABI } from '@/constants/abis'
import { parseEther } from 'viem'
import { useEthPrice } from '@/hooks/useEthPrice'
import { Loader2, UploadCloud, Rocket } from 'lucide-react'

export function CreateProposalForm({ onSuccess }: { onSuccess: () => void }) {
  const { address } = useAccount()
  const [fundingAmount, setFundingAmount] = useState('')
  const [valuation, setValuation] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  
  const [inputCurrency, setInputCurrency] = useState<'USD' | 'ETH'>('USD')
  const ethPrice = useEthPrice()
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisReport, setAnalysisReport] = useState<any>(null)

  const { data: hash, writeContract, error: writeError, isPending: isConfirmingInWallet } = useWriteContract()
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash })

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

  const handleAnalyzeAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address || !fundingAmount || !valuation || !description || !file) return

    setIsAnalyzing(true)
    try {
      // 1. Register startup on the Python backend
      const registerRes = await fetch(`${BACKEND_URL}/api/startups/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: description.slice(0, 50),
          domain: 'Blockchain/Web3',
          description,
          team: address,
        }),
      })
      if (!registerRes.ok) throw new Error('Failed to register startup')
      const startup = await registerRes.json()
      const startupId = startup.startup_id

      // 2. Upload the pitch PDF
      const formData = new FormData()
      formData.append('documents', file)
      const uploadRes = await fetch(`${BACKEND_URL}/api/startups/${startupId}/documents/upload`, {
        method: 'POST',
        body: formData,
      })
      if (!uploadRes.ok) throw new Error('Failed to upload pitch deck')

      // 3. Trigger analysis
      const analyzeRes = await fetch(`${BACKEND_URL}/api/startups/${startupId}/analyze`, {
        method: 'POST',
      })
      if (!analyzeRes.ok) throw new Error('Failed to start analysis')

      // 4. Poll for results (max 2 minutes)
      let report = null
      for (let i = 0; i < 24; i++) {
        await new Promise(r => setTimeout(r, 5000))
        const statusRes = await fetch(`${BACKEND_URL}/api/startups/${startupId}/report/status`)
        const statusData = await statusRes.json()
        if (statusData.status === 'complete' || statusData.status === 'completed') {
          report = statusData.analysis || statusData
          break
        }
        if (statusData.status === 'error' || statusData.status === 'failed') {
          throw new Error(statusData.error || 'Analysis failed')
        }
      }

      if (!report) throw new Error('Analysis timed out')

      setAnalysisReport(report)
    } catch (err) {
      console.error('Pitch analysis error:', err)
      alert(`Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}. Make sure the Python backend is running on port 3001.`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const confirmOnChain = () => {
    if (!ethPrice && inputCurrency === 'USD') {
      alert("Fetching ETH price, please wait...")
      return
    }

    const finalFundingEth = inputCurrency === 'USD' 
      ? (Number(fundingAmount) / ethPrice!).toFixed(18) 
      : fundingAmount
    const finalValuationEth = inputCurrency === 'USD' 
      ? (Number(valuation) / ethPrice!).toFixed(18) 
      : valuation

    writeContract({
      address: VENTUREDAO_ADDRESS,
      abi: VENTUREDAO_ABI,
      functionName: 'submitProposal',
      args: [address as `0x${string}`, parseEther(finalFundingEth), parseEther(finalValuationEth), description],
      chainId: 11155111,
    })
  }

  if (isSuccess) {
    onSuccess()
  }

  return (
    <div className="border border-[#111] bg-black">
      <div className="p-6 border-b border-[#111] bg-[#050505]">
        <h2 className="text-[10px] font-bold font-mono text-white uppercase tracking-widest flex items-center gap-2">
          <Rocket className="w-3.5 h-3.5 text-[#03e1ff]" /> Initialize Capital Stream
        </h2>
      </div>

      <div className="p-6">
        {!analysisReport ? (
          <form onSubmit={handleAnalyzeAndSubmit} className="space-y-6">
            <div className="flex justify-end mb-2">
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
            <div className="grid grid-cols-2 border border-[#111]">
              <div className="p-4 border-r border-[#111]">
                <label className="block text-[9px] font-bold text-sky-300 uppercase mb-2">Funding Goal ({inputCurrency})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 font-mono text-sm">{inputCurrency === 'USD' ? '$' : 'Ξ'}</span>
                  <input
                    type="number" step={inputCurrency === 'USD' ? "1" : "0.01"} min="0" required
                    value={fundingAmount} onChange={e => setFundingAmount(e.target.value)}
                    className="input-field h-10 pl-8"
                    placeholder="0"
                  />
                </div>
                {inputCurrency === 'USD' && ethPrice && fundingAmount && (
                  <p className="text-[10px] text-[#81d4fa] font-mono mt-2">≈ {(Number(fundingAmount) / ethPrice).toFixed(4)} <span className="text-[#81d4fa]/50">ETH</span></p>
                )}
                {inputCurrency === 'ETH' && ethPrice && fundingAmount && (
                  <p className="text-[10px] text-[#00ffbd] font-mono mt-2">≈ ${(Number(fundingAmount) * ethPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[#00ffbd]/50">USD</span></p>
                )}
              </div>
              <div className="p-4">
                <label className="block text-[9px] font-bold text-sky-300 uppercase mb-2">Valuation ({inputCurrency})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 font-mono text-sm">{inputCurrency === 'USD' ? '$' : 'Ξ'}</span>
                  <input
                    type="number" step={inputCurrency === 'USD' ? "1" : "0.01"} min="0" required
                    value={valuation} onChange={e => setValuation(e.target.value)}
                    className="input-field h-10 pl-8"
                    placeholder="0"
                  />
                </div>
                {inputCurrency === 'USD' && ethPrice && valuation && (
                  <p className="text-[10px] text-[#81d4fa] font-mono mt-2">≈ {(Number(valuation) / ethPrice).toFixed(4)} <span className="text-[#81d4fa]/50">ETH</span></p>
                )}
                {inputCurrency === 'ETH' && ethPrice && valuation && (
                  <p className="text-[10px] text-[#00ffbd] font-mono mt-2">≈ ${(Number(valuation) * ethPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[#00ffbd]/50">USD</span></p>
                )}
              </div>
            </div>
            
            <div className="border border-[#111] p-4">
              <label className="block text-[9px] font-bold text-sky-300 uppercase mb-2">Venture Description</label>
              <textarea
                required rows={3}
                value={description} onChange={e => setDescription(e.target.value)}
                className="input-field min-h-[80px] py-3 resize-none"
                placeholder="High-level operational summary..."
              />
            </div>

            <div className="border border-[#111] bg-black">
              <label className="block text-[9px] font-bold text-sky-300 uppercase p-4 border-b border-[#111]">Telemetry: Pitch Deck (PDF)</label>
              <div className="p-8 text-center relative group">
                <input 
                  type="file" accept=".pdf" required
                  onChange={e => setFile(e.target.files?.[0] ?? null)} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <UploadCloud className="w-6 h-6 text-sky-200 mx-auto mb-3 group-hover:text-[#03e1ff] transition-colors" />
                <p className="text-[9px] font-bold font-mono text-sky-300 uppercase tracking-tighter">
                  {file ? <span className="text-[#00ffbd]">{file.name}</span> : "Upload data package to initialize analysis"}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAnalyzing}
              className="btn-pro btn-pro-cyan w-full h-12"
            >
              {isAnalyzing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> SYNCHRONIZING WITH AI ENGINE...</>
              ) : (
                'ANALYZE & PREPARE ON-CHAIN DATA'
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="border border-[#00ffbd]/20 bg-[#00ffbd]/5 p-6 font-mono">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-bold text-[#00ffbd] uppercase tracking-widest">AI Audit: SYNTHESIS_COMPLETE</h3>
                <span className="text-xs text-white font-bold">{analysisReport.score}/10</span>
              </div>
              <p className="text-[10px] text-[#00ffbd]/70 uppercase leading-relaxed">
                {analysisReport.executiveSummary}
              </p>
            </div>

            <button
              onClick={confirmOnChain}
              disabled={isConfirmingInWallet || isMining || Number(fundingAmount) <= 0 || Number(valuation) <= 0}
              className="btn-pro btn-pro-cyan w-full h-12"
            >
              {isConfirmingInWallet ? 'INITIALIZING WALLET HANDSHAKE...' : isMining ? 'MINING DATA TO MAINNET...' : 'EXECUTE ON-CHAIN DEPLOYMENT'}
            </button>
            {writeError && <div className="text-red-500 font-mono text-[9px] uppercase mt-2">Error: {writeError.message}</div>}
          </div>
        )}
      </div>
    </div>
  )
}
