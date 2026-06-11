'use client'

import { useEffect, useState, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Phone, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function StarPage({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = use(params)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [stars, setStars] = useState(0)
  const [businessName, setBusinessName] = useState('İşletme')
  const [targetUrl, setTargetUrl] = useState('/')
  const [isCooldown, setIsCooldown] = useState(false)
  
  const [phone, setPhone] = useState('')
  const [backupSuccess, setBackupSuccess] = useState(false)
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoverPhone, setRecoverPhone] = useState('')
  const [recoverMessage, setRecoverMessage] = useState('')
  const [backupError, setBackupError] = useState('')

  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // 1. UUID Yönetimi
    let visitorUuid = localStorage.getItem('refly_visitor_uuid')
    if (!visitorUuid) {
      visitorUuid = crypto.randomUUID()
      localStorage.setItem('refly_visitor_uuid', visitorUuid)
    }

    // 2. Yıldız Kazanma İsteği
    const earnStar = async () => {
      try {
        const res = await fetch('/api/loyalty/earn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serial, visitor_uuid: visitorUuid })
        })
        
        const data = await res.json()
        console.log('Earn response:', data)
        
        if (!res.ok) {
          throw new Error(data.error || 'Bir hata oluştu')
        }

        const url = data.target_url || '/'
        setStars(data.stars)
        setBusinessName(data.business_name || 'İşletme')
        setTargetUrl(url)
        setIsCooldown(data.is_cooldown)

        // Cooldown aktifse yıldız sayfasını gösterme, doğrudan yönlendir
        if (data.is_cooldown) {
          window.location.href = url
          return
        }

        setLoading(false)

        // Otomatik yönlendirme (15 saniye sonra)
        startRedirectTimer(url)

      } catch (err: any) {
        setError(err.message)
        setLoading(false)
      }
    }

    earnStar()

    return () => clearRedirectTimer()
  }, [serial])

  const startRedirectTimer = (url: string) => {
    clearRedirectTimer()
    redirectTimerRef.current = setTimeout(() => {
      window.location.href = url
    }, 8000)
  }

  const clearRedirectTimer = () => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current)
      redirectTimerRef.current = null
    }
  }

  const handleBackup = async (e: React.FormEvent) => {
    e.preventDefault()
    clearRedirectTimer() // Yedekleme yaparken yönlendirmeyi durdur

    if (!phone || phone.length < 10) return

    try {
      const visitorUuid = localStorage.getItem('refly_visitor_uuid')
      const res = await fetch('/api/loyalty/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitor_uuid: visitorUuid,
          serial: serial,
          phone_number: phone
        })
      })

      if (res.ok) {
        setBackupSuccess(true)
        setBackupError('')
        setTimeout(() => {
          window.location.href = targetUrl
        }, 3000)
      } else {
        const data = await res.json()
        setBackupError(data.error || 'Yedekleme başarısız.')
      }
    } catch (err) {
      console.error(err)
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
          serial: serial,
          phone_number: recoverPhone
        })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setStars(data.recovered_stars)
        setRecoverMessage(`Eski hesabınız bulundu! ${data.recovered_stars} yıldızınız geri yüklendi.`)
        setIsRecovering(false)
        setBackupSuccess(true)
        setTimeout(() => {
          window.location.href = targetUrl
        }, 3000)
      } else {
        setRecoverMessage('Kayıt bulunamadı.')
      }
    } catch (err) {
      setRecoverMessage('Bir hata oluştu.')
    }
  }

  if (loading || isCooldown) {
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
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00f2fe] rounded-full blur-[150px] opacity-20 pointer-events-none" />

      <div className="z-10 w-full max-w-md text-center">
        {/* Star Animation */}
        <div className="relative inline-block mb-8 animate-bounce">
          <Star className="w-32 h-32 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]" />
          <div className="absolute inset-0 animate-ping opacity-75">
            <Star className="w-32 h-32 text-yellow-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">
          {businessName}'na Hoş Geldiniz!
        </h1>
        <p className="text-[#00f2fe] font-semibold text-xl mb-6">
          İlk Yıldızınız Tanımlandı! 🌟 ({stars} / 8 Yıldız)
        </p>

        {/* Progress bar */}
        <div className="w-full bg-zinc-800 rounded-full h-4 mb-10 overflow-hidden border border-zinc-700">
          <div 
            className="bg-gradient-to-r from-[#00f2fe] to-[#4facfe] h-4 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.min((stars / 8) * 100, 100)}%` }}
          />
        </div>

        {!backupSuccess && !isRecovering && (
          <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 text-left transform transition-all">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-500 shrink-0 mt-1" />
              <p className="text-zinc-300 text-sm leading-relaxed">
                <strong className="text-white">Yıldızlarını güvenceye al!</strong> Telefonunu değiştirirsen veya tarayıcı geçmişini silersen yıldızların kaybolabilir. Sadece numaranı girerek buluta yedekle.
              </p>
            </div>

            <form onSubmit={handleBackup} className="space-y-3">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="tel"
                  placeholder="Telefon Numaranız (5XX...)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#00f2fe] transition-colors"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onFocus={clearRedirectTimer}
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-white font-medium py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                Yıldızlarımı Yedekle
              </button>
            </form>
            
            {backupError && (
              <p className="mt-3 text-sm text-red-400 text-center">{backupError}</p>
            )}

            <div className="mt-4 pt-4 border-t border-zinc-800 text-center">
              <button 
                onClick={() => {
                  setIsRecovering(true)
                  clearRedirectTimer()
                }}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Zaten bir kartım var, telefon numaramla giriş yap
              </button>
            </div>
          </div>
        )}

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
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#00f2fe]"
                  value={recoverPhone}
                  onChange={(e) => setRecoverPhone(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-zinc-100 text-zinc-900 font-medium py-3 rounded-xl hover:bg-white transition-colors"
              >
                Yıldızları Geri Yükle
              </button>
            </form>
            
            {recoverMessage && (
              <p className="mt-3 text-sm text-yellow-400 text-center">{recoverMessage}</p>
            )}

            <button 
              onClick={() => setIsRecovering(false)}
              className="mt-4 w-full text-zinc-500 text-sm hover:text-zinc-300"
            >
              Geri Dön
            </button>
          </div>
        )}

        {backupSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col items-center mt-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
            <h3 className="text-emerald-500 font-medium text-lg">Harika!</h3>
            <p className="text-zinc-300 text-sm text-center">
              {recoverMessage || 'Yıldızlarınız güvenle buluta yedeklendi.'} <br/>
              Menüye yönlendiriliyorsunuz...
            </p>
          </div>
        )}

        <div className="mt-8">
          <a 
            href={targetUrl}
            className="inline-flex items-center text-zinc-400 hover:text-white transition-colors text-sm"
          >
            Menüye Devam Et →
          </a>
        </div>
      </div>
    </div>
  )
}
