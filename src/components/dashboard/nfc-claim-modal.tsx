'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2, Smartphone, Wifi, CheckCircle2, AlertTriangle, Keyboard } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ClaimStep = 'detect' | 'nfc-waiting' | 'manual' | 'claiming' | 'success' | 'error'

interface NfcClaimModalProps {
  onClose: () => void
  onClaimed: () => void
}

export function NfcClaimModal({ onClose, onClaimed }: NfcClaimModalProps) {
  const [step, setStep] = useState<ClaimStep>('detect')
  const [serial, setSerial] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [hasNfc, setHasNfc] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // WebNFC desteğini kontrol et
    const nfcSupported = 'NDEFReader' in window
    setHasNfc(nfcSupported)

    if (nfcSupported) {
      setStep('nfc-waiting')
      startNfcScan()
    } else {
      setStep('manual')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startNfcScan = async () => {
    try {
      // @ts-expect-error NDEFReader is not in TypeScript types
      const ndef = new NDEFReader()
      await ndef.scan()

      ndef.addEventListener('reading', ({ message }: { message: { records: { recordType: string; data: ArrayBuffer }[] } }) => {
        for (const record of message.records) {
          if (record.recordType === 'url' || record.recordType === 'text') {
            const decoder = new TextDecoder()
            const text = decoder.decode(record.data)

            // URL'den seri numarasını çıkar: https://refly.world/claim/REF-NFC-1001
            const match = text.match(/\/claim\/([A-Z0-9-]+)/i)
            if (match) {
              handleClaim(match[1])
              return
            }

            // Direkt seri numarası olabilir
            if (/^REF-/i.test(text)) {
              handleClaim(text.trim())
              return
            }
          }
        }
        setError('NFC verisinden seri numarası okunamadı. Lütfen seri numarasını elle girin.')
        setStep('manual')
      })

      ndef.addEventListener('readingerror', () => {
        setError('NFC okuma hatası. Lütfen tekrar deneyin veya seri numarasını elle girin.')
        setStep('manual')
      })
    } catch {
      setStep('manual')
    }
  }

  const handleClaim = async (deviceSerial: string) => {
    setStep('claiming')
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Oturum bulunamadı. Lütfen tekrar giriş yapın.')
      setStep('error')
      return
    }

    const { data, error: rpcError } = await supabase.rpc('claim_nfc_device', {
      p_serial: deviceSerial.toUpperCase(),
      p_user_id: user.id,
    })

    if (rpcError || !data || data.length === 0) {
      setError(rpcError?.message || 'Cihaz bağlanırken bir hata oluştu.')
      setStep('error')
      return
    }

    const result = data[0]
    if (!result.success) {
      setError(result.message)
      setStep('error')
      return
    }

    setSerial(deviceSerial)
    setStep('success')
    setConfetti(true)

    setTimeout(() => {
      onClaimed()
    }, 2500)
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!serial.trim()) return
    handleClaim(serial.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#18181b] p-6 shadow-2xl relative overflow-hidden">
        {/* Confetti overlay */}
        {confetti && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: ['#00f2fe', '#4facfe', '#10b981', '#f59e0b', '#ef4444', '#ec4899'][i % 6],
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${0.5 + Math.random() * 1}s`,
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* NFC Waiting Step (Android/Chrome) */}
        {step === 'nfc-waiting' && (
          <div className="text-center py-6">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-[#00f2fe]/10 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-[#00f2fe]/20 animate-pulse" />
              <div className="absolute inset-4 rounded-full bg-[#00f2fe]/10 flex items-center justify-center">
                <Wifi className="w-10 h-10 text-[#00f2fe]" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-zinc-100 mb-2">NFC Tarama Aktif</h2>
            <p className="text-sm text-zinc-400 mb-6">
              Telefonunuzu Refly ürününe dokundurun...
            </p>
            <button
              onClick={() => setStep('manual')}
              className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Keyboard className="w-4 h-4" />
              Seri numarasını elle gir
            </button>
          </div>
        )}

        {/* Manual Entry Step (iOS/Safari fallback) */}
        {step === 'manual' && (
          <div className="py-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-[#00f2fe]/10 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6 text-[#00f2fe]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">Cihaz Ekle</h2>
                <p className="text-xs text-zinc-500">
                  {hasNfc ? 'NFC okunamadı.' : 'Tarayıcınız NFC desteklemiyor.'} Seri numarasını girin.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Seri Numarası</Label>
                <Input
                  type="text"
                  placeholder="REF-NFC-1001"
                  value={serial}
                  onChange={(e) => setSerial(e.target.value.toUpperCase())}
                  required
                  className="bg-[#09090b] border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00f2fe] rounded-xl text-center text-lg font-mono tracking-wider"
                />
                <p className="text-xs text-zinc-500 text-center">
                  Ürünün üzerindeki seri numarasını girin veya QR kodu kameranızla taratın
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-all text-sm font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!serial.trim()}
                  className="flex-1 accent-gradient text-white font-medium py-2.5 rounded-xl accent-glow-sm hover:opacity-90 disabled:opacity-50 transition-all text-sm"
                >
                  Cihazı Bağla
                </button>
              </div>
            </form>

            {hasNfc && (
              <button
                onClick={() => { setStep('nfc-waiting'); startNfcScan() }}
                className="w-full mt-3 inline-flex items-center justify-center gap-2 text-sm text-[#00f2fe] hover:text-[#4facfe] transition-colors"
              >
                <Wifi className="w-4 h-4" />
                NFC ile tekrar dene
              </button>
            )}
          </div>
        )}

        {/* Claiming Step */}
        {step === 'claiming' && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-[#00f2fe] animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-zinc-100">Cihaz Bağlanıyor...</h2>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="text-center py-8 relative z-20">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-100 mb-2">Cihaz Başarıyla Bağlandı! 🎉</h2>
            <div className="inline-block px-3 py-1 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe]/20 text-[#00f2fe] text-sm font-mono mt-2">
              {serial}
            </div>
            <p className="text-sm text-zinc-400 mt-4">Şimdi cihaza bir link atayabilirsiniz.</p>
          </div>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">Bağlantı Başarısız</h2>
            <p className="text-sm text-red-400 mb-6">{error}</p>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-all text-sm font-medium">
                Kapat
              </button>
              <button onClick={() => { setError(null); setStep('manual') }} className="flex-1 accent-gradient text-white font-medium py-2.5 rounded-xl accent-glow-sm hover:opacity-90 text-sm">
                Tekrar Dene
              </button>
            </div>
          </div>
        )}

        {/* Detect step (brief loading) */}
        {step === 'detect' && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-[#00f2fe] animate-spin mx-auto mb-4" />
            <p className="text-sm text-zinc-400">NFC desteği kontrol ediliyor...</p>
          </div>
        )}
      </div>
    </div>
  )
}
