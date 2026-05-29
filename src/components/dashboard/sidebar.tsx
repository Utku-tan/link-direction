'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, LinkIcon, BarChart3, Shield, Users, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/logo'
import type { Profile } from '@/lib/types'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
  { href: '/dashboard/links', label: 'Linklerim', icon: LinkIcon },
  { href: '/dashboard/analytics', label: 'İstatistikler', icon: BarChart3 },
]

const adminItems = [
  { href: '/admin', label: 'Yönetim Özeti', icon: Shield },
  { href: '/admin/users', label: 'Kullanıcılar', icon: Users },
  { href: '/admin/links', label: 'Tüm Linkler', icon: LinkIcon },
]

export function DashboardSidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 border-r border-zinc-800 bg-[#09090b]">
      {/* Logo */}
      <div className="px-6 h-16 flex items-center border-b border-zinc-800">
        <Link href="/dashboard">
          <Logo />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-[#00f2fe]/10 text-[#00f2fe] accent-border-glow'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}

        {profile.role === 'admin' && (
          <>
            <div className="my-4 border-t border-zinc-800" />
            <p className="px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Admin
            </p>
            {adminItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* User info + Sign out */}
      <div className="px-4 py-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full accent-gradient flex items-center justify-center text-white font-semibold text-sm accent-glow-sm">
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">@{profile.username}</p>
            <p className="text-xs text-zinc-500 truncate">{profile.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full mt-1"
        >
          <LogOut className="w-5 h-5" />
          Çıkış Yap
        </button>
      </div>
    </aside>
  )
}
