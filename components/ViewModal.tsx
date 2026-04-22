'use client'
import { X, Pencil, Trash2, Users } from 'lucide-react'
import type { PwdProfile } from '@/types'

interface Props {
  record: PwdProfile
  avColor: (r: PwdProfile) => string
  initials: (r: PwdProfile) => string
  onClose: () => void
  onEdit: (r: PwdProfile) => void
  onDelete: (r: PwdProfile) => void
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-800">{value ?? '—'}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="text-[10px] font-bold text-[#948c00] uppercase tracking-widest mb-2.5 pb-1.5 border-b border-[#948c00]">
        {title}
      </div>
      {children}
    </div>
  )
}

export default function ViewModal({ record: r, avColor, initials, onClose, onEdit, onDelete }: Props) {
  // Using the age directly if provided by the form, otherwise calculating from DOB
  const displayAge = r.age ?? (r.date_of_birth
    ? Math.floor((Date.now() - new Date(r.date_of_birth).getTime()) / 31557600000)
    : null)

  const fullAddress = [
    r.house_number_street,
    r.barangay ? `Brgy ${r.barangay}` : null,
    r.city_municipality,
    r.province,
    r.zip_code
  ].filter(Boolean).join(', ')

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Hero header */}
        <div className="flex items-center gap-4 p-5 bg-yellow-50 border-b border-yellow-100 flex-shrink-0">
          {r.photo_url ? (
            <img 
              src={r.photo_url} 
              className="w-[80px] h-[80px] rounded-full border-4 border-white shadow flex-shrink-0 object-cover"
              alt="Profile"
            />
          ) : (
            <div className={`w-[80px] h-[80px] rounded-full flex items-center justify-center text-2xl font-bold border-4 border-white shadow flex-shrink-0 ${avColor(r)}`}>
              {initials(r)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xl text-gray-900 leading-tight" style={{ fontFamily: 'var(--font-dm-serif)' }}>
              {r.full_name_last}, {r.full_name_first} {r.full_name_middle ?? ''} {r.suffix ?? ''}
            </div>
            <div className="text-sm text-gray-500 mt-0.5">
              Brgy {r.barangay}, {r.city_municipality}
            </div>
            <div className="text-xs font-bold text-[#948c00] tracking-widest mt-1 uppercase">
              PWD ID: {r.pwd_id_number}
            </div>
          </div>
          <button onClick={onClose} className="self-start p-1.5 rounded-lg hover:bg-yellow-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <Section title="I · Personal Information">
            <div className="grid grid-cols-3 gap-x-4 gap-y-4">
              <Row label="Date of Birth" value={r.date_of_birth} />
              <Row label="Age"           value={displayAge ?? undefined} />
              <Row label="Sex"           value={r.sex} />
              <Row label="Birth Place"   value={r.birth_place} />
              <Row label="Nationality"   value={r.nationality} />
              <Row label="Religion"      value={r.religion} />
              <Row label="Civil Status"  value={r.civil_status} />
            </div>
          </Section>

          <Section title="II · Address & Contact">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <div className="col-span-2">
                <Row label="Full Address" value={fullAddress || undefined} />
              </div>
              <Row label="Contact Number" value={r.contact_no} />
            </div>
          </Section>

          <Section title="III · Type of Disability">
            <div className="flex flex-wrap gap-1.5">
              {(r.disability_type ?? []).length > 0
                ? r.disability_type!.map(d => (
                    <span key={d} className="text-xs font-semibold bg-yellow-100 text-[#948c00] px-2.5 py-1 rounded-md">
                      {d}
                    </span>
                  ))
                : <span className="text-sm text-gray-400">None listed</span>
              }
            </div>
          </Section>

          <Section title="IV · Educational Background">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Row label="Highest Attainment" value={r.edu_attainment} />
              <Row label="Currently Studying" value={r.is_studying ? 'Yes' : 'No'} />
              <div className="col-span-2">
                <Row label="School Name" value={r.school_name} />
              </div>
            </div>
          </Section>

          <Section title="V · Employment Information">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Row label="Status"     value={r.employment_status} />
              <Row label="Occupation" value={r.occupation} />
              <Row label="Employer"   value={r.employer_name} />
              <Row label="Monthly Income" value={r.monthly_income ? `₱${r.monthly_income.toLocaleString()}` : undefined} />
            </div>
          </Section>

          {/* Family Composition Section */}
          <Section title="VI · Family Composition">
            {r.family_composition && r.family_composition.length > 0 ? (
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-tighter">
                    <tr>
                      <th className="px-3 py-2 border-b">Name</th>
                      <th className="px-3 py-2 border-b text-center">Age</th>
                      <th className="px-3 py-2 border-b">Relation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {r.family_composition.map((member: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-medium">{member.name}</td>
                        <td className="px-3 py-2 text-center">{member.age}</td>
                        <td className="px-3 py-2 text-gray-500">{member.relationship}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">No family members listed</div>
            )}
          </Section>

          <Section title="VII · Remarks">
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[60px]">
              {r.remarks || 'No remarks provided.'}
            </p>
          </Section>

          <div className="text-[10px] text-gray-400 text-center mt-4 uppercase tracking-widest">
            Date Encoded: {new Date(r.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Close
          </button>
          <button
            onClick={() => onEdit(r)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-100 hover:bg-yellow-200 text-[#948c00] text-sm font-bold transition-colors"
          >
            <Pencil size={13} /> Edit
          </button>
          <button
            onClick={() => onDelete(r)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    </div>
  )
}