'use client'

import { useEffect, useState, useRef } from 'react'
import { Loader2, Star, Coffee, AlertCircle, Wallet, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface LoyaltyCard {
  id: string
  business_id: string
  current_stars: number
  profiles: {
    business_name: string
    target_stars_for_reward: number
  }
}

export default function WalletPage() {
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<LoyaltyCard[]>([])
  const [error, setError] = useState<string | null>(null)

  // Redeem state
  const [activeCode, setActiveCode] = useState<string | null>(null)
  const [codeCountdown, setCodeCountdown] = useState<number>(0)
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchWallet = async () => {
      let visitorUuid = localStorage.getItem('refly_visitor_uuid')
      if (!visitorUuid) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/loyalty/wallet?visitor_uuid=${visitorUuid}`)
        const data = await res.json()
        if (data.success) {
          setCards(data.cards)
        } else {
          setError(data.error)
        }
      } catch (err) {
        setError('Cüzdan yüklenemedi.')
      } finally {
        setLoading(false)
      }
    }

    fetchWallet()

    // Listen for code usage
    let visitorUuid = localStorage.getItem('refly_visitor_uuid')
    if (visitorUuid) {
      const channel = supabase
        .channel('wallet-realtime')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'redeem_codes', filter: `visitor_uuid=eq.${visitorUuid}` },
          (payload) => {
            const codeRow = payload.new
            if (codeRow.status === 'used') {
              setActiveCode(null)
              setCodeCountdown(0)
              if (timerRef.current) clearInterval(timerRef.current)
              // Refresh wallet
              fetchWallet()
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase])

  const handleGenerateCode = async (businessId: string) => {
    const visitorUuid = localStorage.getItem('refly_visitor_uuid')
    if (!visitorUuid) return

    setGeneratingFor(businessId)
    try {
      const res = await fetch('/api/redeem/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, visitor_uuid: visitorUuid })
      })
      const data = await res.json()

      if (data.success) {
        setActiveCode(data.code)
        
        // Calculate diff in seconds
        const expiresAt = new Date(data.expires_at).getTime()
        const now = new Date().getTime()
        const diff = Math.floor((expiresAt - now) / 1000)
        
        setCodeCountdown(Math.max(0, diff))

        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(() => {
          setCodeCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current!)
              setActiveCode(null)
              return 0
            }
            return prev - 1
          })
        }, 1000)

      } else {
        alert(data.error)
      }
    } catch (err) {
      alert('Kod üretilemedi.')
    } finally {
      setGeneratingFor(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-12 h-12 text-[#00f2fe] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00f2fe] to-[#4facfe] flex items-center justify-center shadow-lg shadow-[#00f2fe]/20">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Yıldız Cüzdanım</h1>
            <p className="text-zinc-400 text-sm">Topladığınız yıldızlar ve ödülleriniz</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {cards.length === 0 && !error ? (
          <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800">
            <Star className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-white mb-2">Henüz Kartınız Yok</h2>
            <p className="text-zinc-400 text-sm">Bir işletmeden damga aldığınızda burada görünecektir.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cards.map(card => {
              const target = card.profiles.target_stars_for_reward || 8
              const progress = Math.min((card.current_stars / target) * 100, 100)
              const isEligible = card.current_stars >= target

              return (
                <div key={card.id} className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-6 overflow-hidden">
                  
                  {/* Progress Background */}
                  <div 
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                    
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-950 flex items-center justify-center border border-zinc-800">
                        {isEligible ? (
                          <Coffee className="w-8 h-8 text-amber-400" />
                        ) : (
                          <Star className="w-8 h-8 text-[#00f2fe]" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{card.profiles.business_name}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isEligible ? 'text-amber-400' : 'text-[#00f2fe]'}`}>{card.current_stars}</span>
                          <span className="text-zinc-500">/ {target} Yıldız</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Area */}
                    {activeCode && generatingFor === card.business_id ? (
                      <div className="text-center w-full sm:w-auto bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                        <p className="text-amber-400 font-mono text-3xl tracking-[0.2em] font-bold mb-1">{activeCode}</p>
                        <p className="text-zinc-400 text-xs">Kasiyere bu kodu gösterin ({codeCountdown}sn)</p>
                      </div>
                    ) : isEligible ? (
                      <button 
                        onClick={() => handleGenerateCode(card.business_id)}
                        disabled={generatingFor !== null}
                        className="w-full sm:w-auto px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        {generatingFor === card.business_id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Coffee className="w-5 h-5" />}
                        Ödülü Kullan
                      </button>
                    ) : (
                      <div className="w-full sm:w-auto px-6 py-4 bg-zinc-950 border border-zinc-800 text-zinc-500 font-medium rounded-2xl text-center">
                        {target - card.current_stars} Yıldız Kaldı
                      </div>
                    )}
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
