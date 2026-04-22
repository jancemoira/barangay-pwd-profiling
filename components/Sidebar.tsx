'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Database, FileText, BarChart2, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/database',  label: 'Database',  icon: Database  },
  { href: '/reports',   label: 'Reports',   icon: FileText  },
]

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = (userEmail?.slice(0, 2) ?? 'KG').toUpperCase()

  return (
    <aside className="w-[200px] bg-white border-r border-gray-100 flex flex-col flex-shrink-0 h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-50">
        <div className="w-11 h-11 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 overflow-hidden">
          <img
            src="/logos/BRGY-10.png"
            alt="Logo"
            className="w-full h-full object-hidden"
          />
        </div>
        <div>
          <div className="font-bold text-sm text-gray-900 leading-tight">PWD Profiling</div>
          <div className="text-[10px] text-gray-400 leading-tight">Barangay 10</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-3 flex flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-yellow-50 text-[#948c00] font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Icon size={15} className="flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t border-gray-100 pt-3">
        {/* User chip */}
        <div className="flex items-center gap-2 px-3 py-2 mb-1 rounded-xl bg-gray-50">
          <div className="w-7 h-7 rounded-full bg-yellow-100 flex items-center justify-center text-[11px] font-bold text-[#948c00] flex-shrink-0">
            {initials}
          </div>
          <div className="text-xs text-gray-500 truncate flex-1 min-w-0">{userEmail}</div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={15} /> Logout
        </button>
      </div>
    </aside>
  )
}
