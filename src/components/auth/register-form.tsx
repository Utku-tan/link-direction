'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Lock, User, Phone } from 'lucide-react'

export function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
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

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          data: {
            username: formattedUsername,
            phone: phone || null,
          },
        },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setError('Bu e-posta adresi zaten kayıtlı.')
        } else {
          console.error(error)
          setError(error.message || 'Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.')
        }
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-zinc-800 bg-[#18181b]/50 backdrop-blur-xl p-6 space-y-4 shadow-2xl">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
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
          <p className="text-xs text-zinc-500">Linkleriniz: siteadi.com/{username || 'kullaniciadi'}/slug</p>
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
