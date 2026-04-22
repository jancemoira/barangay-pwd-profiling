import { createClient } from '@/lib/supabase/server'
import DatabaseClient from './DatabaseClient'

export const dynamic = 'force-dynamic'

export default async function DatabasePage() {
  const supabase = await createClient()
  const { data: records, error } = await supabase
    .from('pwd_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return <DatabaseClient initialRecords={records ?? []} fetchError={error?.message} />
}
