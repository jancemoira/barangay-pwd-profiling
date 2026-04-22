'use client'
import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, Plus, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import type { PwdProfile } from '@/types'
import DetailPanel from '@/components/DetailPanel'
import PwdFormModal from '@/components/PwdFormModal'
import ViewModal from '@/components/ViewModal'
import DeleteModal from '@/components/DeleteModal'
import { createClient } from '@/lib/supabase/client'

interface Props {
  initialRecords: PwdProfile[]
  fetchError?: string
}

type SortKey = 'name' | 'age' | 'sex' | 'employment' | 'encoded'
type SortDir = 'asc' | 'desc'
type TabKey  = 'all' | 'withId' | 'noId'

export default function DatabaseClient({ initialRecords, fetchError }: Props) {
  const [records,      setRecords]      = useState<PwdProfile[]>(initialRecords)
  const [search,       setSearch]       = useState('')
  const [activeTab,    setActiveTab]    = useState<TabKey>('all')
  const [sortKey,      setSortKey]      = useState<SortKey>('encoded')
  const [sortDir,      setSortDir]      = useState<SortDir>('desc')
  const [filterSex,    setFilterSex]    = useState('')
  const [filterEmp,    setFilterEmp]    = useState('')
  const [filterPanel,  setFilterPanel]  = useState(false)
  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [formOpen,     setFormOpen]     = useState(false)
  const [editRecord,   setEditRecord]   = useState<PwdProfile | null>(null)
  const [viewRecord,   setViewRecord]   = useState<PwdProfile | null>(null)
  const [deleteRecord, setDeleteRecord] = useState<PwdProfile | null>(null)
  const [toast,        setToast]        = useState<{ msg: string; type?: 'success' | 'error' } | null>(null)
  const [page,         setPage]         = useState(1)
  const PAGE_SIZE = 20

  const supabase = createClient()

  // ── Derived list ──────────────────────────────────────────────
  const processed = useMemo(() => {
    const q = search.toLowerCase()

    // 1. tab filter
    let list = records.filter(r => {
      if (activeTab === 'withId') return !!r.pwd_id_number
      if (activeTab === 'noId')   return !r.pwd_id_number
      return true
    })

    // 2. search
    if (q) list = list.filter(r =>
      [r.full_name_first, r.full_name_last, r.full_name_middle,
       r.pwd_id_number, ...(r.disability_type ?? [])].join(' ').toLowerCase().includes(q)
    )

    // 3. filters
    if (filterSex) list = list.filter(r => r.sex === filterSex)
    if (filterEmp) list = list.filter(r => r.employment_status === filterEmp)

    // 4. sort
    list = [...list].sort((a, b) => {
      let av = '', bv = ''
      if (sortKey === 'name')       { av = a.full_name_last;     bv = b.full_name_last }
      if (sortKey === 'sex')        { av = a.sex ?? '';           bv = b.sex ?? '' }
      if (sortKey === 'employment') { av = a.employment_status ?? ''; bv = b.employment_status ?? '' }
      if (sortKey === 'encoded')    { av = a.created_at;          bv = b.created_at }
      if (sortKey === 'age') {
        const an = a.date_of_birth ? Date.now() - new Date(a.date_of_birth).getTime() : 0
        const bn = b.date_of_birth ? Date.now() - new Date(b.date_of_birth).getTime() : 0
        return sortDir === 'asc' ? an - bn : bn - an
      }
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })

    return list
  }, [records, search, activeTab, sortKey, sortDir, filterSex, filterEmp])

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE))
  const paged = processed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const selected = records.find(r => r.id === selectedId) ?? null

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown size={11} className="text-gray-300 ml-1" />
    return sortDir === 'asc'
      ? <ChevronUp size={11} className="text-green-600 ml-1" />
      : <ChevronDown size={11} className="text-green-600 ml-1" />
  }

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2800)
  }

  function handleRowClick(r: PwdProfile) {
    if (selectedId === r.id) setViewRecord(r)
    else setSelectedId(r.id)
  }

  function getAge(r: PwdProfile) {
    if (!r.date_of_birth) return null
    return Math.floor((Date.now() - new Date(r.date_of_birth).getTime()) / 31557600000)
  }

  async function handleSaved(saved: PwdProfile) {
    if (editRecord) {
      setRecords(prev => prev.map(r => r.id === saved.id ? saved : r))
      showToast('Record updated successfully!')
    } else {
      setRecords(prev => [saved, ...prev])
      showToast('PWD record encoded successfully!')
    }
    setSelectedId(saved.id)
    setFormOpen(false)
    setEditRecord(null)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('pwd_profiles').delete().eq('id', id)
    if (error) { showToast(error.message, 'error'); return }
    setRecords(prev => prev.filter(r => r.id !== id))
    if (selectedId === id) setSelectedId(null)
    setDeleteRecord(null)
    showToast('Record deleted.')
  }

  const avColors = [
    'bg-green-100 text-green-700', 'bg-blue-100 text-blue-700',
    'bg-pink-100 text-pink-700',   'bg-yellow-100 text-yellow-700',
    'bg-purple-100 text-purple-700','bg-orange-100 text-orange-700',
  ]
  function avColor(r: PwdProfile) { return avColors[r.full_name_last.charCodeAt(0) % avColors.length] }
  function initials(r: PwdProfile) { return (r.full_name_last[0] + r.full_name_first[0]).toUpperCase() }

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'all',    label: 'All Records', count: records.length },
    { key: 'withId', label: 'With PWD ID', count: records.filter(r => !!r.pwd_id_number).length },
    { key: 'noId',   label: 'No ID Yet',   count: records.filter(r => !r.pwd_id_number).length },
  ]

  const empOptions = ['Employed','Self-Employed','Unemployed','Student','Retired']

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Topbar ── */}
      <div className="bg-white border-b border-gray-100 px-6 h-[58px] flex items-center gap-3 flex-shrink-0">
        <div className="relative max-w-[300px] w-full">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search name, PWD ID, disability…"
            className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-colors"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setFilterPanel(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold transition-colors ${filterPanel || filterSex || filterEmp ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            <SlidersHorizontal size={13} />
            Filter {(filterSex || filterEmp) ? '●' : ''}
          </button>
          <button
            onClick={() => { setEditRecord(null); setFormOpen(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition-colors"
          >
            <Plus size={13} /> Add PWD
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      {filterPanel && (
        <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filter by:</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Sex</span>
            {['', 'Male', 'Female'].map(v => (
              <button key={v} onClick={() => { setFilterSex(v); setPage(1) }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${filterSex === v ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {v || 'All'}
              </button>
            ))}
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Employment</span>
            <select value={filterEmp} onChange={e => { setFilterEmp(e.target.value); setPage(1) }}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-gray-50 focus:outline-none focus:border-green-500">
              <option value="">All</option>
              {empOptions.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          {(filterSex || filterEmp) && (
            <button onClick={() => { setFilterSex(''); setFilterEmp('') }}
              className="ml-auto text-xs text-red-500 hover:text-red-700 font-semibold">
              Clear filters
            </button>
          )}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">

        {/* ── Table Panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden p-5 pb-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Database
            </h1>
            <span className="text-xs text-gray-400">{processed.length} record{processed.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4 gap-0">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setPage(1) }}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === t.key ? 'border-green-500 text-green-700 font-semibold' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                {t.label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === t.key ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {fetchError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              Error loading records: {fetchError}
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white z-10">
                <tr>
                  {([
                    { label: 'Name',       col: 'name'       as SortKey },
                    { label: 'PWD ID',     col: null                    },
                    { label: 'Disability', col: null                    },
                    { label: 'Age',        col: 'age'        as SortKey },
                    { label: 'Sex',        col: 'sex'        as SortKey },
                    { label: 'Employment', col: 'employment' as SortKey },
                    { label: 'Encoded',    col: 'encoded'    as SortKey },
                  ] as const).map(({ label, col }) => (
                    <th
                      key={label}
                      onClick={() => col && toggleSort(col)}
                      className={`text-left text-xs font-semibold text-gray-400 pb-2.5 px-3 border-b border-gray-100 whitespace-nowrap select-none ${col ? 'cursor-pointer hover:text-gray-600' : ''}`}
                    >
                      <span className="inline-flex items-center">
                        {label}
                        {col && <SortIcon col={col} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-gray-400 text-sm">
                      {search || filterSex || filterEmp
                        ? 'No records match your search or filters.'
                        : 'No PWD records yet. Click + Add PWD to begin.'}
                    </td>
                  </tr>
                ) : paged.map(r => {
                  const sel = selectedId === r.id
                  const age = getAge(r)
                  return (
                    <tr
                      key={r.id}
                      onClick={() => handleRowClick(r)}
                      className={`cursor-pointer border-b border-gray-100 transition-colors ${sel ? 'bg-green-500' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${sel ? 'bg-white/20 text-white' : avColor(r)}`}>
                            {initials(r)}
                          </div>
                          <div>
                            <div className={`text-sm font-medium leading-tight ${sel ? 'text-white' : 'text-gray-900'}`}>
                              {r.full_name_last}, {r.full_name_first}
                            </div>
                            <div className={`text-xs leading-tight ${sel ? 'text-white/70' : 'text-gray-400'}`}>
                              {r.full_name_middle ?? ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`px-3 py-2.5 text-xs font-mono tracking-tight ${sel ? 'text-white/90' : 'text-gray-500'}`}>
                        {r.pwd_id_number ?? <span className="italic text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {(r.disability_type ?? []).slice(0, 1).map(d => (
                            <span key={d} className={`text-xs font-semibold px-2 py-0.5 rounded-md ${sel ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>
                              {d}
                            </span>
                          ))}
                          {(r.disability_type ?? []).length > 1 && (
                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${sel ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>
                              +{r.disability_type!.length - 1}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`px-3 py-2.5 text-sm ${sel ? 'text-white' : 'text-gray-600'}`}>
                        {age ?? '—'}
                      </td>
                      <td className={`px-3 py-2.5 text-sm ${sel ? 'text-white' : 'text-gray-600'}`}>
                        {r.sex ?? '—'}
                      </td>
                      <td className={`px-3 py-2.5 text-xs ${sel ? 'text-white/90' : 'text-gray-500'}`}>
                        {r.employment_status ?? '—'}
                      </td>
                      <td className={`px-3 py-2.5 text-xs ${sel ? 'text-white/90' : 'text-gray-400'}`}>
                        {new Date(r.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t border-gray-100 py-2.5 flex items-center justify-between flex-shrink-0">
            <span className="text-xs text-gray-400">
              {processed.length === 0 ? '0 records' : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, processed.length)} of ${processed.length} records`}
            </span>
            <div className="flex gap-1.5 items-center">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >← Prev</button>
              <span className="text-xs text-gray-400 px-1">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >Next →</button>
            </div>
          </div>
        </div>

        {/* ── Detail Panel ── */}
        <DetailPanel
          record={selected}
          avColor={avColor}
          initials={initials}
          onEdit={r => { setEditRecord(r); setFormOpen(true) }}
          onDelete={r => setDeleteRecord(r)}
          onView={r => setViewRecord(r)}
        />
      </div>

      {/* ── Modals ── */}
      {formOpen && (
        <PwdFormModal
          record={editRecord}
          onClose={() => { setFormOpen(false); setEditRecord(null) }}
          onSaved={handleSaved}
        />
      )}
      {viewRecord && (
        <ViewModal
          record={viewRecord}
          avColor={avColor}
          initials={initials}
          onClose={() => setViewRecord(null)}
          onEdit={r => { setViewRecord(null); setEditRecord(r); setFormOpen(true) }}
          onDelete={r => { setViewRecord(null); setDeleteRecord(r) }}
        />
      )}
      {deleteRecord && (
        <DeleteModal
          record={deleteRecord}
          onClose={() => setDeleteRecord(null)}
          onConfirm={() => handleDelete(deleteRecord.id)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-sm font-medium text-white shadow-lg z-[100] border-l-4 ${toast.type === 'error' ? 'bg-gray-900 border-red-500' : 'bg-gray-900 border-green-500'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
