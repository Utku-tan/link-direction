'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatNumber } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { LinkIcon, Search, Loader2, Ban, CheckCircle } from 'lucide-react'

interface AdminLinkRow {
  id: string
  user_id: string
  username: string
  slug: string
  target_url: string
  is_active: boolean
  click_count: number
  created_at: string
}

export default function AdminLinksPage() {
  const [links, setLinks] = useState<AdminLinkRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  const fetchLinks = useCallback(async () => {
    const { data } = await supabase.rpc('admin_get_all_links')
    if (data) setLinks(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchLinks() }, [fetchLinks])

  const toggleActive = async (linkId: string, currentStatus: boolean) => {
    await supabase.from('links').update({ is_active: !currentStatus }).eq('id', linkId)
    fetchLinks()
  }

  const filteredLinks = links.filter(l =>
    l.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.target_url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[#00f2fe] animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <LinkIcon className="w-6 h-6 text-[#4facfe]" />
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Link Yönetimi</h1>
        </div>
        <p className="text-zinc-400 mt-1">{links.length} toplam link</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input placeholder="Link veya kullanıcı ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00f2fe] rounded-xl" />
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-[#18181b]/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-4 text-xs font-medium text-zinc-400 uppercase">Kullanıcı</th>
                <th className="text-left p-4 text-xs font-medium text-zinc-400 uppercase">Slug</th>
                <th className="text-left p-4 text-xs font-medium text-zinc-400 uppercase">Hedef URL</th>
                <th className="text-left p-4 text-xs font-medium text-zinc-400 uppercase">Tıklanma</th>
                <th className="text-left p-4 text-xs font-medium text-zinc-400 uppercase">Durum</th>
                <th className="text-left p-4 text-xs font-medium text-zinc-400 uppercase">Tarih</th>
                <th className="text-left p-4 text-xs font-medium text-zinc-400 uppercase">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredLinks.map((link) => (
                <tr key={link.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4 text-sm text-zinc-300">@{link.username}</td>
                  <td className="p-4 text-sm font-medium text-zinc-200">/{link.slug}</td>
                  <td className="p-4 text-sm text-zinc-400 max-w-xs truncate">
                    <a href={link.target_url} target="_blank" rel="noopener noreferrer" className="hover:text-[#00f2fe] transition-colors">
                      {link.target_url}
                    </a>
                  </td>
                  <td className="p-4 text-sm text-zinc-300">{formatNumber(link.click_count)}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${link.is_active ? 'bg-[#00f2fe]/10 text-[#00f2fe]' : 'bg-red-500/10 text-red-400'}`}>
                      {link.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-zinc-400">{formatDate(link.created_at)}</td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleActive(link.id, link.is_active)}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${link.is_active ? 'text-red-400 hover:text-red-300' : 'text-[#00f2fe] hover:text-[#4facfe]'}`}
                    >
                      {link.is_active ? <><Ban className="w-3.5 h-3.5" />Pasife Al</> : <><CheckCircle className="w-3.5 h-3.5" />Aktifleştir</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
