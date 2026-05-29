'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatNumber, formatDate, buildShortUrl, copyToClipboard, isValidUrl, isValidSlug, formatSlug } from '@/lib/utils'
import type { Link, Profile } from '@/lib/types'
import {
  Plus, LinkIcon, ExternalLink, Copy, Pencil, Trash2, Check,
  Loader2, AlertTriangle, Search, X
} from 'lucide-react'

export default function LinksPage() {
  const [links, setLinks] = useState<Link[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: profileData }, { data: linksData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('links').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    if (profileData) setProfile(profileData)
    if (linksData) setLinks(linksData)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCopy = async (link: Link) => {
    if (!profile) return
    const url = buildShortUrl(profile.username, link.slug)
    const success = await copyToClipboard(url)
    if (success) { setCopiedId(link.id); setTimeout(() => setCopiedId(null), 2000) }
  }

  const handleDelete = async (linkId: string) => {
    if (!confirm('Bu linki silmek istediğinize emin misiniz?')) return
    await supabase.from('links').delete().eq('id', linkId)
    setLinks(links.filter(l => l.id !== linkId))
  }

  const filteredLinks = links.filter(l =>
    l.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.target_url.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const isLimitReached = profile ? links.length >= profile.max_link_limit : false

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[#00f2fe] animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Linklerim</h1>
          <p className="text-zinc-400 mt-1">{links.length} / {profile?.max_link_limit} link kullanılıyor</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={isLimitReached}
          className="inline-flex items-center gap-2 px-5 py-2.5 accent-gradient text-white font-medium rounded-xl accent-glow-sm hover:opacity-90 disabled:opacity-50 transition-all"
        >
          <Plus className="w-4 h-4" /> Yeni Link Ekle
        </button>
      </div>

      {isLimitReached && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300">Maksimum link limitinize ({profile?.max_link_limit}) ulaştınız.</p>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input placeholder="Link ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00f2fe] rounded-xl" />
      </div>

      <div className="space-y-3">
        {filteredLinks.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-zinc-800 bg-[#18181b]/50">
            <LinkIcon className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400">{searchQuery ? 'Aramanıza uygun link bulunamadı' : 'Henüz link oluşturmadınız'}</p>
          </div>
        ) : (
          filteredLinks.map((link) => (
            <div key={link.id} className="rounded-2xl border border-zinc-800 bg-[#18181b]/50 p-5 hover:border-[#00f2fe]/20 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 ${link.is_active ? 'bg-[#00f2fe] shadow-lg shadow-[#00f2fe]/30' : 'bg-zinc-600'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-base font-semibold text-zinc-100">/{link.slug}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${link.is_active ? 'bg-[#00f2fe]/10 text-[#00f2fe]' : 'bg-zinc-700 text-zinc-400'}`}>
                        {link.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    <a href={link.target_url} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-zinc-400 hover:text-[#00f2fe] truncate block mt-1 transition-colors">
                      {link.target_url} <ExternalLink className="inline w-3 h-3 ml-1" />
                    </a>
                    <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                      <span>{formatNumber(link.click_count || 0)} tıklanma</span><span>•</span><span>{formatDate(link.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(link)} className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800">
                    {copiedId === link.id ? <Check className="w-4 h-4 text-[#00f2fe]" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingLink(link)} className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(link.id)} className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreate && <CreateLinkModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchData() }} username={profile?.username || ''} />}
      {editingLink && <EditLinkModal link={editingLink} onClose={() => setEditingLink(null)} onUpdated={() => { setEditingLink(null); fetchData() }} />}
    </div>
  )
}

function CreateLinkModal({ onClose, onCreated, username }: { onClose: () => void; onCreated: () => void; username: string }) {
  const [slug, setSlug] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null)
    const formattedSlug = formatSlug(slug)
    if (!isValidSlug(formattedSlug)) { setError('Slug en az 2 karakter olmalı, sadece küçük harf, rakam ve tire içermelidir.'); return }
    if (!isValidUrl(targetUrl)) { setError('Geçerli bir URL girin (https:// ile başlamalı).'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error: insertError } = await supabase.from('links').insert({ user_id: user.id, slug: formattedSlug, target_url: targetUrl })
    if (insertError) { setError(insertError.code === '23505' ? 'Bu slug zaten kullanılıyor.' : insertError.message); setLoading(false); return }
    onCreated()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#18181b] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-100">Yeni Link Oluştur</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
          <div className="space-y-2">
            <Label className="text-zinc-300">Slug</Label>
            <Input placeholder="instagram" value={slug} onChange={(e) => setSlug(formatSlug(e.target.value))} required
              className="bg-[#09090b] border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00f2fe] rounded-xl" />
            <p className="text-xs text-zinc-500">Link: {buildShortUrl(username, slug || 'slug')}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Hedef URL</Label>
            <Input type="url" placeholder="https://instagram.com/username" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} required
              className="bg-[#09090b] border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00f2fe] rounded-xl" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-all text-sm font-medium">İptal</button>
            <button type="submit" disabled={loading} className="flex-1 accent-gradient text-white font-medium py-2.5 rounded-xl accent-glow-sm hover:opacity-90 disabled:opacity-50 transition-all text-sm flex items-center justify-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditLinkModal({ link, onClose, onUpdated }: { link: Link; onClose: () => void; onUpdated: () => void }) {
  const [targetUrl, setTargetUrl] = useState(link.target_url)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null)
    if (!isValidUrl(targetUrl)) { setError('Geçerli bir URL girin.'); return }
    setLoading(true)
    const { error: updateError } = await supabase.from('links').update({ target_url: targetUrl }).eq('id', link.id)
    if (updateError) { setError(updateError.message); setLoading(false); return }
    onUpdated()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#18181b] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-100">Link Düzenle</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
          <div className="space-y-2">
            <Label className="text-zinc-300">Slug</Label>
            <Input value={link.slug} disabled className="bg-[#09090b]/50 border-zinc-800 text-zinc-500 rounded-xl" />
            <p className="text-xs text-zinc-600">Slug değiştirilemez</p>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Hedef URL</Label>
            <Input type="url" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} required
              className="bg-[#09090b] border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00f2fe] rounded-xl" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-all text-sm font-medium">İptal</button>
            <button type="submit" disabled={loading} className="flex-1 accent-gradient text-white font-medium py-2.5 rounded-xl accent-glow-sm hover:opacity-90 disabled:opacity-50 transition-all text-sm flex items-center justify-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Güncelle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
