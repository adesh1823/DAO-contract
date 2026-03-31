import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Navbar } from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VentureDAO Platform',
  description: 'Decentralized Venture Funding Protocol',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#030303] text-gray-100 selection:bg-emerald-500/30`}>
        <Providers>
          <div className="relative flex flex-col min-h-screen">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 inset-x-0 h-[500px] pointer-events-none -translate-y-1/2 overflow-hidden opacity-30">
              <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-500/20 blur-[120px] rounded-full" />
            </div>
            
            <Navbar />
            <main className="flex-1 relative z-10 w-full">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
