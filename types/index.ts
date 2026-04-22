export type Sex = 'Male' | 'Female'

export interface PwdProfile {
  id: string
  created_at: string
  full_name_first: string
  full_name_middle?: string
  full_name_last: string
  pwd_id_number?: string
  date_of_birth?: string
  sex?: Sex
  civil_status?: string
  house_number_street?: string
  barangay: string
  city_municipality: string
  disability_type?: string[]
  employment_status?: string
  occupation?: string
  monthly_income?: number
  encoded_by?: string
}

export type PwdProfileInsert = Omit<PwdProfile, 'id' | 'created_at'>

export const DISABILITY_TYPES = [
  'Physical Orthopedic',
  'Psychosocial Disability',
  'Intellectual Disability',
  'Speech Language Impairment',
  'Learning Disability',
  'Visual Disability',
  'Mental Disability',
  'Cancer (RA 11215)',
  'Deaf or Hard of Hearing',
  'Rare Disease (RA10747)',
] as const

export const CIVIL_STATUS_OPTIONS = [
  'Single',
  'Married',
  'Widowed',
  'Separated',
  'Cohabitation (live-in)',
] as const

export const EMPLOYMENT_STATUS_OPTIONS = [
  'Employed',
  'Self-Employed',
  'Unemployed',
  'Student',
  'Retired',
] as const
