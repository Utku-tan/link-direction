'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatNumber } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'
import { Loader2, MousePointerClick, TrendingUp, Globe } from 'lucide-react'
import type { Link } from '@/lib/types'

const COLORS = ['#00f2fe', '#4facfe', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

export default function AnalyticsPage() {
  const [links, setLinks] = useState<Link[]>([])
  const [analytics, setAnalytics] = useState<any[]>([])
  const [selectedLink, setSelectedLink] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: linksData } = await supabase
      .from('links')
      .select('*')
      .eq('user_id', user.id)

    if (linksData) {
      setLinks(linksData)
      const linkIds = linksData.map(l => l.id)

      if (linkIds.length > 0) {
        const { data: analyticsData } = await supabase
          .from('analytics')
          .select('*')
          .in('link_id', linkIds)
          .order('clicked_at', { ascending: false })
          .limit(5000)

        if (analyticsData) setAnalytics(analyticsData)
      }
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredAnalytics = selectedLink === 'all'
    ? analytics
    : analytics.filter(a => a.link_id === selectedLink)

  const dailyClicks = getDailyClicks(filteredAnalytics)
  const deviceData = getDeviceData(filteredAnalytics)
  const browserData = getBrowserData(filteredAnalytics)
  const referrerData = getReferrerData(filteredAnalytics)

  const totalClicks = filteredAnalytics.length
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const clicksToday = filteredAnalytics.filter(a => new Date(a.clicked_at) >= today).length
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const clicksThisWeek = filteredAnalytics.filter(a => new Date(a.clicked_at) >= weekAgo).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#00f2fe] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">İstatistikler</h1>
          <p className="text-zinc-400 mt-1">Tıklanma verilerinizi analiz edin</p>
        </div>
        <select
          value={selectedLink}
          onChange={(e) => setSelectedLink(e.target.value)}
          className="px-4 py-2 rounded-xl bg-[#18181b] border border-zinc-800 text-zinc-200 text-sm focus:border-[#00f2fe] focus:outline-none"
        >
          <option value="all">Tüm Linkler</option>
          {links.map(link => (
            <option key={link.id} value={link.id}>/{link.slug}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Toplam Tıklanma', value: totalClicks, icon: MousePointerClick, gradient: 'from-[#00f2fe] to-[#4facfe]' },
          { label: 'Bu Hafta', value: clicksThisWeek, icon: TrendingUp, gradient: 'from-[#4facfe] to-[#00f2fe]' },
          { label: 'Bugün', value: clicksToday, icon: Globe, gradient: 'from-emerald-400 to-emerald-500' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl border border-zinc-800 bg-[#18181b]/50 p-5 hover:border-[#00f2fe]/20 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-zinc-100">{formatNumber(stat.value)}</p>
                <p className="text-xs text-zinc-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAnalytics.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-zinc-800 bg-[#18181b]/50">
          <MousePointerClick className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400">Henüz tıklanma verisi yok</p>
          <p className="text-sm text-zinc-500 mt-1">Linklerinize tıklanma geldiğinde burada görünecek</p>
        </div>
      ) : (
        <>
          {/* Area Chart - Daily Clicks */}
          <div className="rounded-2xl border border-zinc-800 bg-[#18181b]/50 p-6">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Tıklanma Trendi</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyClicks}>
                  <defs>
                    <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.3} />
                      <stop offset="50%" stopColor="#4facfe" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#4facfe" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#71717a" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '12px',
                      color: '#f4f4f5',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#00f2fe"
                    strokeWidth={2}
                    fill="url(#clickGradient)"
                    name="Tıklanma"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie + Bar Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Distribution */}
            <div className="rounded-2xl border border-zinc-800 bg-[#18181b]/50 p-6">
              <h2 className="text-lg font-semibold text-zinc-100 mb-4">Cihaz Dağılımı</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="count"
                      nameKey="device"
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      label={(props: any) => `${props.name} (${props.percentage}%)`}
                    >
                      {deviceData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '12px',
                        color: '#f4f4f5',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Browser Distribution */}
            <div className="rounded-2xl border border-zinc-800 bg-[#18181b]/50 p-6">
              <h2 className="text-lg font-semibold text-zinc-100 mb-4">Tarayıcı Dağılımı</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={browserData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="browser" stroke="#71717a" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#71717a" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '12px',
                        color: '#f4f4f5',
                      }}
                    />
                    <Bar dataKey="count" fill="#4facfe" radius={[6, 6, 0, 0]} name="Tıklanma" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Referrer Table */}
          <div className="rounded-2xl border border-zinc-800 bg-[#18181b]/50 p-6">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Referrer Kaynakları</h2>
            {referrerData.length > 0 ? (
              <div className="space-y-2">
                {referrerData.slice(0, 10).map((ref, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#09090b]/50 hover:bg-zinc-800/30 transition-colors">
                    <span className="text-sm text-zinc-300 truncate">{ref.referrer}</span>
                    <span className="text-sm font-semibold text-zinc-200 ml-4">{formatNumber(ref.count)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Referrer verisi bulunamadı</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Helper functions
function getDailyClicks(analytics: any[]) {
  const days: Record<string, number> = {}
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    days[key] = 0
  }
  analytics.forEach(a => {
    const key = new Date(a.clicked_at).toISOString().split('T')[0]
    if (days[key] !== undefined) days[key]++
  })
  return Object.entries(days).map(([date, clicks]) => ({
    date: date.slice(5),
    clicks,
  }))
}

function getDeviceData(analytics: any[]) {
  const counts: Record<string, number> = {}
  analytics.forEach(a => {
    const device = a.device || 'Bilinmiyor'
    counts[device] = (counts[device] || 0) + 1
  })
  const total = analytics.length || 1
  return Object.entries(counts).map(([device, count]) => ({
    device,
    count,
    percentage: Math.round((count / total) * 100),
  }))
}

function getBrowserData(analytics: any[]) {
  const counts: Record<string, number> = {}
  analytics.forEach(a => {
    const browser = a.browser || 'Bilinmiyor'
    counts[browser] = (counts[browser] || 0) + 1
  })
  return Object.entries(counts)
    .map(([browser, count]) => ({ browser, count }))
    .sort((a, b) => b.count - a.count)
}

function getReferrerData(analytics: any[]) {
  const counts: Record<string, number> = {}
  analytics.forEach(a => {
    const referrer = a.referrer || 'Doğrudan Erişim'
    counts[referrer] = (counts[referrer] || 0) + 1
  })
  return Object.entries(counts)
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
}
