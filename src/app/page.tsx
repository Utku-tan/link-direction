import Link from 'next/link'
import { Logo } from '@/components/logo'
import { ArrowRight, Cpu, ShieldCheck, Database, Server, Fingerprint, Lock, CheckCircle2 } from 'lucide-react'
import { Scene } from '@/components/3d/Scene'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-zinc-100 font-sans selection:bg-[#00f2fe]/30">
      {/* Navbar */}
      <nav className="border-b border-white/5 backdrop-blur-xl bg-[#030712]/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Müşteri Girişi
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 text-sm font-medium bg-white text-black hover:bg-zinc-200 rounded-lg transition-all duration-200"
            >
              Kayıt Ol
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32 sm:pt-32 sm:pb-40 border-b border-white/5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#00f2fe]/[0.03] rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Sol Taraf: Metinler */}
            <div className="text-center lg:text-left lg:col-span-5">
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

              <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                İşletmenizin sadakat programını, suistimale açık statik QR kodlar yerine, kasaya entegre 6'lı Fiziksel NFC Damga Kiti ile dijitalleştirin. Bulut tabanlı canlı doğrulama algoritmasıyla mükerrer işlemleri ve hileli veri girişlerini sıfıra indirin.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold text-black bg-[#00f2fe] hover:bg-[#4facfe] rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:shadow-[0_0_30px_rgba(0,242,254,0.5)] w-full sm:w-auto"
                >
                  Kurumsal Damga Kitini Talep Edin
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 w-full sm:w-auto"
                >
                  Bireysel Link Entegrasyonu
                </Link>
              </div>
            </div>

            {/* Sağ Taraf: 3D Sahne */}
            <div className="w-full h-full min-h-[500px] lg:min-h-[700px] lg:col-span-7 scale-110 lg:scale-125 origin-center">
              <Scene />
            </div>
          </div>
        </div>
      </section>

      {/* Teknik Süreç ve Güvenlik Protokolü */}
      <section className="py-24 bg-[#030712] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white tracking-tight mb-4">3 Aşamalı Güvenlik Akışı</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Sistemin her katmanı uçtan uca şifreleme ve manuel onay yetkilendirmesi ile korunur.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Bağlantı Çizgisi (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-[#00f2fe]/20 to-transparent -translate-y-1/2 pointer-events-none" />

            {/* Kart 1 */}
            <div className="relative z-10 bg-[#0f172a]/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl hover:bg-[#0f172a]/80 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#00f2fe]/10 border border-[#00f2fe]/20 flex items-center justify-center mb-6">
                <Cpu className="w-6 h-6 text-[#00f2fe]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">1. İstek Başlatma</h3>
              <div className="text-xs font-semibold text-[#00f2fe] mb-3 uppercase tracking-wider">Kasa Donanımı Teması</div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Kasiyer kontrolündeki 1-5 arası puan damgasına veya ödül harcama damgasına mobil cihaz yaklaştırılır. Donanım seviyesinde şifrelenmiş benzersiz bir işlem kodu (UID) üretilir.
              </p>
            </div>

            {/* Kart 2 */}
            <div className="relative z-10 bg-[#0f172a]/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl hover:bg-[#0f172a]/80 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#00f2fe]/10 border border-[#00f2fe]/20 flex items-center justify-center mb-6">
                <Server className="w-6 h-6 text-[#00f2fe]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">2. Canlı Doğrulama</h3>
              <div className="text-xs font-semibold text-[#00f2fe] mb-3 uppercase tracking-wider">Eşzamanlı Kasa Onayı</div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                İstek, bulut üzerinden eşzamanlı olarak işletmenin kasa paneline iletilir. Kasiyer paneli üzerinden manuel doğrulama verilmeden veritabanı üzerinde hiçbir puan değişikliği yapılmaz.
              </p>
            </div>

            {/* Kart 3 */}
            <div className="relative z-10 bg-[#0f172a]/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl hover:bg-[#0f172a]/80 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[#00f2fe]/10 border border-[#00f2fe]/20 flex items-center justify-center mb-6">
                <Fingerprint className="w-6 h-6 text-[#00f2fe]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">3. Veri Güvenliği</h3>
              <div className="text-xs font-semibold text-[#00f2fe] mb-3 uppercase tracking-wider">Aşamalı Yedekleme</div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Kullanıcı cihaz parmak izi korumasıyla çerez silinmelerine karşı korunur. Bilgiler sadece isim ve telefon numarası eşleşmesiyle bulut altyapısında şifreli (hashed) olarak saklanır.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fiyatlandırma ve Donanım Kiti */}
      <section className="py-24 border-t border-white/5 relative bg-[#030712]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-[#f59e0b]/[0.02] rounded-full blur-[150px]" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white tracking-tight mb-4">Kurumsal Tarifeler</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              İş modelinize en uygun entegrasyonu seçin. Tüm planlar yüksek erişilebilirlik garantisiyle gelir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
            
            {/* Kart 1: Bireysel Link */}
            <div className="bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 h-fit">
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-2">Bireysel Hesap</h3>
                <p className="text-sm text-zinc-400">Standart link yönetimi ve yönlendirme altyapısı.</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">₺49</span>
                  <span className="text-sm text-zinc-500">/ Aylık</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-zinc-400 shrink-0" />
                  <span className="text-sm text-zinc-300">Gelişmiş yönlendirme analitiği</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-zinc-400 shrink-0" />
                  <span className="text-sm text-zinc-300">Tıklama başına veri raporlama</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-zinc-400 shrink-0" />
                  <span className="text-sm text-zinc-300">Özel şablon mimarisi</span>
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-center text-sm font-medium text-white transition-colors"
              >
                Hemen Başla
              </Link>
            </div>

            {/* Kart 2: B2B İşletme Hesabı (Odak) */}
            <div className="relative bg-[#0f172a]/80 backdrop-blur-xl border border-[#00f2fe]/30 rounded-3xl p-8 shadow-[0_0_40px_rgba(0,242,254,0.1)] transform md:-translate-y-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00f2fe] text-black text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                Kurumsal Tercih
              </div>
              <div className="mb-8 mt-2">
                <h3 className="text-2xl font-semibold text-white mb-2">B2B İşletme Hesabı</h3>
                <p className="text-sm text-zinc-400">Refly Donanım ve Kapsamlı Yazılım Kiti</p>
              </div>
              <div className="mb-8">
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">₺999</span>
                    <span className="text-sm text-zinc-500">/ Aylık</span>
                  </div>
                  <div className="text-sm text-[#00f2fe] font-medium mt-1">
                    + Tek Seferlik ₺999 (Donanım Kiti)
                  </div>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-[#00f2fe] shrink-0" />
                  <span className="text-sm text-zinc-200">6'lı Fiziksel NFC Damga Plakası</span>
                </li>
                <li className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-[#00f2fe] shrink-0" />
                  <span className="text-sm text-zinc-200">Gerçek Zamanlı Kasa Dashboard Akışı (Real-time Feed)</span>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#00f2fe] shrink-0" />
                  <span className="text-sm text-zinc-200">Bulut Tabanlı Sayfa Yenileme ve Hile Engelleme Protokolü</span>
                </li>
                <li className="flex items-start gap-3">
                  <Server className="w-5 h-5 text-[#00f2fe] shrink-0" />
                  <span className="text-sm text-zinc-200">Müşteri Veri Matrisi (İsim/Telefon Portalı)</span>
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full py-4 px-4 bg-[#00f2fe] hover:bg-[#4facfe] rounded-xl text-center text-sm font-bold text-black transition-colors shadow-[0_0_20px_rgba(0,242,254,0.2)] hover:shadow-[0_0_30px_rgba(0,242,254,0.4)]"
              >
                İşletmeniz İçin Başvurun
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#030712]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="sm" />
          <p className="text-sm text-zinc-600 font-medium">© 2026 Refly.world. Güvenli Altyapı Çözümleri.</p>
        </div>
      </footer>
    </div>
  )
}
