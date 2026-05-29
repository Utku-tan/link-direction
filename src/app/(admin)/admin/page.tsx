import { createAdminClient } from '@/lib/supabase/admin'
import { formatNumber } from '@/lib/utils'
import { Users, LinkIcon, MousePointerClick, Shield } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = createAdminClient()

  const [{ count: userCount }, { count: linkCount }, { count: clickCount }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('links').select('*', { count: 'exact', head: true }),
    supabase.from('analytics').select('*', { count: 'exact', head: true }),
  ])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count: usersToday } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())

  const stats = [
    { label: 'Toplam Kullanıcı', value: formatNumber(userCount || 0), icon: Users, gradient: 'from-[#00f2fe] to-[#4facfe]' },
    { label: 'Toplam Link', value: formatNumber(linkCount || 0), icon: LinkIcon, gradient: 'from-[#4facfe] to-[#00f2fe]' },
    { label: 'Toplam Tıklanma', value: formatNumber(clickCount || 0), icon: MousePointerClick, gradient: 'from-emerald-400 to-emerald-500' },
    { label: 'Bugün Üye', value: formatNumber(usersToday || 0), icon: Shield, gradient: 'from-amber-400 to-amber-500' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Admin Paneli</h1>
        </div>
        <p className="text-zinc-400 mt-1">Sistem yönetim özeti</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-zinc-800 bg-[#18181b]/50 p-6 hover:border-[#00f2fe]/20 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">{stat.value}</p>
                <p className="text-sm text-zinc-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
