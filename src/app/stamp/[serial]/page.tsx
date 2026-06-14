'use client'

import { useEffect, useState, useRef, use } from 'react'
import { Phone, CheckCircle2, AlertCircle, Loader2, Star, ShieldCheck, XCircle, Key } from 'lucide-react'
import { generateFingerprint } from '@/lib/fingerprint'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [pinCode, setPinCode] = useState('')
  const [backupSuccess, setBackupSuccess] = useState(false)
  const [backupError, setBackupError] = useState('')
  
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoverPhone, setRecoverPhone] = useState('')
  const [recoverPinCode, setRecoverPinCode] = useState('')
  const [recoverMessage, setRecoverMessage] = useState('')

  const [showBackupCard, setShowBackupCard] = useState(false)

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
        } else {
          // Doğrudan başarılı onay
          setTimeout(() => setShowBackupCard(true), 2500)
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
            setTimeout(() => setShowBackupCard(true), 2500)
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
    if (!phone || pinCode.length !== 6) {
      setBackupError('Lütfen numaranızı ve 6 haneli şifrenizi girin.')
      return
    }

    const visitorUuid = localStorage.getItem('refly_visitor_uuid')
    try {
      const res = await fetch('/api/loyalty/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_uuid: visitorUuid, phone_number: phone, username, serial, pin_code: pinCode })
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
    if (!recoverPhone || recoverPinCode.length !== 6) {
      setRecoverMessage('Telefon numarası ve 6 haneli şifre gerekli.')
      return
    }
    const fingerprint = generateFingerprint()
    const visitorUuid = localStorage.getItem('refly_visitor_uuid')
    try {
      const res = await fetch('/api/loyalty/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: recoverPhone, new_visitor_uuid: visitorUuid, serial, pin_code: recoverPinCode })
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
      <div className="min-h-screen flex items-center justify-center bg-[#030712]">
        <Loader2 className="w-12 h-12 text-[#00f2fe] animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712] p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Hata Oluştu</h1>
          <p className="text-zinc-400 mb-6">{error}</p>
          <a href="/" className="px-6 py-2 bg-zinc-900/50 border border-white/10 text-white rounded-xl backdrop-blur-xl transition hover:bg-zinc-800">Ana Sayfa</a>
        </div>
      </div>
    )
  }

  if (isDuplicate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712] p-4 text-center">
         <div>
          <Loader2 className="w-12 h-12 text-[#00f2fe] animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">İşlem zaten devam ediyor, yönlendiriliyorsunuz...</p>
         </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#030712] p-4 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <AnimatePresence>
        {isPending && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.15, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00f2fe] rounded-full blur-[150px] pointer-events-none"
          />
        )}
        {isRejected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500 rounded-full blur-[150px] pointer-events-none"
          />
        )}
        {!isPending && !isRejected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-gradient-to-r from-[#00f2fe] to-[#4facfe] rounded-full blur-[150px] pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="z-10 w-full max-w-md text-center space-y-6">
        <AnimatePresence mode="wait">
          {/* === BEKLEME EKRANI === */}
          {isPending && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-10">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="w-32 h-32 rounded-full border border-white/10 bg-zinc-900/30 backdrop-blur-xl flex items-center justify-center shadow-[0_0_40px_rgba(0,242,254,0.1)]"
                >
                  <ShieldCheck className="w-12 h-12 text-[#00f2fe]" />
                </motion.div>
                <div className="absolute inset-0 rounded-full border-t-2 border-[#00f2fe] animate-spin" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-0 rounded-full border-l-2 border-[#4facfe] animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Kasiyer Onayı Bekleniyor</h1>
              <p className="text-zinc-500 text-sm mb-6 max-w-[240px] leading-relaxed">
                Lütfen ekranınızı kapatmayın. Kasiyer onayladığında yıldızınız yüklenecektir.
              </p>
            </motion.div>
          )}

          {/* === REDDEDİLME EKRANI === */}
          {isRejected && (
            <motion.div
              key="rejected"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center"
            >
              <div className="mb-8">
                <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                  <XCircle className="w-12 h-12 text-red-500" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight mb-2">İşlem Reddedildi</h1>
              <p className="text-zinc-500 text-sm mb-8">Kasiyer bu yıldız talebini onaylamadı.</p>
              <a href={targetUrl} className="px-8 py-3 bg-zinc-900/50 backdrop-blur-md border border-white/10 text-white font-medium rounded-xl hover:bg-zinc-800 transition">Menüye Dön</a>
            </motion.div>
          )}

          {/* === ONAY VE KAZANMA EKRANI === */}
          {!isPending && !isRejected && !error && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              {/* Progress Ring */}
              <div className="relative inline-block mb-10">
                <svg width="220" height="220" viewBox="0 0 200 200" className="transform -rotate-90">
                  <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                  <motion.circle
                    cx="100" cy="100" r={radius} fill="none"
                    stroke="url(#progressGradient)" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                    className="drop-shadow-[0_0_10px_rgba(0,242,254,0.5)]"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00f2fe" />
                      <stop offset="100%" stopColor="#4facfe" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ y: -50, opacity: 0, rotate: -45 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", bounce: 0.6, delay: 0.8 }}
                  >
                    <Star className="w-10 h-10 text-[#00f2fe] fill-[#00f2fe] mb-1 drop-shadow-[0_0_15px_rgba(0,242,254,0.6)]" />
                  </motion.div>
                  <motion.span 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                    className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500 tracking-tighter"
                  >
                    {stars}
                  </motion.span>
                  <motion.span 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                    className="text-xs font-medium text-zinc-500 uppercase tracking-widest mt-1"
                  >
                    / {targetStars} YILDIZ
                  </motion.span>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
              >
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Tebrikler! 🎉</h1>
                <p className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] to-[#4facfe] font-semibold text-lg mb-2">
                  Kasiyer Onayladı: {TAG_LABELS[tagType] || `+${starsAdded} Yıldız`}
                </p>
                <p className="text-zinc-500 text-sm mb-8 font-medium">
                  {businessName}
                  {stars >= targetStars && (
                     <span className="block mt-1 text-amber-400 font-bold">Ödül almaya hak kazandınız! 🌟</span>
                  )}
                </p>
              </motion.div>

              {/* YEDEKLEME FORMU (Progressive Disclosure) */}
              <AnimatePresence>
                {showBackupCard && !backupSuccess && !isRecovering && !isBackedUp && (
                  <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 80, damping: 20 }}
                    className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-left mb-6 shadow-2xl"
                  >
                    <div className="flex items-start gap-3 mb-6">
                      <div className="p-2 bg-[#00f2fe]/10 rounded-xl shrink-0">
                        <ShieldCheck className="w-5 h-5 text-[#00f2fe]" />
                      </div>
                      <p className="text-zinc-400 text-sm leading-relaxed">
                        <strong className="text-zinc-200 block mb-1">Yıldızlarını Güvenceye Al</strong> 
                        Telefonunu değiştirirsen yıldızların kaybolabilir. Hesabını yedekle.
                      </p>
                    </div>
                    <form onSubmit={handleBackup} className="space-y-4">
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="İsminiz (Opsiyonel)"
                          className="w-full bg-[#030712]/50 border border-white/5 rounded-2xl py-3.5 px-4 text-white text-sm focus:outline-none focus:border-[#00f2fe]/50 focus:ring-1 focus:ring-[#00f2fe]/50 transition-all placeholder:text-zinc-600"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          onFocus={clearRedirectTimer}
                        />
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                          <input
                            type="tel"
                            placeholder="Telefon (5XX...)"
                            className="w-full bg-[#030712]/50 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-[#00f2fe]/50 focus:ring-1 focus:ring-[#00f2fe]/50 transition-all placeholder:text-zinc-600"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            onFocus={clearRedirectTimer}
                          />
                        </div>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                          <input
                            type="password"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="6 Haneli Kurtarma Şifresi"
                            className="w-full bg-[#030712]/50 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-[#00f2fe]/50 focus:ring-1 focus:ring-[#00f2fe]/50 transition-all tracking-widest font-mono placeholder:text-zinc-600"
                            value={pinCode}
                            onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                            onFocus={clearRedirectTimer}
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full relative group overflow-hidden bg-white text-black font-semibold py-3.5 rounded-2xl transition-transform active:scale-[0.98] text-sm"
                      >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                        Yıldızlarımı Yedekle
                      </button>
                    </form>
                    {backupError && <p className="mt-4 text-sm text-red-400 text-center font-medium">{backupError}</p>}
                    <div className="mt-5 pt-5 border-t border-white/5 text-center">
                      <button
                        onClick={() => { setIsRecovering(true); clearRedirectTimer() }}
                        className="text-sm text-zinc-500 hover:text-white transition-colors font-medium"
                      >
                        Eski hesabımı kurtar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Kurtarma formu */}
              <AnimatePresence>
                {isRecovering && !backupSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-left mb-6 shadow-2xl"
                  >
                    <h3 className="text-white font-semibold mb-2">Hesabı Kurtar</h3>
                    <p className="text-zinc-500 text-sm mb-6">Daha önce kaydettiğiniz telefon ve 6 haneli şifrenizi girin.</p>
                    <form onSubmit={handleRecover} className="space-y-4">
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="tel"
                          placeholder="Telefon Numaranız"
                          className="w-full bg-[#030712]/50 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-[#00f2fe]/50 focus:ring-1 focus:ring-[#00f2fe]/50 transition-all placeholder:text-zinc-600"
                          value={recoverPhone}
                          onChange={(e) => setRecoverPhone(e.target.value)}
                        />
                      </div>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="6 Haneli Kurtarma Şifresi"
                          className="w-full bg-[#030712]/50 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-[#00f2fe]/50 focus:ring-1 focus:ring-[#00f2fe]/50 transition-all tracking-widest font-mono placeholder:text-zinc-600"
                          value={recoverPinCode}
                          onChange={(e) => setRecoverPinCode(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                      <button type="submit" className="w-full bg-[#00f2fe] text-black font-semibold py-3.5 rounded-2xl transition-transform active:scale-[0.98] text-sm">
                        Yıldızları Geri Yükle
                      </button>
                    </form>
                    {recoverMessage && <p className="mt-4 text-sm text-yellow-400 text-center font-medium">{recoverMessage}</p>}
                    <button onClick={() => setIsRecovering(false)} className="mt-5 w-full text-zinc-500 text-sm hover:text-zinc-300 font-medium transition-colors">Vazgeç</button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Yedekleme başarılı */}
              {backupSuccess && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex flex-col items-center mt-4 mb-6 backdrop-blur-xl"
                >
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}>
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
                  </motion.div>
                  <h3 className="text-emerald-400 font-semibold text-lg mb-1">Harika!</h3>
                  <p className="text-zinc-400 text-sm text-center font-medium">
                    {recoverMessage || 'Yıldızlarınız güvenle buluta kaydedildi.'}
                  </p>
                </motion.div>
              )}

              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
                className="space-y-3"
              >
                <a href={targetUrl} className="inline-flex items-center justify-center w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10 transition-colors font-medium text-sm">
                  Menüye Devam Et
                </a>
                {countdown > 0 && !backupSuccess && !isRecovering && isBackedUp && (
                  <p className="text-zinc-600 text-xs font-medium">{countdown} saniye sonra yönlendirileceksiniz</p>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
