'use client'
import { useState, useMemo, useRef } from 'react'
import { Search, Printer, ArrowUpDown, X } from 'lucide-react'
import type { PwdProfile } from '@/types'

interface Props {
  records: PwdProfile[]
  fetchError?: string
}

interface YearGroup {
  year: string
  records: PwdProfile[]
  lastEncoded: string
}

export default function ReportsClient({ records, fetchError }: Props) {
  const [search, setSearch] = useState('')
  const [sortAsc, setSortAsc] = useState(false)
  const [printYear, setPrintYear] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  // Group records by year of created_at
  const yearGroups = useMemo<YearGroup[]>(() => {
    const map: Record<string, PwdProfile[]> = {}
    records.forEach(r => {
      const year = new Date(r.created_at).getFullYear().toString()
      if (!map[year]) map[year] = []
      map[year].push(r)
    })
    return Object.entries(map)
      .map(([year, recs]) => ({
        year,
        records: recs,
        lastEncoded: new Date(recs[recs.length - 1].created_at).toLocaleDateString('en-PH', {
          month: 'long', day: 'numeric', year: 'numeric',
        }),
      }))
      .sort((a, b) => sortAsc
        ? parseInt(a.year) - parseInt(b.year)
        : parseInt(b.year) - parseInt(a.year)
      )
  }, [records, sortAsc])

  const filtered = useMemo(() =>
    yearGroups.filter(g =>
      g.year.includes(search) ||
      `yearly-${g.year}`.toLowerCase().includes(search.toLowerCase())
    ), [yearGroups, search])

  const printGroup = yearGroups.find(g => g.year === printYear)

  function handlePrint() {
    const area = document.getElementById('print-area')
    if (!area || !printRef.current) return
    area.innerHTML = printRef.current.innerHTML
    area.style.display = 'block'
    window.print()
    setTimeout(() => {
      area.innerHTML = ''
      area.style.display = 'none'
    }, 1500)
  }

  const fileIndex = (year: string) => {
    const idx = yearGroups.findIndex(g => g.year === year)
    return String(idx + 1).padStart(3, '0')
  }

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <div className="bg-white border-b border-gray-100 px-6 h-[58px] flex items-center gap-4 flex-shrink-0">
          <div className="relative max-w-[380px] w-full">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search year or report name…"
              className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-colors"
            />
          </div>
          <button
            onClick={() => setSortAsc(p => !p)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 transition-colors ml-auto"
          >
            Date Created <ArrowUpDown size={13} />
            <span className="text-gray-400">{sortAsc ? '↑' : '↓'}</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <h1 className="font-bold text-2xl text-gray-900 mb-5" style={{ fontFamily: 'var(--font-dm-serif)' }}>
            Reports
          </h1>

          {fetchError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
              Error loading reports: {fetchError}
            </div>
          )}

          {/* Report card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-[2fr_2fr_2fr_160px] px-5 py-3 bg-gray-50 border-b border-gray-200">
              {['File', 'Barangay', 'Date Submitted', 'Records / Print'].map(h => (
                <div key={h} className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 cursor-pointer hover:text-gray-700 transition-colors">
                  {h} {h !== 'Records / Print' && <ArrowUpDown size={10} />}
                </div>
              ))}
            </div>

            {/* Rows */}
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">
                {records.length === 0
                  ? 'No records encoded yet. Go to Database to add PWD records.'
                  : 'No reports match your search.'}
              </div>
            ) : filtered.map(group => (
              <div
                key={group.year}
                className="grid grid-cols-[2fr_2fr_2fr_160px] px-5 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60 transition-colors items-center"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-300">📄</span>
                  <span className="text-sm font-semibold text-gray-800">
                    yearly-{fileIndex(group.year)}
                  </span>
                </div>
                <div className="text-sm text-gray-500">Barangay 10, Bacolod City</div>
                <div className="text-sm text-gray-500">{group.lastEncoded}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {group.records.length} PWD
                  </span>
                  <button
                    onClick={() => setPrintYear(group.year)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-all"
                  >
                    <Printer size={13} /> Print
                  </button>
                </div>
              </div>
            ))}
          </div>

          {records.length > 0 && (
            <div className="mt-3 text-xs text-gray-400 text-right">
              {records.length} total PWD record{records.length !== 1 ? 's' : ''} across {yearGroups.length} year{yearGroups.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* ── PRINT PREVIEW MODAL ── */}
      {printYear && printGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-4 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-900 text-white flex-shrink-0">
              <span className="text-sm font-semibold">
                📄 PWD Masterlist – {printYear} &nbsp;·&nbsp; {printGroup.records.length} Records
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-green-500 hover:bg-green-600 rounded-lg text-sm font-bold transition-colors"
                >
                  <Printer size={13} /> Print
                </button>
                <button
                  onClick={() => setPrintYear(null)}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold transition-colors"
                >
                  <X size={13} /> Close
                </button>
              </div>
            </div>

            {/* Document preview */}
            <div className="bg-gray-200 p-6 overflow-x-auto">
              <div className="bg-white shadow-lg min-w-[900px]" ref={printRef}>
                <MasterlistDoc year={printYear} records={printGroup.records} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden print area (used by window.print) */}
      <div id="print-area" style={{ display: 'none' }} />
    </>
  )
}

