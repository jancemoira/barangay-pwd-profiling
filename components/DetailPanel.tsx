'use client'
import { Eye, Pencil, Trash2, UserCircle } from 'lucide-react'
import type { PwdProfile } from '@/types'

interface Props {
  record: PwdProfile | null
  avColor: (r: PwdProfile) => string
  initials: (r: PwdProfile) => string
  onEdit: (r: PwdProfile) => void
  onDelete: (r: PwdProfile) => void
  onView: (r: PwdProfile) => void
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-800">{value ?? '—'}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 border-t border-gray-100">
      <div className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-2.5">{title}</div>
      {children}
    </div>
  )
}

export default function DetailPanel({ record, avColor, initials, onEdit, onDelete, onView }: Props) {
  if (!record) {
    return (
      <div className="w-[280px] border-l border-gray-100 bg-white flex-shrink-0 flex flex-col items-center justify-center gap-2 text-gray-400">
        <UserCircle size={48} className="text-gray-300" />
        <div className="text-sm font-semibold text-gray-500">No record selected</div>
        <div className="text-xs">Click any row to view profile</div>
      </div>
    )
  }

  const r = record
  const age = r.date_of_birth
    ? Math.floor((Date.now() - new Date(r.date_of_birth).getTime()) / 31557600000)
    : null

  return (
    <div className="w-[280px] border-l border-gray-100 bg-white flex-shrink-0 flex flex-col overflow-y-auto">
      {/* ID tag */}
      <div className="text-center pt-4 pb-0">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {r.pwd_id_number ?? 'No PWD ID Yet'}
        </div>
      </div>

      {/* Avatar */}
      <div className="flex justify-center py-3">
        <div className={`w-[76px] h-[76px] rounded-full flex items-center justify-center text-2xl font-bold border-4 border-yellow-100 ${avColor(r)}`}>
          {r.photo_url ? (
           <img 
              src={r.photo_url} 
              alt="" 
              className="w-full h-full object-cover rounded-full"
            />
            ) : (
            initials(r)
            )}
        </div>
      </div>

      {/* Name */}
      <div className="text-center px-4">
        <div className="font-bold text-base text-gray-900 leading-tight">
          {r.full_name_last}, {r.full_name_first} {r.full_name_middle ?? ''}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          Brgy {r.barangay}, {r.city_municipality}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          {r.contact_no ?? 'No contact number'}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-2 mt-3 pb-3 px-4">
        {[
          { icon: Eye,    label: 'View',   fn: () => onView(r)   },
          { icon: Pencil, label: 'Edit',   fn: () => onEdit(r)   },
          { icon: Trash2, label: 'Delete', fn: () => onDelete(r) },
        ].map(({ icon: Icon, label, fn }) => (
          <button
            key={label}
            onClick={fn}
            title={label}
            className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:bg-yellow-50 hover:border-yellow-400 hover:text-[#948c00] transition-all"
          >
            <Icon size={14} />
          </button>
        ))}
      </div>

      {/* Sections */}
      <Section title="About">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
          <Field label="Age"          value={age ?? undefined}   />
          <Field label="Sex"          value={r.sex}              />
          <Field label="Date of Birth" value={r.date_of_birth}   />
          <Field label="Civil Status" value={r.civil_status}     />
        </div>
      </Section>

      <Section title="Address">
        <Field
          label="Street"
          value={r.house_number_street
            ? `${r.house_number_street}, Brgy ${r.barangay}, ${r.city_municipality}`
            : `Brgy ${r.barangay}, ${r.city_municipality}`}
        />
      </Section>

      <Section title="Disability">
        <div className="flex flex-wrap gap-1">
          {(r.disability_type ?? []).length > 0
            ? r.disability_type!.map(d => (
                <span key={d} className="text-[11px] font-semibold bg-yellow-100 text-[#948c00] px-2 py-0.5 rounded-md">
                  {d}
                </span>
              ))
            : <span className="text-sm text-gray-400">None listed</span>
          }
        </div>
      </Section>

      {/* View full record button */}
      <div className="px-4 pb-5 mt-1">
        <button
          onClick={() => onView(r)}
          className="w-full bg-yellow-100 hover:bg-yellow-200 text-[#948c00] text-sm font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <Eye size={13} /> View Full Record
        </button>
      </div>

      <div className="text-center text-[10px] text-gray-300 pb-4">
        Encoded: {new Date(r.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  )
}
