'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Radio, Star, Coffee, Volume2, VolumeX, Loader2 } from 'lucide-react'
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

const TAG_LABELS: Record<string, string> = {
  point_1: 'Damga 1',
  point_2: 'Damga 2',
  point_3: 'Damga 3',
  point_4: 'Damga 4',
  point_5: 'Damga 5',
  redeem_tag: 'Ödül Damgası',
}

export default function LiveFeedPage() {
  const [events, setEvents] = useState<StampEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [flashReward, setFlashReward] = useState(false)
  const supabase = createClient()

  const playRewardSound = useCallback(() => {
    if (!soundEnabled) return
    try {
      const ctx = new AudioContext()
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.frequency.value = 880
      oscillator.type = 'sine'
      gain.gain.value = 0.3
      oscillator.start()
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      oscillator.stop(ctx.currentTime + 0.5)
    } catch {}
  }, [soundEnabled])

  useEffect(() => {
    let cleanup: (() => void) | undefined

    const fetchInitial = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('stamp_events')
        .select('*')
        .eq('business_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (data) setEvents(data)
      setLoading(false)

      // Realtime subscription
      const channel = supabase
        .channel('stamp-events-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'stamp_events',
            filter: `business_id=eq.${user.id}`,
          },
          (payload) => {
            const newEvent = payload.new as StampEvent
            setEvents(prev => [newEvent, ...prev].slice(0, 100))

            if (newEvent.is_reward) {
              playRewardSound()
              setFlashReward(true)
              setTimeout(() => setFlashReward(false), 3000)
            }
          }
        )
        .subscribe()

      cleanup = () => {
        supabase.removeChannel(channel)
      }
    }

    fetchInitial()

    return () => {
      if (cleanup) cleanup()
    }
  }, [supabase, playRewardSound])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#00f2fe] animate-spin" />
      </div>
    )
  }

  return (
    <div className={`space-y-6 transition-all duration-500 ${
      flashReward ? 'bg-amber-500/5 rounded-3xl p-4 -m-4' : ''
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-6 h-6 text-emerald-400" />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Canlı Akış</h1>
            <p className="text-zinc-500 text-sm">Kasa damga işlemleri anlık olarak görüntülenir</p>
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

      {/* Events List */}
      {events.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-zinc-800 bg-zinc-900/30">
          <Radio className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400">Henüz işlem yok</p>
          <p className="text-sm text-zinc-600 mt-1">Müşteriler kasadaki damgaları okuttuğunda burada görünecek</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event, index) => (
            <div
              key={event.id}
              className={`rounded-2xl border p-4 transition-all duration-500 ${
                event.is_reward
                  ? 'border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/5'
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  event.is_reward
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20'
                    : 'bg-[#00f2fe]/10'
                }`}>
                  {event.is_reward
                    ? <Coffee className="w-6 h-6 text-white" />
                    : <Star className="w-6 h-6 text-[#00f2fe]" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${
                    event.is_reward ? 'text-amber-300' : 'text-zinc-200'
                  }`}>
                    {event.is_reward
                      ? `☕ ${event.visitor_name || 'Anonim Müşteri'} Bedava Kahve Ödülünü Kasadan Teslim Aldı! 🚀`
                      : `🌟 ${event.visitor_name || 'Anonim Müşteri'}, ${TAG_LABELS[event.tag_type] || 'Kasa'}'dan ${event.stars_added > 0 ? `+${event.stars_added}` : ''} Yıldız Kazandı!`
                    }
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-zinc-500">
                      {formatDateTime(event.created_at)}
                    </span>
                    {!event.is_reward && (
                      <span className="text-xs text-zinc-600">
                        Güncel: {event.current_stars}/{event.target_stars}
                      </span>
                    )}
                  </div>
                </div>
                {event.is_reward && (
                  <div className="text-2xl animate-bounce">🎉</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
