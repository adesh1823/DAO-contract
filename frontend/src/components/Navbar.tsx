<<<<<<< HEAD
import Link from 'next/link'
import { ConnectButton } from './ConnectButton'
import { Diamond } from 'lucide-react'

export function Navbar() {
  return (
    <nav className="border-b border-[#111] bg-black sticky top-0 z-50 h-14">
=======
'use client'

import Link from 'next/link'
import { ConnectButton } from './ConnectButton'
import { Diamond } from 'lucide-react'
import { motion } from 'framer-motion'

export function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50 h-14 shadow-lg"
    >
>>>>>>> 28bd269 (f1)
      <div className="max-w-full mx-auto h-full">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center h-full">
            <Link href="/" className="flex items-center gap-2 px-6 border-r border-[#111] h-full hover:bg-white/[0.02] transition-colors group">
              <Diamond className="w-4 h-4 text-[#03e1ff] group-hover:drop-shadow-[0_0_8px_rgba(3,225,255,0.5)] transition-all" />
              <span className="text-xs font-bold font-mono tracking-tighter text-white uppercase">
                Venture.DAO
              </span>
            </Link>
            <div className="hidden md:flex items-center h-full">
              <Link href="/investor" className="flex items-center px-6 h-full border-r border-[#111] text-[10px] font-bold font-mono text-sky-200 hover:text-[#03e1ff] uppercase tracking-wider transition-colors">
                Investor Dash
              </Link>
              <Link href="/founder" className="flex items-center px-6 h-full border-r border-[#111] text-[10px] font-bold font-mono text-sky-200 hover:text-[#03e1ff] uppercase tracking-wider transition-colors">
                Founder Portal
              </Link>
              <Link href="/portfolio" className="flex items-center px-6 h-full border-r border-[#111] text-[10px] font-bold font-mono text-sky-200 hover:text-[#00ffbd] uppercase tracking-wider transition-colors">
                Portfolio
              </Link>
              <Link href="/exit-window" className="flex items-center px-6 h-full border-r border-[#111] text-[10px] font-bold font-mono text-sky-200 hover:text-[#00ffbd] uppercase tracking-wider transition-colors">
                Exit Window
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4 px-6">
            <div className="hidden lg:flex items-center gap-3 mr-4">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#080808] border border-[#111]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ffbd] animate-pulse" />
                <span className="text-[9px] font-mono text-sky-300 font-bold uppercase">Sepolia Live</span>
              </div>
            </div>
            <ConnectButton />
          </div>
        </div>
      </div>
<<<<<<< HEAD
    </nav>
=======
    </motion.nav>
>>>>>>> 28bd269 (f1)
  )
}
