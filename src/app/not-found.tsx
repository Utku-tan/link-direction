import Link from 'next/link'
import { Logo } from '@/components/logo'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
      <div className="text-center px-4">
        <div className="mb-8">
          <Logo size="lg" />
        </div>
        <h1 className="text-7xl font-bold accent-text">
          404
        </h1>
        <p className="text-xl text-zinc-300 mt-4">Sayfa Bulunamadı</p>
        <p className="text-zinc-500 mt-2 max-w-md mx-auto">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-8 px-6 py-3 accent-gradient text-white font-medium rounded-xl transition-all duration-200 accent-glow-sm hover:opacity-90"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  )
}
