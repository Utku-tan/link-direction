import Link from 'next/link'
import { Logo } from '@/components/logo'
import { ArrowRight, Cpu, ShieldCheck, Database, Server, Fingerprint, Lock, CheckCircle2 } from 'lucide-react'
import { TiltCard } from '@/components/TiltCard'
import { ScrollVideo } from '@/components/ScrollVideo'

export default function LandingPage() {
  return (
    // overflow-x-hidden kullanıldığında CSS sticky çalışmaz! Bunu kaldırdım.
    <div className="bg-transparent text-zinc-100 font-sans selection:bg-[#00f2fe]/30 w-full overflow-x-clip min-h-[300vh]">
      <ScrollVideo />
      
      {/* Navbar */}
      <nav className="fixed w-full border-b border-white/5 backdrop-blur-xl bg-[#030712]/60 top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Müşteri Girişi
            </Link>
            <Link href="/register" className="px-5 py-2 text-sm font-medium bg-white text-black hover:bg-zinc-200 rounded-lg transition-all duration-200">
              Kayıt Ol
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 w-full">
        {/* Section 1: Hero */}
        <section className="min-h-[80vh] w-full relative flex flex-col justify-center pt-32 pb-20 text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0f172a]/80 border border-white/10 text-zinc-300 text-xs font-medium mb-8 tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00f2fe]" />
              B2B Kapalı Devre Sadakat Sistemleri
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight tracking-tight text-white mb-6">
              Donanım Güvenceli ve Canlı Onay Mekanizmalı <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] to-[#4facfe]">
                Dijital Sadakat Altyapısı.
              </span>
            </h1>

            <p className="mt-6 text-lg text-zinc-400 max-w-2xl leading-relaxed">
              İşletmenizin sadakat programını, suistimale açık statik QR kodlar yerine, kasaya entegre NFC Damga Kiti ile dijitalleştirin. Bulut tabanlı canlı doğrulama algoritmasıyla mükerrer işlemleri sıfıra indirin.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold text-black bg-[#00f2fe] hover:bg-[#4facfe] rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:shadow-[0_0_30px_rgba(0,242,254,0.5)] w-full sm:w-auto">
                Kurumsal Damga Kitini Talep Edin
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* Section 2: 3 Aşamalı Güvenlik (Normal Akış) */}
        <section className="relative w-full py-20 bg-[#0f172a]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
            
            {/* Üst Başlıklar */}
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">3 Aşamalı Güvenlik Akışı</h2>
              <p className="text-zinc-400 text-sm sm:text-base">
                Sistemin her katmanı uçtan uca şifreleme ve manuel onay yetkilendirmesi ile korunur.
              </p>
            </div>

            {/* Alt Kısım: Kartlar (Mobilde Yatay Scroll) */}
            <div className="flex md:grid md:grid-cols-3 gap-8 overflow-x-auto snap-x snap-mandatory px-4 sm:px-6 pb-12 pt-12 -mx-4 sm:-mx-6 hide-scrollbar">
              
              {/* Kart 1 */}
              <TiltCard 
                wrapperClassName="min-w-[300px] snap-center"
                className="h-full bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 p-8 rounded-2xl cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-[#00f2fe]/10 border border-[#00f2fe]/20 flex items-center justify-center mb-6">
                  <Cpu className="w-6 h-6 text-[#00f2fe]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">1. Fiziksel Temas</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">Müşteri cihazına NFC damga ile fiziksel yetkilendirme gönderilir.</p>
              </TiltCard>

              {/* Kart 2 */}
              <TiltCard 
                wrapperClassName="min-w-[300px] snap-center"
                className="h-full bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 p-8 rounded-2xl cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-[#00f2fe]/10 border border-[#00f2fe]/20 flex items-center justify-center mb-6">
                  <Server className="w-6 h-6 text-[#00f2fe]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">2. Canlı Doğrulama</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">Kasiyer onayı olmadan işlem veritabanına işlenmez.</p>
              </TiltCard>

              {/* Kart 3 */}
              <TiltCard 
                wrapperClassName="min-w-[300px] snap-center"
                className="h-full bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 p-8 rounded-2xl cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-[#00f2fe]/10 border border-[#00f2fe]/20 flex items-center justify-center mb-6">
                  <Fingerprint className="w-6 h-6 text-[#00f2fe]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">3. Hile Koruması</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">Benzersiz cihaz parmak izi ile mükerrer işlemler anında reddedilir.</p>
              </TiltCard>

            </div>
          </div>
        </section>

        {/* Section 3: Kurumsal Tarifeler */}
        <section className="w-full relative flex items-center justify-center bg-gradient-to-t from-[#0f172a]/40 to-transparent py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex flex-col items-center">
            
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white tracking-tight mb-4">Kurumsal Tarifeler</h2>
              <p className="text-zinc-400">İş modelinize en uygun entegrasyonu seçin.</p>
            </div>

            <div className="w-full max-w-lg mx-auto py-12">
              <TiltCard 
                wrapperClassName="mx-4"
                className="relative bg-[#0f172a]/80 backdrop-blur-xl border border-[#00f2fe]/30 rounded-3xl p-10 cursor-pointer"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00f2fe] text-black text-xs font-bold px-6 py-2 rounded-full uppercase tracking-wider">
                  Kurumsal Tercih
                </div>
                <div className="mb-8 mt-4 text-center">
                  <h3 className="text-2xl font-semibold text-white mb-2">B2B İşletme Hesabı</h3>
                  <p className="text-sm text-zinc-400">Refly Donanım ve Kapsamlı Yazılım Kiti</p>
                </div>
                <div className="mb-10 flex flex-col items-center gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-bold text-white">₺999</span>
                    <span className="text-base text-zinc-500">/ Aylık</span>
                  </div>
                  <div className="text-sm text-[#00f2fe] font-medium mt-2 bg-[#00f2fe]/10 px-4 py-1 rounded-full">+ Tek Seferlik ₺999 (Donanım Kiti)</div>
                </div>
                <ul className="space-y-5 mb-10 px-4">
                  <li className="flex items-start gap-4">
                    <Lock className="w-6 h-6 text-[#00f2fe] shrink-0" />
                    <span className="text-base text-zinc-200">6'lı Fiziksel NFC Damga Plakası</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <Database className="w-6 h-6 text-[#00f2fe] shrink-0" />
                    <span className="text-base text-zinc-200">Gerçek Zamanlı Kasa Dashboard Akışı</span>
                  </li>
                </ul>
                <Link href="/register" className="block w-full py-5 px-6 bg-[#00f2fe] hover:bg-[#4facfe] rounded-xl text-center text-base font-bold text-black transition-colors relative z-10 shadow-lg">
                  İşletmeniz İçin Başvurun
                </Link>
              </TiltCard>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-12 bg-[#030712]/50 backdrop-blur-lg relative z-20 pointer-events-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size="sm" />
            <p className="text-sm text-zinc-600 font-medium">© 2026 Refly.world. Güvenli Altyapı Çözümleri.</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