// ── Masterlist Document ──────────────────────────────────────────
function MasterlistDoc({ year, records }: { year: string; records: PwdProfile[] }) {
  const MIN_ROWS = 15
  const rows = records.length < MIN_ROWS
    ? [...records, ...Array(MIN_ROWS - records.length).fill(null)]
    : records

  return (
    <div style={{ padding: '28px 32px', fontFamily: "'Times New Roman', serif" }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 8 }}>
          {['🏛️', '♿', '🏙️'].map((e, i) => (
            <div key={i} style={{
              width: 54, height: 54, borderRadius: '50%', border: '2px solid #999',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>{e}</div>
          ))}
        </div>
        <div style={{ fontSize: 11, fontWeight: 'bold' }}>
          Person with Disability (PDAO) Office, Bacolod City
        </div>
        <div style={{ fontSize: 13, fontWeight: 'bold', textDecoration: 'underline', marginTop: 2 }}>
          PWD MASTERLIST FORM – {year}
        </div>
      </div>

      {/* Meta */}
      <div style={{ marginBottom: 12, fontSize: 9.5 }}>
        {[
          ['Name of Association :', 'PWD Association of Barangay 10'],
          ['Barangay / Address :', 'Barangay 10, Bacolod City, Negros Occidental'],
          ['Total No. of PWD Members :', String(records.length)],
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', marginBottom: 4, alignItems: 'flex-end' }}>
            <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>{label}</span>
            <span style={{ borderBottom: '1px solid #333', flex: 1, marginLeft: 6, minWidth: 160, paddingBottom: 1 }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 7.5 }}>
        <thead>
          <tr>
            <th rowSpan={2} style={thStyle({ width: 22 })}>No.</th>
            <th colSpan={3} style={thStyle()}>NAME</th>
            <th rowSpan={2} style={thStyle()}>Complete Address</th>
            <th rowSpan={2} style={thStyle({ width: 28 })}>Age</th>
            <th colSpan={2} style={thStyle()}>Gender</th>
            <th rowSpan={2} style={thStyle()}>DOB</th>
            <th rowSpan={2} style={thStyle()}>Civil Status</th>
            <th rowSpan={2} style={thStyle()}>Employment Status</th>
            <th rowSpan={2} style={thStyle()}>Monthly Income</th>
            <th rowSpan={2} style={thStyle()}>Type of Disability</th>
            <th rowSpan={2} style={thStyle()}>PWD ID Number</th>
            <th rowSpan={2} style={thStyle()}>Remarks</th>
          </tr>
          <tr>
            <th style={thStyle()}>Last Name</th>
            <th style={thStyle()}>First Name</th>
            <th style={thStyle()}>Middle Name</th>
            <th style={thStyle({ width: 30 })}>Male</th>
            <th style={thStyle({ width: 36 })}>Female</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 1 ? '#fafafa' : '#fff' }}>
              <td style={tdStyle({ textAlign: 'center' })}>{i + 1}</td>
              <td style={tdStyle()}>{r?.full_name_last ?? ''}</td>
              <td style={tdStyle()}>{r?.full_name_first ?? ''}</td>
              <td style={tdStyle()}>{r?.full_name_middle ?? ''}</td>
              <td style={tdStyle({ fontSize: 6.5 })}>
                {r ? [r.house_number_street, r.barangay ? `Brgy ${r.barangay}` : null, r.city_municipality].filter(Boolean).join(', ') : ''}
              </td>
              <td style={tdStyle({ textAlign: 'center' })}>
                {r?.date_of_birth ? Math.floor((Date.now() - new Date(r.date_of_birth).getTime()) / 31557600000) : ''}
              </td>
              <td style={tdStyle({ textAlign: 'center' })}>{r?.sex === 'Male' ? '✓' : ''}</td>
              <td style={tdStyle({ textAlign: 'center' })}>{r?.sex === 'Female' ? '✓' : ''}</td>
              <td style={tdStyle({ fontSize: 6.5 })}>{r?.date_of_birth ?? ''}</td>
              <td style={tdStyle({ fontSize: 6.5 })}>{r?.civil_status ?? ''}</td>
              <td style={tdStyle({ fontSize: 6.5 })}>{r?.employment_status ?? ''}</td>
              <td style={tdStyle({ fontSize: 6.5 })}>
                {r?.monthly_income != null ? `₱${r.monthly_income.toLocaleString()}` : ''}
              </td>
              <td style={tdStyle({ fontSize: 6 })}>
                {(r?.disability_type ?? []).join('; ')}
              </td>
              <td style={tdStyle({ fontSize: 6.5 })}>{r?.pwd_id_number ?? ''}</td>
              <td style={tdStyle()}></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Signatures */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, fontSize: 10 }}>
        {[
          { prepared: true,  label: 'Prepared by:',  sig: 'PWD President'   },
          { prepared: false, label: 'Approved by:', sig: 'Punong Barangay' },
        ].map(({ label, sig }) => (
          <div key={sig} style={{ textAlign: 'center' }}>
            <div style={{ fontStyle: 'italic', fontSize: 9, marginBottom: 28 }}>{label}</div>
            <div style={{ borderTop: '1px solid #333', paddingTop: 3, minWidth: 180, fontWeight: 'bold', fontSize: 8.5 }}>
              {sig}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function thStyle(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    border: '1px solid #333', padding: '3px 4px', textAlign: 'center',
    background: '#f0f0f0', fontWeight: 'bold', fontSize: 7, verticalAlign: 'middle',
    ...extra,
  }
}
function tdStyle(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    border: '1px solid #333', padding: '3px 4px',
    verticalAlign: 'middle', fontSize: 7.5, ...extra,
  }
}
