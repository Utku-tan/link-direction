import { createClient } from '@/lib/supabase/server'
import { formatNumber } from '@/lib/utils'
import { LinkIcon, BarChart3, MousePointerClick, Zap } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: links } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const totalLinks = links?.length || 0
  const activeLinks = links?.filter(l => l.is_active).length || 0
  const totalClicks = links?.reduce((sum, l) => sum + (l.click_count || 0), 0) || 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const linkIds = links?.map(l => l.id) || []
  
  let clicksToday = 0
  if (linkIds.length > 0) {
    const { count } = await supabase
      .from('analytics')
      .select('*', { count: 'exact', head: true })
      .in('link_id', linkIds)
      .gte('clicked_at', today.toISOString())
    clicksToday = count || 0
  }

  const stats = [
    { label: 'Toplam Link', value: formatNumber(totalLinks), icon: LinkIcon, gradient: 'from-[#00f2fe] to-[#4facfe]' },
    { label: 'Aktif Linkler', value: formatNumber(activeLinks), icon: Zap, gradient: 'from-emerald-400 to-emerald-500' },
    { label: 'Toplam Tıklanma', value: formatNumber(totalClicks), icon: MousePointerClick, gradient: 'from-[#4facfe] to-[#00f2fe]' },
    { label: 'Bugün Tıklanma', value: formatNumber(clicksToday), icon: BarChart3, gradient: 'from-amber-400 to-amber-500' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Genel Bakış</h1>
        <p className="text-zinc-400 mt-1">Link performansınızın özeti</p>
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

      <div className="rounded-2xl border border-zinc-800 bg-[#18181b]/50 p-6">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Son Linkler</h2>
        {links && links.length > 0 ? (
          <div className="space-y-3">
            {links.slice(0, 5).map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-4 rounded-xl bg-[#09090b]/50 hover:bg-zinc-800/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${link.is_active ? 'bg-[#00f2fe] shadow-lg shadow-[#00f2fe]/30' : 'bg-zinc-600'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">/{link.slug}</p>
                    <p className="text-xs text-zinc-500 truncate">{link.target_url}</p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-semibold text-zinc-200">{formatNumber(link.click_count || 0)}</p>
                  <p className="text-xs text-zinc-500">tıklanma</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <LinkIcon className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400">Henüz link oluşturmadınız</p>
            <p className="text-sm text-zinc-500 mt-1">Linklerim sayfasından ilk linkinizi oluşturun</p>
          </div>
        )}
      </div>
    </div>
  )
}
