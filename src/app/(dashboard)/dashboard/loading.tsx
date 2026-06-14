import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="flex h-[80vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 blur-lg bg-[#00f2fe]/30 rounded-full" />
          <Loader2 className="h-10 w-10 animate-spin text-[#00f2fe] relative z-10" />
        </div>
        <p className="text-sm text-zinc-400 font-medium animate-pulse tracking-wide">Yükleniyor...</p>
      </div>
    </div>
  )
}
