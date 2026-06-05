'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Lock, User, Phone, Building2, UserCircle } from 'lucide-react'
import type { AccountType } from '@/lib/types'

export function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('individual')
  const [businessName, setBusinessName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formattedUsername = username.toLowerCase().trim()
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(formattedUsername) || formattedUsername.length < 3) {
      setError('Kullanıcı adı en az 3 karakter, sadece küçük harf, rakam ve tire içermelidir.')
      setLoading(false)
      return
    }

    if (accountType === 'business' && !businessName.trim()) {
      setError('İşletme hesabı için işletme adı zorunludur.')
      setLoading(false)
      return
    }

    try {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', formattedUsername)
        .single()

      if (existingUser) {
        setError('Bu kullanıcı adı zaten kullanılıyor.')
        setLoading(false)
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          data: {
            username: formattedUsername,
            phone: phone || null,
            account_type: accountType,
            business_name: accountType === 'business' ? businessName.trim() : null,
          },
        },
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Bu e-posta adresi zaten kayıtlı.')
        } else {
          console.error(signUpError)
          setError(signUpError.message || 'Kayıt olurken bir hata oluştu.')
        }
        setLoading(false)
        return
      }

      // E-posta onayı gerekiyorsa (session yoksa) başarı ekranı göster
      if (data?.user && !data.session) {
        setSuccess(true)
        setLoading(false)
        return
      }

      // Session varsa (auto-confirm açıksa) direkt dashboard'a yönlendir
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Registration error:', err)
      setError('Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  // E-posta onay başarı ekranı
  if (success) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-[#18181b]/50 backdrop-blur-xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <Mail className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-100 mb-2">E-postanızı Onaylayın</h2>
        <p className="text-sm text-zinc-400 leading-relaxed mb-4">
          <strong className="text-zinc-200">{email}</strong> adresine bir onay bağlantısı gönderdik.
          Hesabınızı aktifleştirmek için lütfen e-postanızdaki bağlantıya tıklayın.
        </p>
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
          💡 E-posta birkaç dakika içinde gelmezse spam/gereksiz klasörünü kontrol edin.
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-zinc-800 bg-[#18181b]/50 backdrop-blur-xl p-6 space-y-4 shadow-2xl">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Hesap Tipi Seçici */}
        <div className="space-y-2">
          <Label className="text-zinc-300">Hesap Türü</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAccountType('individual')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                accountType === 'individual'
                  ? 'bg-[#00f2fe]/10 border-[#00f2fe]/40 text-[#00f2fe] border'
                  : 'bg-[#09090b] border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
              }`}
            >
              <UserCircle className="w-4 h-4" />
              Bireysel
            </button>
            <button
              type="button"
              onClick={() => setAccountType('business')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                accountType === 'business'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 border'
                  : 'bg-[#09090b] border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
              }`}
            >
              <Building2 className="w-4 h-4" />
              İşletme
            </button>
          </div>
        </div>

        {/* İşletme Adı (sadece business seçildiğinde) */}
        {accountType === 'business' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <Label htmlFor="business_name" className="text-zinc-300">İşletme Adı</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                id="business_name"
                type="text"
                placeholder="Kafe Adı, Restoran vb."
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="pl-10 bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 rounded-xl"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="username" className="text-zinc-300">Kullanıcı Adı</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              id="username"
              type="text"
              placeholder="kullaniciadi"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              required
              minLength={3}
              maxLength={30}
              className="pl-10 bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00f2fe] rounded-xl"
            />
          </div>
          <p className="text-xs text-zinc-500">Linkleriniz: refly.world/{username || 'kullaniciadi'}/slug</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-zinc-300">E-posta</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              id="email"
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10 bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00f2fe] rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-zinc-300">
            Telefon <span className="text-zinc-600">(Opsiyonel)</span>
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              id="phone"
              type="tel"
              placeholder="+90 5XX XXX XX XX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-10 bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00f2fe] rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-zinc-300">Şifre</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              id="password"
              type="password"
              placeholder="En az 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="pl-10 bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00f2fe] rounded-xl"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full accent-gradient text-white font-medium h-11 rounded-xl transition-all duration-200 accent-glow-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Kayıt yapılıyor...
            </>
          ) : (
            'Üye Ol'
          )}
        </button>
      </div>
    </form>
  )
}
