'use client'
import { useState, useEffect } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { PwdProfile } from '@/types'
import {
  DISABILITY_TYPES,
  CIVIL_STATUS_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
} from '@/types'

interface Props {
  record: PwdProfile | null   // null = add mode
  onClose: () => void
  onSaved: (r: PwdProfile) => void
}

// ── Reusable field components ──────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
      {children}
    </label>
  )
}

function Input({
  id, value, onChange, placeholder, type = 'text', required,
}: {
  id: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <input
      id={id} type={type} value={value} required={required}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-green-500 focus:bg-white transition-colors"
    />
  )
}

function Select({
  value, onChange, options, placeholder,
}: {
  value: string; onChange: (v: string) => void
  options: readonly string[]; placeholder?: string
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-green-500 focus:bg-white transition-colors appearance-none pr-8"
      >
        <option value="">{placeholder ?? 'Select…'}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  )
}

function RadioGroup({
  name, options, value, onChange,
}: {
  name: string; options: readonly string[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-3 mt-1">
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input
            type="radio" name={name} value={opt} checked={value === opt}
            onChange={() => onChange(opt)}
            className="accent-green-500"
          />
          {opt}
        </label>
      ))}
    </div>
  )
}

function SectionTitle({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-bold text-green-700 uppercase tracking-widest mb-3 pb-1.5 border-b border-green-100">
      <span className="w-5 h-5 bg-green-700 text-white rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0">
        {num}
      </span>
      {title}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function PwdFormModal({ record, onClose, onSaved }: Props) {
  const supabase = createClient()
  const isEdit = !!record

  // I. Personal Information
  const [lastName,   setLastName]   = useState(record?.full_name_last    ?? '')
  const [firstName,  setFirstName]  = useState(record?.full_name_first   ?? '')
  const [middleName, setMiddleName] = useState(record?.full_name_middle  ?? '')
  const [pwdId,      setPwdId]      = useState(record?.pwd_id_number     ?? '')
  const [dob,        setDob]        = useState(record?.date_of_birth     ?? '')
  const [sex,        setSex]        = useState<string>(record?.sex       ?? '')
  const [civilStatus,setCivilStatus]= useState(record?.civil_status      ?? '')

  // II. Address
  const [street, setStreet] = useState(record?.house_number_street ?? '')
  const barangay       = '10'
  const cityMunicipality = 'Bacolod City'

  // III. Disability
  const [disabilities, setDisabilities] = useState<string[]>(record?.disability_type ?? [])

  // VI. Employment
  const [employmentStatus, setEmploymentStatus] = useState(record?.employment_status ?? '')
  const [occupation,       setOccupation]       = useState(record?.occupation        ?? '')
  const [monthlyIncome,    setMonthlyIncome]     = useState(
    record?.monthly_income != null ? String(record.monthly_income) : ''
  )

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function toggleDisability(d: string) {
    setDisabilities(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!lastName.trim() || !firstName.trim()) {
      setError('Last name and first name are required.')
      return
    }
    setLoading(true)
    setError('')

    const payload = {
      full_name_first:    firstName.trim(),
      full_name_middle:   middleName.trim() || null,
      full_name_last:     lastName.trim(),
      pwd_id_number:      pwdId.trim()      || null,
      date_of_birth:      dob               || null,
      sex:                (sex as 'Male' | 'Female') || null,
      civil_status:       civilStatus       || null,
      house_number_street:street.trim()     || null,
      barangay,
      city_municipality:  cityMunicipality,
      disability_type:    disabilities.length > 0 ? disabilities : null,
      employment_status:  employmentStatus  || null,
      occupation:         occupation.trim() || null,
      monthly_income:     monthlyIncome ? parseFloat(monthlyIncome) : null,
    }

    // Attach encoded_by for new records
    const { data: { user } } = await supabase.auth.getUser()

    let data: PwdProfile | null = null
    let err: string | null = null

    if (isEdit) {
      const res = await supabase
        .from('pwd_profiles')
        .update(payload)
        .eq('id', record!.id)
        .select()
        .single()
      data = res.data
      err  = res.error?.message ?? null
    } else {
      const res = await supabase
        .from('pwd_profiles')
        .insert({ ...payload, encoded_by: user?.id ?? null })
        .select()
        .single()
      data = res.data
      err  = res.error?.message ?? null
    }

    setLoading(false)
    if (err || !data) { setError(err ?? 'Unexpected error. Please try again.'); return }
    onSaved(data)
  }

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-lg text-gray-900" style={{ fontFamily: 'var(--font-dm-serif)' }}>
            {isEdit ? 'Edit PWD Record' : 'Encode New PWD Record'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-7">

            {/* ── I. Personal Information ── */}
            <div>
              <SectionTitle num="I" title="Personal Information" />
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="col-span-2">
                  <Label>Last Name *</Label>
                  <Input id="lastName" value={lastName} onChange={setLastName} placeholder="e.g. Santos" required />
                </div>
                <div className="col-span-2">
                  <Label>First Name *</Label>
                  <Input id="firstName" value={firstName} onChange={setFirstName} placeholder="e.g. Ricardo" required />
                </div>
                <div className="col-span-2">
                  <Label>Middle Name</Label>
                  <Input id="middleName" value={middleName} onChange={setMiddleName} placeholder="e.g. Dela Cruz" />
                </div>
                <div className="col-span-2">
                  <Label>PWD ID Number</Label>
                  <Input id="pwdId" value={pwdId} onChange={setPwdId} placeholder="00-0000-000-0000000" />
                </div>
                <div className="col-span-2">
                  <Label>Date of Birth</Label>
                  <Input id="dob" type="date" value={dob} onChange={setDob} />
                </div>
                <div className="col-span-2">
                  <Label>Sex</Label>
                  <RadioGroup
                    name="sex"
                    options={['Male', 'Female']}
                    value={sex}
                    onChange={setSex}
                  />
                </div>
              </div>
              <div>
                <Label>Civil Status</Label>
                <RadioGroup
                  name="civil"
                  options={CIVIL_STATUS_OPTIONS}
                  value={civilStatus}
                  onChange={setCivilStatus}
                />
              </div>
            </div>

            {/* ── II. Address ── */}
            <div>
              <SectionTitle num="II" title="Address" />
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label>House Number / Street</Label>
                  <Input id="street" value={street} onChange={setStreet} placeholder="e.g. 123 Rizal St." />
                </div>
                <div>
                  <Label>Barangay</Label>
                  <input
                    value={barangay} readOnly
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div className="col-span-3">
                  <Label>City / Municipality</Label>
                  <input
                    value={cityMunicipality} readOnly
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* ── III. Type of Disability ── */}
            <div>
              <SectionTitle num="III" title="Type of Disability" />
              <div className="grid grid-cols-2 gap-2">
                {DISABILITY_TYPES.map(d => (
                  <label key={d} className="flex items-center gap-2 text-sm cursor-pointer py-1 px-2 rounded-lg hover:bg-green-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={disabilities.includes(d)}
                      onChange={() => toggleDisability(d)}
                      className="accent-green-500 w-3.5 h-3.5 flex-shrink-0"
                    />
                    <span className="text-gray-700">{d}</span>
                  </label>
                ))}
              </div>
              {disabilities.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {disabilities.map(d => (
                    <span key={d} className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-md">
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── VI. Employment ── */}
            <div>
              <SectionTitle num="VI" title="Employment Information" />
              <div className="mb-3">
                <Label>Employment Status</Label>
                <RadioGroup
                  name="employment"
                  options={EMPLOYMENT_STATUS_OPTIONS}
                  value={employmentStatus}
                  onChange={setEmploymentStatus}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Occupation</Label>
                  <Input id="occupation" value={occupation} onChange={setOccupation} placeholder="e.g. E-Bike Driver" />
                </div>
                <div>
                  <Label>Monthly Income (₱)</Label>
                  <Input id="income" type="number" value={monthlyIncome} onChange={setMonthlyIncome} placeholder="0.00" />
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center gap-3 flex-shrink-0">
            {error && (
              <div className="flex-1 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                {error}
              </div>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-sm font-bold transition-colors"
              >
                {loading ? 'Saving…' : isEdit ? '✓ Update Record' : '💾 Save Record'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
