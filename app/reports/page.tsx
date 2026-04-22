import { createClient } from '@/lib/supabase/server'
import ReportsClient from './ReportsClient'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: records, error } = await supabase
    .from('pwd_profiles')
    .select('*')
    .order('created_at', { ascending: true })

  return <ReportsClient records={records ?? []} fetchError={error?.message} />
}
