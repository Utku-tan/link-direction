'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NfcClaimModal } from '@/components/dashboard/nfc-claim-modal'
import { formatDate, formatNumber } from '@/lib/utils'
import type { NfcDevice, Link, Profile } from '@/lib/types'
import {
  Wifi, Plus, Loader2, LinkIcon, ExternalLink, Settings, Smartphone,
  ShieldAlert, Tag, Coffee, Save, X
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

export default function DevicesPage() {
  const [devices, setDevices] = useState<NfcDevice[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [blockedStats, setBlockedStats] = useState<{ date: string; blocked: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [editingCooldown, setEditingCooldown] = useState(false)
  const [cooldownHours, setCooldownHours] = useState(12)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: profileData }, { data: devicesData }, { data: linksData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('nfc_devices').select('*, link:links(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('links').select('*').eq('user_id', user.id).eq('is_active', true).order('slug'),
    ])

    if (profileData) {
      setProfile(profileData)
      setCooldownHours(profileData.business_cooldown_hours)
    }
    if (devicesData) setDevices(devicesData)
    if (linksData) setLinks(linksData)

    // İşletme ise blocked stats çek
    if (profileData?.account_type === 'business') {
      const deviceIds = devicesData?.map((d: NfcDevice) => d.id) || []
      if (deviceIds.length > 0) {
        const { data: blocked } = await supabase
          .from('analytics')
          .select('clicked_at')
          .in('nfc_device_id', deviceIds)
          .eq('is_cooldown_blocked', true)
          .gte('clicked_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('clicked_at', { ascending: true })

        if (blocked) {
          const daily: Record<string, number> = {}
          const now = new Date()
          for (let i = 13; i >= 0; i--) {
            const d = new Date(now)
            d.setDate(d.getDate() - i)
            daily[d.toISOString().split('T')[0]] = 0
          }
          blocked.forEach((b: { clicked_at: string }) => {
            const key = new Date(b.clicked_at).toISOString().split('T')[0]
            if (daily[key] !== undefined) daily[key]++
          })
          setBlockedStats(Object.entries(daily).map(([date, blocked]) => ({
            date: date.slice(5),
            blocked,
          })))
        }
      }
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const handleLinkAssign = async (deviceId: string, linkId: string | null) => {
    await supabase.from('nfc_devices').update({ link_id: linkId }).eq('id', deviceId)
    fetchData()
  }

  const handleLabelChange = async (deviceId: string, label: string) => {
    await supabase.from('nfc_devices').update({ device_label: label }).eq('id', deviceId)
    fetchData()
  }

  const handleCooldownSave = async () => {
    if (!profile) return
    await supabase.from('profiles').update({ business_cooldown_hours: cooldownHours }).eq('id', profile.id)
    setEditingCooldown(false)
    fetchData()
  }

  const isBusiness = profile?.account_type === 'business'
  const sectionTitle = isBusiness ? 'Masalarım / Stantlarım' : 'Cihazlarım'
  const deviceLabel = isBusiness ? 'Masa / Stant' : 'Cihaz'

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[#00f2fe] animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {isBusiness ? <Coffee className="w-6 h-6 text-amber-400" /> : <Smartphone className="w-6 h-6 text-[#00f2fe]" />}
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">{sectionTitle}</h1>
          </div>
          <p className="text-zinc-400 mt-1">{devices.length} {deviceLabel.toLowerCase()} kayıtlı</p>
        </div>
        <button
          onClick={() => setShowClaimModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 accent-gradient text-white font-medium rounded-xl accent-glow-sm hover:opacity-90 transition-all relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Plus className="w-4 h-4" />
          <Wifi className="w-4 h-4" />
          Yeni {deviceLabel} Ekle (NFC)
        </button>
      </div>

      {/* Cooldown Settings (Business only) */}
      {isBusiness && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Suiistimal Koruma (Cooldown)</h3>
                <p className="text-xs text-zinc-400">Aynı müşteri aynı cihazı <strong className="text-amber-400">{profile?.business_cooldown_hours} saat</strong> içinde tekrar okutsa bile puan kazanmaz.</p>
              </div>
            </div>
            <button
              onClick={() => setEditingCooldown(true)}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Device Cards */}
      {devices.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-zinc-800 bg-[#18181b]/50">
          <Wifi className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400">Henüz {deviceLabel.toLowerCase()} eklenmemiş</p>
          <p className="text-sm text-zinc-500 mt-1">
            NFC butonuna tıklayarak ilk {deviceLabel.toLowerCase()}ınızı ekleyin
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              links={links}
              isBusiness={isBusiness}
              onLinkAssign={handleLinkAssign}
              onLabelChange={handleLabelChange}
            />
          ))}
        </div>
      )}

      {/* Blocked Clicks Chart (Business only) */}
      {isBusiness && blockedStats.length > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-[#18181b]/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-zinc-100">Engellenen Suiistimal Girişimleri</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-4">Son 14 günde cooldown filtresi tarafından engellenen tekrarlı okutmalar</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={blockedStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 11 }} />
                <YAxis stroke="#71717a" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '12px',
                    color: '#f4f4f5',
                  }}
                />
                <Bar dataKey="blocked" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Engellenen" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Modals */}
      {showClaimModal && (
        <NfcClaimModal
          onClose={() => setShowClaimModal(false)}
          onClaimed={() => { setShowClaimModal(false); fetchData() }}
        />
      )}

      {editingCooldown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#18181b] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-zinc-100">Cooldown Ayarı</h2>
              <button onClick={() => setEditingCooldown(false)} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Zaman Kilidi (Saat)</Label>
                <Input
                  type="number"
                  min={1}
                  max={72}
                  value={cooldownHours}
                  onChange={(e) => setCooldownHours(Number(e.target.value))}
                  className="bg-[#09090b] border-zinc-800 text-zinc-100 focus:border-amber-400 rounded-xl"
                />
                <p className="text-xs text-zinc-500">
                  Aynı müşteri aynı cihazı bu süre içinde tekrar okutsa bile puan kazanmaz.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingCooldown(false)} className="flex-1 px-4 py-2.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-all text-sm font-medium">
                  İptal
                </button>
                <button onClick={handleCooldownSave} className="flex-1 accent-gradient text-white font-medium py-2.5 rounded-xl accent-glow-sm hover:opacity-90 text-sm flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Device Card Component ----
function DeviceCard({
  device,
  links,
  isBusiness,
  onLinkAssign,
  onLabelChange,
}: {
  device: NfcDevice
  links: Link[]
  isBusiness: boolean
  onLinkAssign: (deviceId: string, linkId: string | null) => void
  onLabelChange: (deviceId: string, label: string) => void
}) {
  const [editLabel, setEditLabel] = useState(false)
  const [label, setLabel] = useState(device.device_label || '')

  const assignedLink = links.find(l => l.id === device.link_id)
  const shortUrl = `refly.world/claim/${device.device_serial}`

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#18181b]/50 p-5 hover:border-[#00f2fe]/20 transition-all duration-300 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBusiness ? 'bg-amber-500/10' : 'bg-[#00f2fe]/10'}`}>
            {isBusiness ? <Coffee className="w-5 h-5 text-amber-400" /> : <Tag className="w-5 h-5 text-[#00f2fe]" />}
          </div>
          <div>
            {editLabel ? (
              <div className="flex items-center gap-1">
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-24 bg-transparent border-b border-zinc-600 text-sm text-zinc-100 focus:border-[#00f2fe] outline-none"
                  onBlur={() => { onLabelChange(device.id, label); setEditLabel(false) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { onLabelChange(device.id, label); setEditLabel(false) } }}
                  autoFocus
                />
              </div>
            ) : (
              <p
                className="text-sm font-semibold text-zinc-100 cursor-pointer hover:text-[#00f2fe] transition-colors"
                onClick={() => setEditLabel(true)}
                title="Tıklayarak etiket düzenleyin"
              >
                {device.device_label || (isBusiness ? 'Masa' : 'Cihaz')}
              </p>
            )}
            <p className="text-xs text-zinc-500 font-mono">{device.device_serial}</p>
          </div>
        </div>
        <div className={`w-2 h-2 rounded-full mt-2 ${assignedLink ? 'bg-emerald-400 shadow-lg shadow-emerald-400/30' : 'bg-zinc-600'}`} />
      </div>

      {/* Claim URL */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#09090b]/50 text-xs">
        <LinkIcon className="w-3 h-3 text-zinc-500 shrink-0" />
        <span className="text-zinc-400 truncate">{shortUrl}</span>
      </div>

      {/* Link Assignment Dropdown */}
      <div className="space-y-1.5">
        <label className="text-xs text-zinc-400 font-medium">Yönlendirme Linki</label>
        <select
          value={device.link_id || ''}
          onChange={(e) => onLinkAssign(device.id, e.target.value || null)}
          className="w-full px-3 py-2 rounded-xl bg-[#09090b] border border-zinc-800 text-zinc-200 text-sm focus:border-[#00f2fe] focus:outline-none"
        >
          <option value="">— Link Seç —</option>
          {links.map(link => (
            <option key={link.id} value={link.id}>/{link.slug} → {link.target_url.slice(0, 40)}</option>
          ))}
        </select>
      </div>

      {/* Assigned Link Preview */}
      {assignedLink && (
        <a
          href={assignedLink.target_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-[#00f2fe] hover:text-[#4facfe] transition-colors truncate"
        >
          <ExternalLink className="w-3 h-3 shrink-0" />
          {assignedLink.target_url}
        </a>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 border-t border-zinc-800/50">
        <span>Eklenme: {formatDate(device.claimed_at || device.created_at)}</span>
        <span>{formatNumber(assignedLink?.click_count || 0)} tıklanma</span>
      </div>
    </div>
  )
}
