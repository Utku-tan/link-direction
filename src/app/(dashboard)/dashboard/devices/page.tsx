'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { NfcDevice, Profile } from '@/lib/types'
import { Stamp, Loader2, ExternalLink, Tag, Coffee, Star } from 'lucide-react'

const TAG_LABELS: Record<string, { label: string; color: string; icon: typeof Star }> = {
  point_1: { label: 'Damga 1 (+1)', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Star },
  point_2: { label: 'Damga 2 (+2)', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', icon: Star },
  point_3: { label: 'Damga 3 (+3)', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: Star },
  point_4: { label: 'Damga 4 (+4)', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20', icon: Star },
  point_5: { label: 'Damga 5 (+5)', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20', icon: Star },
  redeem_tag: { label: 'Ödül Damgası', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Coffee },
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<NfcDevice[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: profileData }, { data: devicesData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('nfc_devices').select('*').eq('business_id', user.id).order('created_at', { ascending: false }),
    ])

    if (profileData) setProfile(profileData)
    if (devicesData) setDevices(devicesData)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[#00f2fe] animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Stamp className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Kasa Damgalarım</h1>
        </div>
        <p className="text-zinc-400 mt-1">{devices.length} damga atanmış • Hedef: {profile?.target_stars_for_reward || 8} yıldız</p>
      </div>

      {/* Info Card */}
      <div className="rounded-2xl border border-[#00f2fe]/20 bg-[#00f2fe]/5 p-5">
        <p className="text-zinc-300 text-sm leading-relaxed">
          <strong className="text-white">Nasıl çalışır?</strong> Kasanızdaki 6 NFC damgası müşterilerinizin telefonuyla dokundurması için hazır.
          1-5 arası damgalar yıldız ekler, 6. damga (Ödül Damgası) ise biriken yıldızları hediyeye dönüştürür.
          Cihaz ekleme ve yönetim işlemleri sistem yöneticisi tarafından yapılır.
        </p>
      </div>

      {/* Device Cards */}
      {devices.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <Stamp className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400">Henüz damga atanmamış</p>
          <p className="text-sm text-zinc-500 mt-1">
            Sistem yöneticisiyle iletişime geçerek kasanıza damga seti atanmasını isteyin
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => {
            const tagInfo = TAG_LABELS[device.tag_type] || TAG_LABELS.point_1
            const TagIcon = tagInfo.icon
            return (
              <div
                key={device.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700 transition-all duration-300 space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      device.tag_type === 'redeem_tag' ? 'bg-amber-500/10' : 'bg-[#00f2fe]/10'
                    }`}>
                      <TagIcon className={`w-5 h-5 ${
                        device.tag_type === 'redeem_tag' ? 'text-amber-400' : 'text-[#00f2fe]'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">{tagInfo.label}</p>
                      <p className="text-xs text-zinc-500 font-mono">{device.device_serial}</p>
                    </div>
                  </div>
                </div>

                {/* Tag Type Badge */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${tagInfo.color}`}>
                  <Tag className="w-3 h-3" />
                  {tagInfo.label}
                </div>

                {/* Target URL */}
                {device.target_url && (
                  <a
                    href={device.target_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-[#00f2fe] hover:text-[#4facfe] transition-colors truncate"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    {device.target_url}
                  </a>
                )}

                {/* Footer */}
                <div className="text-xs text-zinc-600 pt-1 border-t border-zinc-800/50">
                  Eklenme: {formatDate(device.created_at)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
