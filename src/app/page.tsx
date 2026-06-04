import Link from 'next/link'
import { Logo } from '@/components/logo'
import { ArrowRight, Zap, BarChart3, Shield, Globe, Link2 } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      {/* Navbar */}
      <nav className="border-b border-zinc-800/50 backdrop-blur-xl bg-[#09090b]/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link
              href="/login"
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Giriş Yap
            </Link>
            <Link
              href="/register"
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium accent-gradient text-white rounded-lg sm:rounded-xl transition-all duration-200 accent-glow-sm hover:opacity-90"
            >
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-[#00f2fe]/8 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-[#4facfe]/6 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-[#00f2fe]/3 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-28 pb-16 sm:pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-[#00f2fe]/8 border border-[#00f2fe]/20 text-[#00f2fe] text-xs sm:text-sm mb-6 sm:mb-8">
            <Zap className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            Hızlı, güvenli ve akıllı link yönetimi
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
            Linklerinizi{' '}
            <span className="accent-text">Yönetin</span>
            ,{' '}
            <br className="hidden sm:block" />
            Her Tıklamayı{' '}
            <span className="accent-text">Takip Edin</span>
          </h1>

          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Kişisel kısa linkler oluşturun, tıklanma istatistiklerinizi anlık takip edin 
            ve linklerinizi tek bir panelden yönetin.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-medium accent-gradient text-white rounded-xl transition-all duration-200 accent-glow hover:opacity-90 w-full sm:w-auto justify-center"
            >
              Ücretsiz Hesap Oluştur
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-zinc-300 border border-zinc-700 hover:border-zinc-500 rounded-xl transition-all duration-200 hover:bg-zinc-800/50 w-full sm:w-auto justify-center"
            >
              Giriş Yap
            </Link>
          </div>

          {/* URL Preview */}
          <div className="mt-10 sm:mt-14 inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 rounded-2xl bg-[#18181b]/80 border border-zinc-800 backdrop-blur-xl max-w-full overflow-hidden">
            <div className="w-3 h-3 rounded-full bg-[#00f2fe] shadow-lg shadow-[#00f2fe]/30 shrink-0" />
            <code className="text-xs sm:text-sm text-zinc-300 truncate">
              refly.world/<span className="text-[#00f2fe]">kullanici</span>/<span className="text-[#4facfe]">instagram</span>
            </code>
            <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0 hidden sm:block" />
            <code className="text-xs sm:text-sm text-zinc-500 truncate hidden sm:block">instagram.com/profil</code>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 sm:py-24 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Özellikler</h2>
            <p className="mt-3 text-zinc-400">Link yönetiminizi kolaylaştıran güçlü araçlar</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: Zap,
                title: 'Anında Yönlendirme',
                description: 'Linkleriniz milisaniyeler içinde hedef adrese yönlendirilir. 302 redirect ile maksimum hız.',
              },
              {
                icon: BarChart3,
                title: 'Detaylı İstatistikler',
                description: 'Tıklanma sayıları, cihaz türü, tarayıcı ve referrer verilerini grafiklerle görün.',
              },
              {
                icon: Shield,
                title: 'Güvenli Altyapı',
                description: 'Supabase RLS ile veri güvenliği. Her kullanıcı yalnızca kendi verilerine erişir.',
              },
              {
                icon: Link2,
                title: 'Kişisel Linkler',
                description: 'siteadi.com/kullanici/link formatıyla markalı ve hatırlanabilir linkler oluşturun.',
              },
              {
                icon: Globe,
                title: 'Kolay Yönetim',
                description: 'Modern dashboard ile linklerinizi oluşturun, düzenleyin ve silin. Tek tıkla URL kopyalayın.',
              },
              {
                icon: ArrowRight,
                title: 'Limitsiz Esneklik',
                description: 'Hedef URL\u2019lerinizi istediğiniz zaman güncelleyin. Linkleriniz her zaman güncel kalsın.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-zinc-800 bg-[#18181b]/50 p-6 hover:border-[#00f2fe]/20 hover:bg-[#18181b]/80 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl accent-gradient flex items-center justify-center shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300 accent-glow-sm">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-sm text-zinc-500">© 2025 Refly. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  )
}
