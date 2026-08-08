export const DOCTOR_SPECIALTIES = [
  'Cardiology',
  'Pediatrics',
  'Dermatology',
  'Neurology',
  'Orthopedics',
  'General Practice',
  'Ophthalmology',
  'ENT',
  'Psychiatry',
  'Gynecology',
] as const

export type DoctorSpecialty = (typeof DOCTOR_SPECIALTIES)[number]

export function isDoctorSpecialty(value: string): value is DoctorSpecialty {
  return (DOCTOR_SPECIALTIES as readonly string[]).includes(value)
}
