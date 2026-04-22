'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase/client'

export default function DatabaseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data?.session?.user?.email || '')
    })
  }, [])

  return (
    <div className="flex min-h-screen">
      <Sidebar userEmail={userEmail} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
