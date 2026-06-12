'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Radio, Star, Coffee, Volume2, VolumeX, Loader2, CheckCircle2, XCircle, Search } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface StampEvent {
  id: string
  business_id: string
  visitor_uuid: string
  visitor_name: string | null
  tag_type: string
  stars_added: number
  current_stars: number
  target_stars: number
  is_reward: boolean
  created_at: string
}

interface PendingTransaction {
  id: string
  visitor_name: string | null
  tag_type: string
  requested_stars: number
  status: string
  created_at: string
}

const TAG_LABELS: Record<string, string> = {
  point_1: '+1 Yıldız',
  point_2: '+2 Yıldız',
  point_3: '+3 Yıldız',
  point_4: '+4 Yıldız',
  point_5: '+5 Yıldız',
}

export default function LiveFeedPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<StampEvent[]>([])
  const [pendingTx, setPendingTx] = useState<PendingTransaction[]>([])
  
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [flashReward, setFlashReward] = useState(false)
  
  const [redeemCode, setRedeemCode] = useState('')
  const [validatingCode, setValidatingCode] = useState(false)
  const [codeMessage, setCodeMessage] = useState<{text: string, type: 'error'|'success'} | null>(null)

  const playSound = useCallback((type: 'reward' | 'notification') => {
    if (!soundEnabled) return
    try {
      const ctx = new AudioContext()
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      
      if (type === 'reward') {
        oscillator.frequency.value = 880
        oscillator.type = 'sine'
        gain.gain.value = 0.3
        oscillator.start()
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        oscillator.stop(ctx.currentTime + 0.5)
      } else {
        oscillator.frequency.value = 440
        oscillator.type = 'triangle'
        gain.gain.value = 0.2
        oscillator.start()
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
        oscillator.stop(ctx.currentTime + 0.3)
      }
    } catch {}
  }, [soundEnabled])

  useEffect(() => {
    let channels: any[] = []

    const fetchInitial = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch history
      const { data: historyData } = await supabase
        .from('stamp_events')
        .select('*')
        .eq('business_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (historyData) setEvents(historyData)

      // Fetch pending
      const { data: pendingData } = await supabase
        .from('pending_transactions')
        .select('*')
        .eq('business_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      if (pendingData) setPendingTx(pendingData)

      setLoading(false)

      // Realtime subscription for history
      const historyChannel = supabase
        .channel('stamp-events-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'stamp_events', filter: `business_id=eq.${user.id}` },
          (payload) => {
            const newEvent = payload.new as StampEvent
            setEvents(prev => [newEvent, ...prev].slice(0, 100))
            if (newEvent.is_reward) {
              playSound('reward')
              setFlashReward(true)
              setTimeout(() => setFlashReward(false), 3000)
            }
          }
        )
        .subscribe()

      // Realtime subscription for pending
      const pendingChannel = supabase
        .channel('pending-tx-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'pending_transactions', filter: `business_id=eq.${user.id}` },
          (payload) => {
            const newTx = payload.new as PendingTransaction
            if (newTx.status === 'pending') {
              setPendingTx(prev => [...prev, newTx])
              playSound('notification')
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'pending_transactions', filter: `business_id=eq.${user.id}` },
          (payload) => {
            const updatedTx = payload.new as PendingTransaction
            if (updatedTx.status !== 'pending') {
              setPendingTx(prev => prev.filter(tx => tx.id !== updatedTx.id))
            }
          }
        )
        .subscribe()

      channels = [historyChannel, pendingChannel]
    }

    fetchInitial()

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch))
    }
  }, [supabase, playSound])

  const handleApprove = async (txId: string) => {
    try {
      await fetch('/api/transactions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: txId })
      })
      // UI will update via realtime
    } catch (err) {
      console.error(err)
    }
  }

  const handleReject = async (txId: string) => {
    try {
      await fetch('/api/transactions/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: txId })
      })
      // UI will update via realtime
    } catch (err) {
      console.error(err)
    }
  }

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (redeemCode.length !== 4) return
    
    setValidatingCode(true)
    setCodeMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const res = await fetch('/api/redeem/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: user?.id, code: redeemCode })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setCodeMessage({ text: `Ödül onaylandı! (${data.visitor_name})`, type: 'success' })
        setRedeemCode('')
      } else {
        setCodeMessage({ text: data.error || 'Geçersiz kod', type: 'error' })
      }
    } catch (err) {
      setCodeMessage({ text: 'Bir hata oluştu', type: 'error' })
    } finally {
      setValidatingCode(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#00f2fe] animate-spin" />
      </div>
    )
  }

  return (
    <div className={`space-y-6 transition-all duration-500 ${flashReward ? 'bg-amber-500/5 rounded-3xl p-4 -m-4' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-6 h-6 text-emerald-400" />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Kasiyer Ekranı</h1>
            <p className="text-zinc-500 text-sm">Bekleyen işlemleri onaylayın ve ödül kodlarını girin.</p>
          </div>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2.5 rounded-xl border transition-all ${
            soundEnabled
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-zinc-800 bg-zinc-900 text-zinc-500'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Pending & Action */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Pending Transactions */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
              Onay Bekleyenler ({pendingTx.length})
            </h2>
            
            {pendingTx.length === 0 ? (
              <div className="text-center py-10 bg-zinc-950/50 rounded-xl border border-dashed border-zinc-800">
                <p className="text-zinc-500">Şu an bekleyen işlem yok</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTx.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
                    <div>
                      <p className="text-white font-medium">{tx.visitor_name || 'Anonim Müşteri'}</p>
                      <p className="text-sm text-zinc-400">{TAG_LABELS[tx.tag_type] || `+${tx.requested_stars} Yıldız`}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleReject(tx.id)} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <XCircle className="w-6 h-6" />
                      </button>
                      <button onClick={() => handleApprove(tx.id)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Onayla
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History Feed */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
             <h2 className="text-lg font-semibold text-white mb-4">Geçmiş İşlemler</h2>
             {events.length === 0 ? (
              <p className="text-zinc-500 text-sm">İşlem geçmişi boş.</p>
             ) : (
               <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {events.map((event) => (
                  <div key={event.id} className={`rounded-xl border p-3 flex items-center gap-4 ${event.is_reward ? 'border-amber-500/30 bg-amber-500/5' : 'border-zinc-800 bg-zinc-950'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${event.is_reward ? 'bg-amber-500/20' : 'bg-zinc-800'}`}>
                      {event.is_reward ? <Coffee className="w-5 h-5 text-amber-500" /> : <Star className="w-5 h-5 text-yellow-500" />}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${event.is_reward ? 'text-amber-300' : 'text-zinc-200'}`}>
                        {event.visitor_name || 'Müşteri'} {event.is_reward ? 'Ödülünü Aldı' : `+${event.stars_added} Yıldız Kazandı`}
                      </p>
                      <p className="text-xs text-zinc-500">{formatDateTime(event.created_at)}</p>
                    </div>
                  </div>
                ))}
               </div>
             )}
          </div>

        </div>

        {/* Right Column: Redeem Code Input */}
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-amber-500/10 to-zinc-900 border border-amber-500/20 rounded-2xl p-6">
             <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4">
               <Coffee className="w-6 h-6 text-amber-500" />
             </div>
             <h2 className="text-xl font-bold text-white mb-2">Ödül Ver</h2>
             <p className="text-zinc-400 text-sm mb-6">Müşterinin telefonunda ürettiği 4 haneli kodu girerek ödülünü teslim edin.</p>
             
             <form onSubmit={handleValidateCode} className="space-y-4">
               <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                 <input 
                   type="text" 
                   maxLength={4}
                   placeholder="Örn: 4928"
                   value={redeemCode}
                   onChange={e => setRedeemCode(e.target.value.replace(/[^0-9]/g, ''))}
                   className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white text-2xl tracking-[0.5em] focus:outline-none focus:border-amber-500 transition-colors"
                 />
               </div>
               <button 
                 type="submit" 
                 disabled={redeemCode.length !== 4 || validatingCode}
                 className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center"
               >
                 {validatingCode ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Kodu Doğrula'}
               </button>
             </form>

             {codeMessage && (
               <div className={`mt-4 p-3 rounded-lg text-sm flex items-start gap-2 ${codeMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                 {codeMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                 {codeMessage.text}
               </div>
             )}
          </div>
        </div>

      </div>
    </div>
  )
}
