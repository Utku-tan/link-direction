'use client'

import { useEffect, useState, useRef, use } from 'react'
import { Phone, CheckCircle2, AlertCircle, Loader2, Star, ShieldCheck, XCircle } from 'lucide-react'
import { generateFingerprint } from '@/lib/fingerprint'
import { createClient } from '@/lib/supabase/client'

const TAG_LABELS: Record<string, string> = {
  point_1: '+1 Yıldız',
  point_2: '+2 Yıldız',
  point_3: '+3 Yıldız',
  point_4: '+4 Yıldız',
  point_5: '+5 Yıldız',
}

export default function StampPage({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = use(params)
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // V5 Durumları
  const [isPending, setIsPending] = useState(false)
  const [isRejected, setIsRejected] = useState(false)
  const [transactionId, setTransactionId] = useState<string | null>(null)

  const [stars, setStars] = useState(0)
  const [starsAdded, setStarsAdded] = useState(0)
  const [targetStars, setTargetStars] = useState(8)
  const [businessName, setBusinessName] = useState('İşletme')
  const [targetUrl, setTargetUrl] = useState('/')
  const [tagType, setTagType] = useState('point_1')
  const [isDuplicate, setIsDuplicate] = useState(false)

  // Yedekleme (Registration) State
  const [isBackedUp, setIsBackedUp] = useState(true)
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [backupSuccess, setBackupSuccess] = useState(false)
  const [backupError, setBackupError] = useState('')
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoverPhone, setRecoverPhone] = useState('')
  const [recoverMessage, setRecoverMessage] = useState('')

  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [countdown, setCountdown] = useState(8)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const hasProcessedRef = useRef(false)

  useEffect(() => {
    if (hasProcessedRef.current) return
    hasProcessedRef.current = true

    let visitorUuid = localStorage.getItem('refly_visitor_uuid')
    if (!visitorUuid) {
      visitorUuid = crypto.randomUUID()
      localStorage.setItem('refly_visitor_uuid', visitorUuid)
    }

    const fingerprint = generateFingerprint()

    const processStamp = async () => {
      try {
        const res = await fetch('/api/stamp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serial, visitor_uuid: visitorUuid, fingerprint })
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Bir hata oluştu')
        }

        if (data.is_redirect) {
          window.location.href = data.target_url || '/'
          return
        }

        if (data.is_duplicate) {
          setIsDuplicate(true)
          setLoading(false)
          startRedirectTimer(data.target_url || '/')
          return
        }

        setStars(data.current_stars)
        setTargetStars(data.target_stars)
        setBusinessName(data.business_name || 'İşletme')
        setTargetUrl(data.target_url || '/')
        setTagType(data.tag_type)
        setIsBackedUp(data.is_backed_up)
        
        // requested stars from tag_type
        const requestedStars = parseInt(data.tag_type.split('_')[1] || '1')
        setStarsAdded(requestedStars)

        if (data.status === 'pending') {
          setTransactionId(data.transaction_id)
          setIsPending(true)
        }
        
        setLoading(false)
      } catch (err: any) {
        setError(err.message)
        setLoading(false)
      }
    }

    processStamp()

    return () => {
      clearRedirectTimer()
    }
  }, [serial])

  // Realtime subscription for pending transaction
  useEffect(() => {
    if (!transactionId || !isPending) return

    const channel = supabase
      .channel(`transaction_${transactionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pending_transactions',
          filter: `id=eq.${transactionId}`,
        },
        (payload) => {
          const newStatus = payload.new.status
          if (newStatus === 'approved') {
            setIsPending(false)
            setStars(prev => prev + starsAdded)
            startRedirectTimer(targetUrl)
          } else if (newStatus === 'rejected') {
            setIsPending(false)
            setIsRejected(true)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [transactionId, isPending, starsAdded, targetUrl, supabase])

  const startRedirectTimer = (url: string) => {
    clearRedirectTimer()
    setCountdown(8)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    redirectTimerRef.current = setTimeout(() => {
      window.location.href = url
    }, 8000)
  }

  const clearRedirectTimer = () => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current)
      redirectTimerRef.current = null
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }

  const handleBackup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) {
      setBackupError('Lütfen telefon numaranızı girin.')
      return
    }

    const visitorUuid = localStorage.getItem('refly_visitor_uuid')
    try {
      const res = await fetch('/api/loyalty/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_uuid: visitorUuid, phone, username })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setBackupSuccess(true)
        setRecoverMessage(data.message || 'Yıldızlarınız başarıyla kaydedildi.')
      } else {
        setBackupError(data.error || 'Kayıt başarısız.')
      }
    } catch {
      setBackupError('Bir hata oluştu.')
    }
  }

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recoverPhone) {
      setRecoverMessage('Telefon numarası gerekli.')
      return
    }
    const fingerprint = generateFingerprint()
    const visitorUuid = localStorage.getItem('refly_visitor_uuid')
    try {
      const res = await fetch('/api/loyalty/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: recoverPhone, new_visitor_uuid: visitorUuid, fingerprint })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setBackupSuccess(true)
        setRecoverMessage('Yıldızlarınız başarıyla geri yüklendi!')
      } else {
        setRecoverMessage(data.error || 'Kurtarma başarısız.')
      }
    } catch {
      setRecoverMessage('Bir hata oluştu.')
    }
  }

  // Progress ring calculation
  const currentTotalStars = isPending ? stars : stars
  const progress = Math.min(currentTotalStars / targetStars, 1)
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-12 h-12 text-[#00f2fe] animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Hata Oluştu</h1>
          <p className="text-zinc-400 mb-6">{error}</p>
          <a href="/" className="px-6 py-2 bg-zinc-800 text-white rounded-lg">Ana Sayfa</a>
        </div>
      </div>
    )
  }

  if (isDuplicate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 text-center">
         <div>
          <Loader2 className="w-12 h-12 text-[#00f2fe] animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">İşlem zaten devam ediyor, yönlendiriliyorsunuz...</p>
         </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
      {/* Background effects */}
      {isPending ? (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500 rounded-full blur-[150px] opacity-10 pointer-events-none animate-pulse" />
      ) : isRejected ? (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500 rounded-full blur-[150px] opacity-10 pointer-events-none" />
      ) : (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00f2fe] rounded-full blur-[150px] opacity-15 pointer-events-none" />
      )}

      <div className="z-10 w-full max-w-md text-center space-y-6">

        {/* === BEKLEME EKRANI === */}
        {isPending && (
          <div className="animate-in fade-in duration-700 flex flex-col items-center">
            <div className="relative mb-8">
              <div className="w-32 h-32 rounded-full border-4 border-zinc-800 flex items-center justify-center">
                <ShieldCheck className="w-12 h-12 text-yellow-500 animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full border-t-4 border-yellow-500 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Kasiyer Onayı Bekleniyor...</h1>
            <p className="text-zinc-400 text-sm mb-6">
              Lütfen ekranınızı kapatmayın. Kasiyer işlemi onayladığında yıldızınız yüklenecektir.
            </p>
          </div>
        )}

        {/* === REDDEDİLME EKRANI === */}
        {isRejected && (
          <div className="animate-in fade-in duration-700 flex flex-col items-center">
             <div className="mb-6">
               <XCircle className="w-24 h-24 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
             </div>
             <h1 className="text-2xl font-bold text-white mb-2">İşlem Reddedildi</h1>
             <p className="text-zinc-400 text-sm mb-6">Kasiyer bu yıldız talebini onaylamadı.</p>
             <a href={targetUrl} className="px-6 py-2 bg-zinc-800 text-white rounded-lg">Menüye Dön</a>
          </div>
        )}

        {/* === ONAY VE KAZANMA EKRANI === */}
        {!isPending && !isRejected && !error && (
          <div className="animate-in fade-in zoom-in duration-700">
            {/* Progress Ring */}
            <div className="relative inline-block mb-8">
              <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
                <circle cx="100" cy="100" r={radius} fill="none" stroke="#27272a" strokeWidth="8" />
                <circle
                  cx="100" cy="100" r={radius} fill="none"
                  stroke="url(#progressGradient2)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1500 ease-out"
                />
                <defs>
                  <linearGradient id="progressGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00f2fe" />
                    <stop offset="100%" stopColor="#4facfe" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Star className="w-10 h-10 text-yellow-400 fill-yellow-400 mb-1 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]" />
                <span className="text-3xl font-bold text-white">{stars}</span>
                <span className="text-xs text-zinc-500">/ {targetStars} Yıldız</span>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">Tebrikler! 🌟</h1>
            <p className="text-[#00f2fe] font-semibold text-xl mb-2">
              Kasiyer Onayladı: {TAG_LABELS[tagType] || `+${starsAdded} Yıldız`} Kazandınız!
            </p>
            <p className="text-zinc-400 text-sm mb-8">
              {businessName} • {stars}/{targetStars} Yıldız
              {stars >= targetStars && ' • 🎉 Ödül almaya hak kazandınız!'}
            </p>

            {/* YEDEKLEME FORMU */}
            {!backupSuccess && !isRecovering && !isBackedUp && (
              <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 text-left mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-zinc-300 text-sm leading-relaxed">
                    <strong className="text-white">Yıldızlarını güvenceye al!</strong> Telefonunu değiştirirsen yıldızların kaybolabilir. İsmini ve numaranı girerek buluta yedekle.
                  </p>
                </div>
                <form onSubmit={handleBackup} className="space-y-3">
                  <input
                    type="text"
                    placeholder="İsminiz (Opsiyonel)"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-[#00f2fe] transition-colors"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={clearRedirectTimer}
                  />
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type="tel"
                      placeholder="Telefon Numaranız (5XX...)"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#00f2fe] transition-colors"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onFocus={clearRedirectTimer}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-white font-medium py-3 rounded-xl hover:opacity-90 transition-opacity text-sm"
                  >
                    Yıldızlarımı Yedekle
                  </button>
                </form>
                {backupError && <p className="mt-3 text-sm text-red-400 text-center">{backupError}</p>}
                <div className="mt-4 pt-4 border-t border-zinc-800 text-center">
                  <button
                    onClick={() => { setIsRecovering(true); clearRedirectTimer() }}
                    className="text-sm text-zinc-500 hover:text-white transition-colors"
                  >
                    Eski yıldızlarımı telefon numaram ile kurtar
                  </button>
                </div>
              </div>
            )}

            {/* Kurtarma formu */}
            {isRecovering && !backupSuccess && (
              <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 text-left mb-6">
                <h3 className="text-white font-medium mb-2">Eski Yıldızlarını Kurtar</h3>
                <p className="text-zinc-400 text-sm mb-4">Daha önce kaydettiğiniz telefon numaranızı girin.</p>
                <form onSubmit={handleRecover} className="space-y-3">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type="tel"
                      placeholder="Telefon Numaranız"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#00f2fe]"
                      value={recoverPhone}
                      onChange={(e) => setRecoverPhone(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="w-full bg-zinc-100 text-zinc-900 font-medium py-3 rounded-xl hover:bg-white transition-colors text-sm">
                    Yıldızları Geri Yükle
                  </button>
                </form>
                {recoverMessage && <p className="mt-3 text-sm text-yellow-400 text-center">{recoverMessage}</p>}
                <button onClick={() => setIsRecovering(false)} className="mt-4 w-full text-zinc-500 text-sm hover:text-zinc-300">Geri Dön</button>
              </div>
            )}

            {/* Yedekleme başarılı */}
            {backupSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col items-center mt-4 mb-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
                <h3 className="text-emerald-500 font-medium text-lg">Harika!</h3>
                <p className="text-zinc-300 text-sm text-center">
                  {recoverMessage || 'Yıldızlarınız güvenle buluta kaydedildi.'}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <a href={targetUrl} className="inline-flex items-center text-zinc-500 hover:text-white transition-colors text-sm">
                Menüye Devam Et →
              </a>
              {countdown > 0 && !backupSuccess && !isRecovering && isBackedUp && (
                <p className="text-zinc-700 text-xs">{countdown} saniye sonra otomatik yönlendirileceksiniz</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
