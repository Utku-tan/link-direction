import Link from 'next/link'
import { Logo } from '@/components/logo'
import { ArrowRight, Cpu, ShieldCheck, Database, Server, Fingerprint, Lock, CheckCircle2 } from 'lucide-react'
import { Scene } from '@/components/3d/Scene'
import { PhoneMockup } from '@/components/PhoneMockup'

export default function LandingPage() {
  return (
    <div className="bg-[#030712] text-zinc-100 font-sans selection:bg-[#00f2fe]/30 relative overflow-x-hidden">
      {/* Navbar - Fixed en üstte */}
      <nav className="fixed w-full border-b border-white/5 backdrop-blur-xl bg-[#030712]/80 top-0 z-50">
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

      {/* 3D Sahne - Native Scroll'un Üzerinde Overlay Olarak (Z-40), Clicks Pass Through */}
      <div className="fixed inset-0 w-full h-full z-40 pointer-events-none">
        <Scene />
      </div>

      {/* Native Scrollable İçerik (Z-10) */}
      <main className="relative z-10 w-full">
        {/* Section 1: Hero */}
        <section className="min-h-screen w-full relative flex flex-col justify-center pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <div className="lg:w-[45%]">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0f172a]/80 border border-white/10 text-zinc-300 text-xs font-medium mb-8 tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00f2fe]" />
                B2B Kapalı Devre Sadakat Sistemleri
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-white mb-6">
                Donanım Güvenceli ve Canlı Onay Mekanizmalı <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] to-[#4facfe]">
                  Dijital Sadakat Altyapısı.
                </span>
              </h1>

              <p className="mt-6 text-lg text-zinc-400 max-w-2xl leading-relaxed">
                İşletmenizin sadakat programını, suistimale açık statik QR kodlar yerine, kasaya entegre NFC Damga Kiti ile dijitalleştirin. Bulut tabanlı canlı doğrulama algoritmasıyla mükerrer işlemleri sıfıra indirin.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
                <Link href="/register" className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold text-black bg-[#00f2fe] hover:bg-[#4facfe] rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:shadow-[0_0_30px_rgba(0,242,254,0.5)] w-full sm:w-auto">
                  Kurumsal Damga Kitini Talep Edin
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: 3 Aşamalı Güvenlik ve Telefon */}
        <section className="min-h-screen w-full relative flex flex-col items-center justify-center pt-24 pb-24">
          <div className="w-full text-center mb-16">
            <h2 className="text-3xl font-bold text-white tracking-tight mb-4">3 Aşamalı Güvenlik Akışı</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Sistemin her katmanı uçtan uca şifreleme ve manuel onay yetkilendirmesi ile korunur.
            </p>
          </div>

          {/* Telefon Tam Ortada */}
          <div className="flex-1 flex items-center justify-center w-full relative z-20 mb-20 pointer-events-auto">
            <PhoneMockup />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full relative z-20 pointer-events-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
                <div className="w-10 h-10 rounded-lg bg-[#00f2fe]/10 border border-[#00f2fe]/20 flex items-center justify-center mb-4">
                  <Cpu className="w-5 h-5 text-[#00f2fe]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">1. Fiziksel Temas</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">Müşteri cihazına NFC damga ile fiziksel yetkilendirme gönderilir.</p>
              </div>
              <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
                <div className="w-10 h-10 rounded-lg bg-[#00f2fe]/10 border border-[#00f2fe]/20 flex items-center justify-center mb-4">
                  <Server className="w-5 h-5 text-[#00f2fe]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">2. Canlı Doğrulama</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">Kasiyer onayı olmadan işlem veritabanına işlenmez.</p>
              </div>
              <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
                <div className="w-10 h-10 rounded-lg bg-[#00f2fe]/10 border border-[#00f2fe]/20 flex items-center justify-center mb-4">
                  <Fingerprint className="w-5 h-5 text-[#00f2fe]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">3. Hile Koruması</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">Benzersiz cihaz parmak izi ile mükerrer işlemler anında reddedilir.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Kurumsal Tarifeler */}
        <section className="min-h-screen w-full relative flex items-center bg-gradient-to-t from-[#0f172a]/40 to-transparent pt-24 pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full pointer-events-auto">
            <div className="lg:w-1/2 ml-auto">
              <div className="text-left mb-12">
                <h2 className="text-3xl font-bold text-white tracking-tight mb-4">Kurumsal Tarifeler</h2>
                <p className="text-zinc-400">İş modelinize en uygun entegrasyonu seçin.</p>
              </div>

              <div className="relative bg-[#0f172a]/80 backdrop-blur-xl border border-[#00f2fe]/30 rounded-3xl p-8 shadow-[0_0_40px_rgba(0,242,254,0.1)]">
                <div className="absolute -top-4 left-8 bg-[#00f2fe] text-black text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                  Kurumsal Tercih
                </div>
                <div className="mb-8 mt-2">
                  <h3 className="text-2xl font-semibold text-white mb-2">B2B İşletme Hesabı</h3>
                  <p className="text-sm text-zinc-400">Refly Donanım ve Kapsamlı Yazılım Kiti</p>
                </div>
                <div className="mb-8 flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">₺999</span>
                    <span className="text-sm text-zinc-500">/ Aylık</span>
                  </div>
                  <div className="text-sm text-[#00f2fe] font-medium mt-1">+ Tek Seferlik ₺999 (Donanım Kiti)</div>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-[#00f2fe] shrink-0" />
                    <span className="text-sm text-zinc-200">6'lı Fiziksel NFC Damga Plakası</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Database className="w-5 h-5 text-[#00f2fe] shrink-0" />
                    <span className="text-sm text-zinc-200">Gerçek Zamanlı Kasa Dashboard Akışı</span>
                  </li>
                </ul>
                <Link href="/register" className="block w-full py-4 px-4 bg-[#00f2fe] hover:bg-[#4facfe] rounded-xl text-center text-sm font-bold text-black transition-colors">
                  İşletmeniz İçin Başvurun
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-12 bg-[#030712] relative z-20 pointer-events-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size="sm" />
            <p className="text-sm text-zinc-600 font-medium">© 2026 Refly.world. Güvenli Altyapı Çözümleri.</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
