'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, LayoutDashboard, LinkIcon, BarChart3, Shield, Users, LogOut, Wifi, Radio, Stamp } from 'lucide-react'
import { Logo } from '@/components/logo'
import type { Profile } from '@/lib/types'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
  { href: '/dashboard/links', label: 'Linklerim', icon: LinkIcon },
  { href: '/dashboard/analytics', label: 'İstatistikler', icon: BarChart3 },
]

const businessItems = [
  { href: '/dashboard/live-feed', label: 'Canlı Akış', icon: Radio },
  { href: '/dashboard/devices', label: 'Kasa Damgalarım', icon: Stamp },
]

const adminItems = [
  { href: '/admin', label: 'Yönetim Özeti', icon: Shield },
  { href: '/admin/users', label: 'Kullanıcılar', icon: Users },
  { href: '/admin/links', label: 'Tüm Linkler', icon: LinkIcon },
  { href: '/admin/devices', label: 'NFC Cihazlar', icon: Wifi },
]

export function DashboardNavbar({ profile }: { profile: Profile }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Mobile navbar */}
      <div className="lg:hidden flex items-center justify-between h-16 px-4 border-b border-zinc-800 bg-[#09090b]">
        <Logo />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-[#09090b]/95 backdrop-blur-sm">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-800">
              <Logo />
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition-all',
                      isActive
                        ? 'bg-[#00f2fe]/10 text-[#00f2fe]'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                )
              })}

              {/* İşletme Menüsü */}
              {profile.account_type === 'business' && (
                <>
                  <div className="my-3 border-t border-zinc-800" />
                  <p className="px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">İşletme</p>
                  {businessItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition-all',
                        pathname === item.href
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  ))}
                </>
              )}
              {profile.role === 'admin' && (
                <>
                  <div className="my-3 border-t border-zinc-800" />
                  <p className="px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Admin
                  </p>
                  {adminItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition-all',
                        pathname === item.href
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  ))}
                </>
              )}
            </nav>
            <div className="px-4 py-4 border-t border-zinc-800">
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                <div className="w-9 h-9 rounded-full accent-gradient flex items-center justify-center text-white font-semibold text-sm">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">@{profile.username}</p>
                  <p className="text-xs text-zinc-500">{profile.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
              >
                <LogOut className="w-5 h-5" />
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
