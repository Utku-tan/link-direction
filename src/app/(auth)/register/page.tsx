import { RegisterForm } from '@/components/auth/register-form'
import { Logo } from '@/components/logo'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#00f2fe]/6 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#4facfe]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00f2fe]/3 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <Logo size="lg" />
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-100">Hesap Oluştur</h1>
          <p className="text-zinc-400 mt-2">Ücretsiz üye olun ve linklerinizi yönetmeye başlayın</p>
        </div>

        <RegisterForm />

        <p className="text-center text-sm text-zinc-400 mt-6">
          Zaten hesabınız var mı?{' '}
          <Link href="/login" className="text-[#00f2fe] hover:text-[#4facfe] font-medium transition-colors">
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  )
}
