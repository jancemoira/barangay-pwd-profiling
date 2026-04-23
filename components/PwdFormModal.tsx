'use client'
import { useState, useEffect } from 'react'
import { X, ChevronDown, SaveIcon, CheckCircle, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { PwdProfile } from '@/types'
import {
  DISABILITY_TYPES,
  CIVIL_STATUS_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
} from '@/types'

const EDUCATION_ATTAINMENT_OPTIONS = [
  'No Formal Education',
  'Elementary Level (Undergraduate)',
  'Elementary Graduate',
  'Junior High School Level (Undergraduate)',
  'Junior High School Graduate',
  'Senior High School Level (Undergraduate)',
  'Senior High School Graduate',
  'Vocational / Technical Course Level',
  'Vocational / Technical Course Graduate',
  'College Level (Undergraduate)',
  'College Graduate',
  'Postgraduate Level (Master\'s)',
  'Master\'s Degree Graduate',
  'Doctorate Level (PhD, EdD, etc.)',
  'Doctorate Degree Graduate'
]

interface Props {
  record: PwdProfile | null
  onClose: () => void
  onSaved: (r: PwdProfile) => void
}

// ── Reusable components ──────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{children}</label>
}

function Input({ id, value, onChange, placeholder, type = 'text', required, readOnly }: any) {
  return (
    <input
      id={id} type={type} value={value} required={required} readOnly={readOnly}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none 
        ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gray-50 focus:border-[#948c00] focus:bg-white'}`}
    />
  )
}

function SectionTitle({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-bold text-[#948c00] uppercase tracking-widest mb-3 pb-1.5 border-b border-[#948c00]">
      <span className="w-5 h-5 bg-yellow-700 text-white rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0">{num}</span>
      {title}
    </div>
  )
}

function RadioGroup({ name, options, value, onChange }: any) {
  return (
    <div className="flex flex-wrap gap-3 mt-1">
      {options.map((opt: string) => (
        <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input type="radio" name={name} checked={value === opt} onChange={() => onChange(opt)} className="accent-yellow-500" />
          {opt}
        </label>
      ))}
    </div>
  )
}

export default function PwdFormModal({ record, onClose, onSaved }: Props) {
  const supabase = createClient()
  const isEdit = !!record

  // 1. All Hooks MUST be at the top level
  const [photoUrl, setPhotoUrl] = useState(record?.photo_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // I. Personal Info
  const [lastName, setLastName] = useState(record?.full_name_last ?? '')
  const [firstName, setFirstName] = useState(record?.full_name_first ?? '')
  const [middleName, setMiddleName] = useState(record?.full_name_middle ?? '')
  const [suffix, setSuffix] = useState(record?.suffix ?? '') 
  const [pwdId, setPwdId] = useState(record?.pwd_id_number ?? '')
  const [dob, setDob] = useState(record?.date_of_birth ?? '')
  const [birthPlace, setBirthPlace] = useState(record?.birth_place ?? '')
  const [sex, setSex] = useState<string>(record?.sex ?? '')
  const [civilStatus, setCivilStatus] = useState(record?.civil_status ?? '')
  const [nationality, setNationality] = useState(record?.nationality ?? '')
  const [religion, setReligion] = useState(record?.religion ?? '')

  // II. Address & Contact
  const [street, setStreet] = useState(record?.house_number_street ?? '')
  const [contactNo, setContactNo] = useState(record?.contact_no ?? '')
  const barangay = '10'
  const cityMunicipality = 'Bacolod City'
  const province = 'Negros Occidental'
  const zipCode = '6100'

  // III. Disability & Requirements
  const [disabilities, setDisabilities] = useState<string[]>(record?.disability_type ?? [])
  const [requirements, setRequirements] = useState<string[]>(record?.requirements_met ?? [])

  // V. Education
  const [attainment, setAttainment] = useState(record?.edu_attainment ?? '')
  const [isStudying, setIsStudying] = useState(record?.is_studying ? 'Yes' : 'No')
  const [schoolName, setSchoolName] = useState(record?.school_name ?? '')

  // VI. Employment
  const [employmentStatus, setEmploymentStatus] = useState(record?.employment_status ?? '')
  const [occupation, setOccupation] = useState(record?.occupation ?? '')
  const [employerName, setEmployerName] = useState(record?.employer_name ?? '')
  const [monthlyIncome, setMonthlyIncome] = useState(record?.monthly_income != null ? String(record.monthly_income) : '')

  // VII. Family & Remarks
  const [family, setFamily] = useState<any[]>(record?.family_composition ?? [])
  const [remarks, setRemarks] = useState(record?.remarks ?? '')

  // ── Helper Functions ──────────────────────────────────────────
  
  function calculateAge(dateString: string): number {
    if (!dateString) return 0
    const today = new Date()
    const birthDate = new Date(dateString)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  async function handlePhotoUpload(file: File) {
    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `profiles/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('pwd-photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('pwd-photos').getPublicUrl(filePath)
      setPhotoUrl(data.publicUrl)
    } catch (err: any) {
      setError('Error uploading image: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const addFamilyMember = () => {
    setFamily([...family, { name: '', dob: '', age: '', status: '', relationship: '' }])
  }

  const updateFamilyMember = (index: number, field: string, value: string) => {
    const updated = [...family]
    updated[index][field] = value
    setFamily(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const calculatedAge = calculateAge(dob)
    if (!lastName.trim() || !firstName.trim() || !pwdId.trim() || !dob.trim() || calculatedAge === 0) {
      setError('Please fill in all mandatory fields (Name, PWD ID, and Date of Birth).')
      return
    }

    setLoading(true)
    setError('')

    const payload = {
      full_name_first: firstName.trim(),
      full_name_middle: middleName.trim() || null,
      full_name_last: lastName.trim(),
      suffix: suffix.trim() || null,
      pwd_id_number: pwdId.trim(),
      date_of_birth: dob || null,
      age: calculatedAge,
      birth_place: birthPlace,
      sex: sex || null,
      civil_status: civilStatus || null,
      nationality,
      religion,
      house_number_street: street.trim() || null,
      barangay,
      city_municipality: cityMunicipality,
      province,
      zip_code: zipCode,
      contact_no: contactNo,
      disability_type: disabilities,
      requirements_met: requirements,
      edu_attainment: attainment,
      is_studying: isStudying === 'Yes',
      school_name: schoolName,
      employment_status: employmentStatus || null,
      occupation: occupation.trim() || null,
      employer_name: employerName,
      monthly_income: monthlyIncome ? parseFloat(monthlyIncome) : null,
      family_composition: family,
      remarks,
      photo_url: photoUrl || null,
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error: dbError } = isEdit 
  ? await supabase.from('pwd_profiles').update(payload).eq('id', record!.id).select()
  : await supabase.from('pwd_profiles').insert([{ ...payload, encoded_by: user?.id }]).select();

    setLoading(false);

    if (dbError) {
      setError(dbError.message);
    } else if (data && data.length > 0) {
      // Only call onSaved if we actually have data back from the DB
      onSaved(data[0]);
    } else {
      setError("The record was saved, but the server didn't return the updated data. Please refresh.");
    }
  }


  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-lg text-gray-900">{isEdit ? 'Edit PWD Record' : 'New PWD Record'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          
          <section>
            <SectionTitle num="0" title="Profile Photo" />
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-white shadow-sm flex-shrink-0">
                {photoUrl ? (
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-[10px] text-center px-2">No Photo</span>
                )}
              </div>
              <div className="space-y-2">
                <Label>Upload Identification Photo</Label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                  disabled={uploading}
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-yellow-50 file:text-[#948c00] hover:file:bg-yellow-100 cursor-pointer"
                />
                {uploading && <p className="text-[10px] text-yellow-600 animate-pulse font-bold">Uploading image...</p>}
              </div>
            </div>
          </section>
          
          {/* I. Personal Information */}
          <section>
            <SectionTitle num="I" title="Personal Information" />
            <div className="grid grid-cols-6 gap-3">
              <div className="col-span-2"><Label>Last Name *</Label><Input value={lastName} onChange={setLastName} placeholder="Last Name" required /></div>
              <div className="col-span-2"><Label>First Name *</Label><Input value={firstName} onChange={setFirstName} placeholder="First Name" required /></div>
              <div className="col-span-1"><Label>Middle Name</Label><Input value={middleName} onChange={setMiddleName} placeholder="Middle Na..." /></div>
              <div className="col-span-1"><Label>Suffix</Label><Input value={suffix} onChange={setSuffix} placeholder="eg. Jr/III" /></div>
              
              <div className="col-span-3"><Label>PWD ID Number *</Label><Input value={pwdId} onChange={setPwdId} required placeholder="00-0000-000-0000000" /></div>
              <div className="col-span-2"><Label>Date of Birth</Label><Input type="date" value={dob} onChange={setDob} /></div>
              <div className="col-span-1"><Label>Age *</Label><Input type="number" value={calculateAge(dob)} readOnly /></div>
              
              <div className="col-span-3"><Label>Birth Place</Label><Input value={birthPlace} onChange={setBirthPlace} placeholder="e.g., Bacolod City"/></div>
              <div className="col-span-3"><Label>Sex</Label><RadioGroup name="sex" options={['Male', 'Female']} value={sex} onChange={setSex} /></div>
              
              <div className="col-span-2"><Label>Nationality</Label><Input value={nationality} onChange={setNationality} placeholder="e.g., Filipino" /></div>
              <div className="col-span-2"><Label>Religion</Label><Input value={religion} onChange={setReligion} placeholder="e.g., Roman Catholic" /></div>
              <div className="col-span-2">
                <Label>Civil Status</Label>
                <select value={civilStatus} onChange={e => setCivilStatus(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50">
                  <option value="">Select...</option>
                  {CIVIL_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* II. Address & Contact */}
          <section>
            <SectionTitle num="II" title="Address & Contact Details" />
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-2"><Label>House Number / Street</Label><Input value={street} onChange={setStreet} placeholder="House Number, Street"/></div>
              <div className="col-span-1"><Label>Barangay</Label><Input value={barangay} readOnly /></div>
              <div className="col-span-1"><Label>City</Label><Input value={cityMunicipality} readOnly /></div>
              <div className="col-span-2"><Label>Province</Label><Input value={province} readOnly /></div>
              <div className="col-span-1"><Label>Zip Code</Label><Input value={zipCode} readOnly /></div>
              <div className="col-span-1">
                <Label>Contact Number</Label>
                <Input value={contactNo} onChange={setContactNo} placeholder="09123456789" />
              </div>
            </div>
          </section>

          {/* ── III. Type of Disability ── */}
          <div>
            <SectionTitle num="III" title="Type of Disability" />
            <div className="grid grid-cols-2 gap-2">
              {DISABILITY_TYPES.map(d => (
                <label key={d} className="flex items-center gap-2 text-sm cursor-pointer py-1 px-2 rounded-lg hover:bg-yellow-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={disabilities.includes(d)}
                    onChange={() => {
                      setDisabilities(prev =>
                        prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
                      )
                    }}
                    className="accent-yellow-500 w-3.5 h-3.5 flex-shrink-0"
                  />
                  <span className="text-gray-700">{d}</span>
                </label>
              ))}
            </div>
            {/* Selected Tags Display */}
            {disabilities.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {disabilities.map(d => (
                  <span key={d} className="text-xs font-semibold bg-yellow-100 text-[#948c00] px-2 py-0.5 rounded-md">
                    {d}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* IV. Requirements Section */}
          <section>
            <SectionTitle num="IV" title="Requirements" />
            <div className="space-y-2 bg-yellow-50/50 p-4 rounded-xl border border-yellow-100">
              {[
                "Bedridden",
                "With severe health condition (Cancer or other Terminal Illness)",
                "Unemployed and has two or more dependents",
                "Living alone",
                "Living with another PWD's or Senior Citizen",
                "Income Eligibility: Annual Income must not exceed ₱ 160,000.00 per Annum",
                "Property Ownership: Applicant not own a real property (Residential, Agricultural, etc.)"
              ].map(req => (
                <label key={req} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="accent-yellow-600" onChange={(e) => {
                    setRequirements(prev => e.target.checked ? [...prev, req] : prev.filter(r => r !== req))
                  }} />
                  {req}
                </label>
              ))}
            </div>
          </section>

          {/* V. Educational Background */}
          <section>
            <SectionTitle num="V" title="Educational Background" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Highest Educational Attainment</Label>
                <select value={attainment} onChange={e => setAttainment(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-[#948c00] focus:bg-white transition-colors">
                  <option value="">Select...</option>
                  {EDUCATION_ATTAINMENT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <Label>Currently Studying?</Label>
                <RadioGroup name="studying" options={['Yes', 'No']} value={isStudying} onChange={setIsStudying} />
              </div>
              {isStudying === 'Yes' && (
                <div className="col-span-2"><Label>School Name (If applicable)</Label><Input value={schoolName} onChange={setSchoolName} placeholder="e.g., University of St. La Salle" /></div>
              )}
            </div>
          </section>

          {/* VI. Employment Information */}
          <section>
            <SectionTitle num="VI" title="Employment Information" />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2"><Label>Status</Label><RadioGroup name="empStatus" options={EMPLOYMENT_STATUS_OPTIONS} value={employmentStatus} onChange={setEmploymentStatus} /></div>
              <div><Label>Occupation</Label><Input value={occupation} onChange={setOccupation} placeholder="e.g., E-bike Driver" /></div>
              <div><Label>Employer / Business Name</Label><Input value={employerName} onChange={setEmployerName} placeholder="e.g., ABC Corporation" /></div>
              <div><Label>Monthly Income (₱)</Label><Input type="number" value={monthlyIncome} onChange={setMonthlyIncome} placeholder="e.g., 15000" /></div>
            </div>
          </section>

          {/* VII. Family Composition */}
          <section>
            <div className="flex justify-between items-center mb-3">
              <SectionTitle num="VII" title="Family Composition" />
              <button type="button" onClick={addFamilyMember} className="text-[10px] bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded flex items-center gap-1 font-bold uppercase">
                <Plus size={12} /> Add Member
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase">
                    <th className="p-2 border">No.</th>
                    <th className="p-2 border">Name</th>
                    <th className="p-2 border">DOB</th>
                    <th className="p-2 border">Age</th>
                    <th className="p-2 border">Employment Status</th>
                    <th className="p-2 border">Relationship</th>
                    <th className="p-2 border w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {family.map((m, i) => (
                    <tr key={i}>
                      <td className="p-2 border text-center">{i + 1}</td>
                      <td className="p-1 border"><input className="w-full p-1" value={m.name} onChange={e => updateFamilyMember(i, 'name', e.target.value)} /></td>
                      <td className="p-1 border"><input type="date" className="w-full p-1" value={m.dob} onChange={e => updateFamilyMember(i, 'dob', e.target.value)} /></td>
                      <td className="p-1 border"><input type="number" className="w-full p-1 bg-gray-100 text-gray-500 cursor-not-allowed" value={calculateAge(m.dob)} readOnly /></td>
                      <td className="p-1 border"><input className="w-full p-1" value={m.status} onChange={e => updateFamilyMember(i, 'status', e.target.value)} /></td>
                      <td className="p-1 border"><input className="w-full p-1" value={m.relationship} onChange={e => updateFamilyMember(i, 'relationship', e.target.value)} /></td>
                      <td className="p-1 border text-center">
                        <button type="button" onClick={() => setFamily(family.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* VII. Remarks */}
          <section>
            <SectionTitle num="VII" title="Remarks" />
            <textarea 
              value={remarks} 
              onChange={e => setRemarks(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 h-24 focus:outline-none focus:border-[#948c00]"
              placeholder="Enter any additional notes..."
            />
          </section>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex items-center gap-3">
          {error && <div className="flex-1 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">{error}</div>}
          <div className="flex gap-2 ml-auto">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" onClick={handleSubmit} disabled={loading} className="px-5 py-2 rounded-xl bg-yellow-100 hover:bg-yellow-200 text-[#948c00] text-sm font-bold flex items-center gap-2">
              {loading ? 'Saving...' : isEdit ? <><CheckCircle size={14} /> Update</> : <><SaveIcon size={14} /> Save Record</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}