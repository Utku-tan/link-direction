'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, Search, Loader2, X, Save } from 'lucide-react'

interface AdminUserRow {
  id: string
  email: string
  phone: string | null
  username: string
  full_name: string | null
  role: string
  max_link_limit: number
  created_at: string
  link_count: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null)
  const [newLimit, setNewLimit] = useState(5)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase.rpc('admin_get_all_users')
    if (data) setUsers(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleUpdateLimit = async () => {
    if (!editingUser) return
    setSaving(true)
    await supabase.from('profiles').update({ max_link_limit: newLimit }).eq('id', editingUser.id)
    setSaving(false)
    setEditingUser(null)
    fetchUsers()
  }

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.phone && u.phone.includes(searchQuery))
  )

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[#00f2fe] animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-[#00f2fe]" />
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Kullanıcı Yönetimi</h1>
        </div>
        <p className="text-zinc-400 mt-1">{users.length} kayıtlı kullanıcı</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input placeholder="Kullanıcı ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-[#00f2fe] rounded-xl" />
      </div>

      {/* Mobile card view */}
      <div className="sm:hidden space-y-3">
        {filteredUsers.map((user) => (
          <div key={user.id} className="rounded-2xl border border-zinc-800 bg-[#18181b]/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full accent-gradient flex items-center justify-center text-white text-xs font-semibold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">@{user.username}</p>
                  <p className="text-xs text-zinc-500">{user.role}</p>
                </div>
              </div>
              <button
                onClick={() => { setEditingUser(user); setNewLimit(user.max_link_limit) }}
                className="text-[#00f2fe] hover:text-[#4facfe] text-xs font-medium transition-colors"
              >
                Limit Ayarla
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-zinc-500">E-posta:</span> <span className="text-zinc-300 block truncate">{user.email}</span></div>
              <div><span className="text-zinc-500">Telefon:</span> <span className="text-zinc-300">{user.phone || '-'}</span></div>
              <div><span className="text-zinc-500">Linkler:</span> <span className="text-zinc-300">{user.link_count} / {user.max_link_limit}</span></div>
              <div><span className="text-zinc-500">Kayıt:</span> <span className="text-zinc-300">{formatDate(user.created_at)}</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block rounded-2xl border border-zinc-800 bg-[#18181b]/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-4 text-xs font-medium text-zinc-400 uppercase">Kullanıcı</th>
                <th className="text-left p-4 text-xs font-medium text-zinc-400 uppercase">E-posta</th>
                <th className="text-left p-4 text-xs font-medium text-zinc-400 uppercase">Telefon</th>
                <th className="text-left p-4 text-xs font-medium text-zinc-400 uppercase">Linkler</th>
                <th className="text-left p-4 text-xs font-medium text-zinc-400 uppercase">Limit</th>
                <th className="text-left p-4 text-xs font-medium text-zinc-400 uppercase">Kayıt Tarihi</th>
                <th className="text-left p-4 text-xs font-medium text-zinc-400 uppercase">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full accent-gradient flex items-center justify-center text-white text-xs font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-200">@{user.username}</p>
                        <p className="text-xs text-zinc-500">{user.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-zinc-300">{user.email}</td>
                  <td className="p-4 text-sm text-zinc-300">{user.phone || '-'}</td>
                  <td className="p-4 text-sm text-zinc-300">{user.link_count}</td>
                  <td className="p-4 text-sm text-zinc-300">{user.max_link_limit}</td>
                  <td className="p-4 text-sm text-zinc-400">{formatDate(user.created_at)}</td>
                  <td className="p-4">
                    <button
                      onClick={() => { setEditingUser(user); setNewLimit(user.max_link_limit) }}
                      className="text-[#00f2fe] hover:text-[#4facfe] text-xs font-medium transition-colors"
                    >
                      Limit Ayarla
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#18181b] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-100">Link Limiti Ayarla</h2>
              <button onClick={() => setEditingUser(null)} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-zinc-400 mb-4">@{editingUser.username} için maksimum link limiti</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Maksimum Link Sayısı</Label>
                <Input type="number" min={1} max={1000} value={newLimit} onChange={(e) => setNewLimit(Number(e.target.value))}
                  className="bg-[#09090b] border-zinc-800 text-zinc-100 focus:border-[#00f2fe] rounded-xl" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingUser(null)} className="flex-1 px-4 py-2.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-all text-sm font-medium">İptal</button>
                <button onClick={handleUpdateLimit} disabled={saving}
                  className="flex-1 accent-gradient text-white font-medium py-2.5 rounded-xl accent-glow-sm hover:opacity-90 disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" />Kaydet</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
