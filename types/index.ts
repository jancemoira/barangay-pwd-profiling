export type Sex = 'Male' | 'Female'

export interface FamilyMember {
  name: string
  dob: string
  age: string
  status: string
  relationship: string
}

export interface PwdProfile {
  id: string
  created_at: string
  full_name_first: string
  full_name_middle?: string
  full_name_last: string
  suffix?: string            
  pwd_id_number: string      
  date_of_birth?: string
  age: number                
  birth_place?: string       
  sex?: Sex
  civil_status?: string
  nationality?: string      
  religion?: string         
  
  // Address & Contact
  house_number_street?: string
  barangay: string
  city_municipality: string
  province: string           
  zip_code: string           
  contact_no?: string       

  // Disability & Requirements
  disability_type?: string[]
  requirements_met?: string[]

  // Education
  edu_attainment?: string     
  is_studying?: boolean       
  school_name?: string       

  // Employment
  employment_status?: string
  occupation?: string
  employer_name?: string      
  monthly_income?: number
  
  // Family & Misc
  family_composition?: FamilyMember[] 
  remarks?: string                    
  encoded_by?: string

  photo_url?: string;
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
