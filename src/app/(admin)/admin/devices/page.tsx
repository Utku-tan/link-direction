'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import {
  Wifi, Plus, Loader2, X, Save, Trash2, Package,
  Tag, Coffee, ChevronDown
} from 'lucide-react'

interface Device {
  id: string
  device_serial: string
  business_id: string | null
  tag_type: string
  target_url: string | null
  created_at: string
  business_name: string | null
  business_email: string | null
}

interface Business {
  id: string
  business_name: string | null
  email: string
}

const TAG_OPTIONS = [
  { value: 'point_1', label: 'Damga 1 (+1 Yıldız)', icon: '1️⃣' },
  { value: 'point_2', label: 'Damga 2 (+2 Yıldız)', icon: '2️⃣' },
  { value: 'point_3', label: 'Damga 3 (+3 Yıldız)', icon: '3️⃣' },
  { value: 'point_4', label: 'Damga 4 (+4 Yıldız)', icon: '4️⃣' },
  { value: 'point_5', label: 'Damga 5 (+5 Yıldız)', icon: '5️⃣' },
  { value: 'redeem_tag', label: 'Ödül Damgası (Harcama)', icon: '🎁' },
]

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const [{ data: devicesData }, { data: businessData }] = await Promise.all([
      supabase.rpc('admin_get_all_devices'),
      supabase.from('profiles').select('id, business_name, email').eq('account_type', 'business').order('business_name'),
    ])
    if (devicesData) setDevices(devicesData)
    if (businessData) setBusinesses(businessData)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDelete = async (id: string) => {
    if (!confirm('Bu cihazı silmek istediğinize emin misiniz?')) return
    await supabase.from('nfc_devices').delete().eq('id', id)
    fetchData()
  }

  const handleUpdate = async (id: string, updates: Record<string, any>) => {
    await supabase.from('nfc_devices').update(updates).eq('id', id)
    fetchData()
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-amber-400 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Wifi className="w-6 h-6 text-amber-400" />
            NFC Cihaz Yönetimi
          </h1>
          <p className="text-zinc-400 mt-1">{devices.length} cihaz kayıtlı</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBulkModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-amber-500/30 text-amber-400 rounded-xl hover:bg-amber-500/10 transition-all text-sm font-medium"
          >
            <Package className="w-4 h-4" />
            6'lı Set Ekle
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:opacity-90 transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Tekli Cihaz Ekle
          </button>
        </div>
      </div>

      {/* Devices Table */}
      {devices.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <Wifi className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400">Henüz cihaz eklenmemiş</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Seri No</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Damga Tipi</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">İşletme</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Hedef URL</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Tarih</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-zinc-200">{device.device_serial}</span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={device.tag_type}
                        onChange={(e) => handleUpdate(device.id, { tag_type: e.target.value })}
                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none"
                      >
                        {TAG_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={device.business_id || ''}
                        onChange={(e) => handleUpdate(device.id, { business_id: e.target.value || null })}
                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none max-w-[200px]"
                      >
                        <option value="">— Atanmadı —</option>
                        {businesses.map(b => (
                          <option key={b.id} value={b.id}>{b.business_name || b.email}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="url"
                        value={device.target_url || ''}
                        onChange={(e) => handleUpdate(device.id, { target_url: e.target.value || null })}
                        placeholder="https://..."
                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:border-amber-400 focus:outline-none w-full max-w-[200px]"
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {formatDate(device.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(device.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Single Add Modal */}
      {showAddModal && (
        <AddDeviceModal
          businesses={businesses}
          onClose={() => setShowAddModal(false)}
          onAdded={() => { setShowAddModal(false); fetchData() }}
        />
      )}

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <BulkAddModal
          businesses={businesses}
          onClose={() => setShowBulkModal(false)}
          onAdded={() => { setShowBulkModal(false); fetchData() }}
        />
      )}
    </div>
  )
}

// --- Tekli Ekleme Modal ---
function AddDeviceModal({ businesses, onClose, onAdded }: {
  businesses: Business[]
  onClose: () => void
  onAdded: () => void
}) {
  const [serial, setSerial] = useState('')
  const [tagType, setTagType] = useState('point_1')
  const [businessId, setBusinessId] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serial.trim()) { setError('Seri numarası gerekli'); return }
    setSaving(true)
    setError('')

    const { error: insertError } = await supabase.from('nfc_devices').insert({
      device_serial: serial.toUpperCase().trim(),
      tag_type: tagType,
      business_id: businessId || null,
      target_url: targetUrl || null,
    })

    if (insertError) {
      setError(insertError.message.includes('duplicate') ? 'Bu seri numarası zaten mevcut' : insertError.message)
      setSaving(false)
      return
    }
    onAdded()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-zinc-100">Yeni Cihaz Ekle</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
          <div>
            <label className="text-xs text-zinc-400 font-medium">Seri Numarası</label>
            <input value={serial} onChange={e => setSerial(e.target.value)} placeholder="REF-NFC-2001" className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-zinc-100 font-mono text-sm focus:border-amber-400 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-medium">Damga Tipi</label>
            <select value={tagType} onChange={e => setTagType(e.target.value)} className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-zinc-100 text-sm focus:border-amber-400 focus:outline-none">
              {TAG_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-medium">İşletme (Opsiyonel)</label>
            <select value={businessId} onChange={e => setBusinessId(e.target.value)} className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-zinc-100 text-sm focus:border-amber-400 focus:outline-none">
              <option value="">— Henüz Atanmadı —</option>
              {businesses.map(b => <option key={b.id} value={b.id}>{b.business_name || b.email}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-medium">Hedef URL (Opsiyonel)</label>
            <input value={targetUrl} onChange={e => setTargetUrl(e.target.value)} placeholder="https://menu.example.com" className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-zinc-100 text-sm focus:border-amber-400 focus:outline-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-zinc-400 hover:bg-zinc-800 rounded-xl text-sm">İptal</button>
            <button type="submit" disabled={saving} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium py-2.5 rounded-xl hover:opacity-90 text-sm flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// --- Toplu (6'lı Set) Ekleme Modal ---
function BulkAddModal({ businesses, onClose, onAdded }: {
  businesses: Business[]
  onClose: () => void
  onAdded: () => void
}) {
  const [prefix, setPrefix] = useState('REF')
  const [startNumber, setStartNumber] = useState(2001)
  const [businessId, setBusinessId] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const generateSerials = () => {
    const tags: { serial: string; tag_type: string }[] = []
    const types = ['point_1', 'point_2', 'point_3', 'point_4', 'point_5', 'redeem_tag']
    for (let i = 0; i < 6; i++) {
      tags.push({
        serial: `${prefix}-NFC-${startNumber + i}`,
        tag_type: types[i],
      })
    }
    return tags
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const tags = generateSerials()
    const rows = tags.map(t => ({
      device_serial: t.serial.toUpperCase(),
      tag_type: t.tag_type,
      business_id: businessId || null,
      target_url: targetUrl || null,
    }))

    const { error: insertError } = await supabase.from('nfc_devices').insert(rows)
    if (insertError) {
      setError(insertError.message.includes('duplicate') ? 'Bu seri numaraları zaten mevcut' : insertError.message)
      setSaving(false)
      return
    }
    onAdded()
  }

  const preview = generateSerials()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            6'lı Damga Seti Ekle
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 font-medium">Prefix</label>
              <input value={prefix} onChange={e => setPrefix(e.target.value)} className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-zinc-100 font-mono text-sm focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 font-medium">Başlangıç No</label>
              <input type="number" value={startNumber} onChange={e => setStartNumber(Number(e.target.value))} className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-zinc-100 font-mono text-sm focus:border-amber-400 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-medium">İşletme</label>
            <select value={businessId} onChange={e => setBusinessId(e.target.value)} className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-zinc-100 text-sm focus:border-amber-400 focus:outline-none">
              <option value="">— Henüz Atanmadı —</option>
              {businesses.map(b => <option key={b.id} value={b.id}>{b.business_name || b.email}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-medium">Hedef URL (tüm damgalar için)</label>
            <input value={targetUrl} onChange={e => setTargetUrl(e.target.value)} placeholder="https://menu.example.com" className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-zinc-100 text-sm focus:border-amber-400 focus:outline-none" />
          </div>

          {/* Preview */}
          <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
            <p className="text-xs text-zinc-500 mb-2">Oluşturulacak cihazlar:</p>
            <div className="space-y-1">
              {preview.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-zinc-300">{p.serial}</span>
                  <span className="text-zinc-500">{TAG_OPTIONS.find(t => t.value === p.tag_type)?.icon} {TAG_OPTIONS.find(t => t.value === p.tag_type)?.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-zinc-400 hover:bg-zinc-800 rounded-xl text-sm">İptal</button>
            <button type="submit" disabled={saving} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium py-2.5 rounded-xl hover:opacity-90 text-sm flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
              6 Cihaz Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
