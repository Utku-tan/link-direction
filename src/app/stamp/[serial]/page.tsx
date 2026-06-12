'use client'

import { useEffect, useState, useRef, use } from 'react'
import { Phone, CheckCircle2, AlertCircle, Loader2, Coffee, Star } from 'lucide-react'
import { generateFingerprint } from '@/lib/fingerprint'

const TAG_LABELS: Record<string, string> = {
  point_1: '+1 Yıldız',
  point_2: '+2 Yıldız',
  point_3: '+3 Yıldız',
  point_4: '+4 Yıldız',
  point_5: '+5 Yıldız',
  redeem_tag: 'Ödül',
}

export default function StampPage({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = use(params)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [stars, setStars] = useState(0)
  const [starsAdded, setStarsAdded] = useState(0)
  const [targetStars, setTargetStars] = useState(8)
  const [businessName, setBusinessName] = useState('İşletme')
  const [targetUrl, setTargetUrl] = useState('/')
  const [tagType, setTagType] = useState('point_1')
  const [isReward, setIsReward] = useState(false)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [isBackedUp, setIsBackedUp] = useState(false)
  const [insufficientStars, setInsufficientStars] = useState(false)

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

  useEffect(() => {
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

        setStars(data.stars)
        setStarsAdded(data.stars_added)
        setTargetStars(data.target_stars)
        setBusinessName(data.business_name || 'İşletme')
        setTargetUrl(data.target_url || '/')
        setTagType(data.tag_type)
        setIsReward(data.is_reward)
        setIsDuplicate(data.is_duplicate)
        setIsBackedUp(data.is_backed_up)

        // redeem_tag ama yetersiz yıldız
        if (data.tag_type === 'redeem_tag' && !data.success && !data.is_duplicate) {
          setInsufficientStars(true)
        }

        if (data.is_duplicate) {
          window.location.href = data.target_url || '/'
          return
        }

        setLoading(false)
        startRedirectTimer(data.target_url || '/')
      } catch (err: any) {
        setError(err.message)
        setLoading(false)
      }
    }

    processStamp()

    return () => {
      clearRedirectTimer()
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [serial])

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
    clearRedirectTimer()
    if (!phone || phone.length < 10) {
      setBackupError('Geçerli bir telefon numarası girin.')
      return
    }

    try {
      const visitorUuid = localStorage.getItem('refly_visitor_uuid')
      const res = await fetch('/api/loyalty/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitor_uuid: visitorUuid,
          serial,
          phone_number: phone,
          username: username || null
        })
      })
      if (res.ok) {
        setBackupSuccess(true)
        setBackupError('')
        setTimeout(() => { window.location.href = targetUrl }, 3000)
      } else {
        const data = await res.json()
        setBackupError(data.error || 'Yedekleme başarısız.')
      }
    } catch {
      setBackupError('Bir hata oluştu.')
    }
  }

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault()
    clearRedirectTimer()
    if (!recoverPhone || recoverPhone.length < 10) return
    try {
      const visitorUuid = localStorage.getItem('refly_visitor_uuid')
      const res = await fetch('/api/loyalty/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_visitor_uuid: visitorUuid,
          serial,
          phone_number: recoverPhone
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setStars(data.recovered_stars)
        setRecoverMessage(`${data.recovered_stars} yıldızınız geri yüklendi!`)
        setIsRecovering(false)
        setBackupSuccess(true)
        setTimeout(() => { window.location.href = targetUrl }, 3000)
      } else {
        setRecoverMessage('Bu numarada kayıt bulunamadı.')
      }
    } catch {
      setRecoverMessage('Bir hata oluştu.')
    }
  }

  // Progress ring calculation
  const progress = Math.min(stars / targetStars, 1)
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  if (loading || isDuplicate) {
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
      {/* Background effects */}
      {isReward ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-400 rounded-full blur-[180px] opacity-20 pointer-events-none animate-pulse" />
        </>
      ) : (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00f2fe] rounded-full blur-[150px] opacity-15 pointer-events-none" />
      )}

      <div className="z-10 w-full max-w-md text-center">

        {/* === ÖDÜL EKRANI === */}
        {isReward && (
          <div className="animate-in fade-in duration-700">
            <div className="relative inline-block mb-6">
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/30 animate-bounce">
                <Coffee className="w-20 h-20 text-white" />
              </div>
              {/* Confetti */}
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full animate-ping"
                  style={{
                    backgroundColor: ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6'][i % 5],
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Afiyet Olsun! ☕</h1>
            <p className="text-amber-400 font-semibold text-xl mb-2">Ödülünüz Onaylandı!</p>
            <p className="text-zinc-400 text-sm mb-6">
              {businessName} • Kalan yıldız: {stars}
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
              <p className="text-amber-300 text-sm">Kasiyere bu ekranı gösterin</p>
            </div>
          </div>
        )}

        {/* === YETERSİZ YILDIZ EKRANI === */}
        {insufficientStars && !isReward && (
          <div className="animate-in fade-in duration-700">
            <div className="relative inline-block mb-8">
              <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
                <circle cx="100" cy="100" r={radius} fill="none" stroke="#27272a" strokeWidth="8" />
                <circle
                  cx="100" cy="100" r={radius} fill="none"
                  stroke="url(#progressGradient)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Star className="w-8 h-8 text-amber-400 fill-amber-400 mb-1" />
                <span className="text-3xl font-bold text-white">{stars}</span>
                <span className="text-xs text-zinc-500">/ {targetStars} Yıldız</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Henüz Yeterli Yıldızınız Yok</h1>
            <p className="text-amber-400 text-lg mb-2">
              Hediyenize {targetStars - stars} yıldız kaldı!
            </p>
            <p className="text-zinc-500 text-sm mb-8">
              {businessName} • {stars}/{targetStars} Yıldız
            </p>
          </div>
        )}

        {/* === YILDIZ KAZANMA EKRANI === */}
        {!isReward && !insufficientStars && (
          <div className="animate-in fade-in duration-700">
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
              {TAG_LABELS[tagType] || `+${starsAdded} Yıldız`} Kazandınız!
            </p>
            <p className="text-zinc-400 text-sm mb-8">
              {businessName} • {stars}/{targetStars} Yıldız
              {stars >= targetStars && ' • 🎉 Ödül almaya hak kazandınız!'}
            </p>
          </div>
        )}

        {/* YEDEKLEME FORMU */}
        {!backupSuccess && !isRecovering && !isBackedUp && !isReward && (
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 text-left">
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

        {/* Zaten yedeklenmiş */}
        {isBackedUp && !isRecovering && !isReward && (
          <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-5 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-emerald-400 font-medium mb-1">Yıldızlarınız Güvende</h3>
            <p className="text-zinc-500 text-xs">Telefon numaranız ile buluta yedeklenmiştir.</p>
          </div>
        )}

        {/* Kurtarma formu */}
        {isRecovering && !backupSuccess && (
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 text-left">
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
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col items-center mt-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
            <h3 className="text-emerald-500 font-medium text-lg">Harika!</h3>
            <p className="text-zinc-300 text-sm text-center">
              {recoverMessage || 'Yıldızlarınız güvenle buluta yedeklendi.'}<br />Menüye yönlendiriliyorsunuz...
            </p>
          </div>
        )}

        {/* Alt yönlendirme */}
        <div className="mt-8 space-y-2">
          <a href={targetUrl} className="inline-flex items-center text-zinc-500 hover:text-white transition-colors text-sm">
            Menüye Devam Et →
          </a>
          {countdown > 0 && !backupSuccess && (
            <p className="text-zinc-700 text-xs">{countdown} saniye sonra otomatik yönlendirileceksiniz</p>
          )}
        </div>
      </div>
    </div>
  )
}
