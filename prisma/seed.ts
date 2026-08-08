import { PrismaClient, Role, Status } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

const ADMIN_EMAIL = 'admin@clinic.com'

type SeedProfile = {
  email: string
  password: string
  name: string
  role: Role
  phone?: string
  address?: string
  specialty?: string
  description?: string
  image?: string
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(
      `Missing ${name}. Set it in .env before running seed (do not commit real passwords).`
    )
  }
  return value
}

function createAdminClient() {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Ensure Auth user exists and return its id.
 * Creates with Admin API when missing; does not print passwords.
 */
async function ensureAuthUser(
  admin: ReturnType<typeof createAdminClient>,
  profile: SeedProfile
): Promise<string> {
  const { data: listed, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  if (listError) {
    throw new Error(`listUsers failed: ${listError.message}`)
  }

  const existing = listed.users.find(
    (u) => u.email?.toLowerCase() === profile.email.toLowerCase()
  )
  if (existing) {
    return existing.id
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: profile.email,
    password: profile.password,
    email_confirm: true,
    user_metadata: {
      name: profile.name,
      role: profile.role,
      phone: profile.phone ?? '',
      address: profile.address ?? '',
    },
  })

  if (error || !data.user) {
    throw new Error(`createUser(${profile.email}) failed: ${error?.message}`)
  }

  return data.user.id
}

async function upsertProfile(id: string, profile: SeedProfile) {
  const existing = await prisma.user.findUnique({ where: { email: profile.email } })
  if (existing && existing.id !== id) {
    await prisma.user.delete({ where: { id: existing.id } })
  }
  return prisma.user.upsert({
    where: { email: profile.email },
    create: {
      id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      phone: profile.phone,
      address: profile.address,
      specialty: profile.specialty,
      description: profile.description,
      image: profile.image,
    },
    update: {
      name: profile.name,
      role: profile.role,
      phone: profile.phone,
      address: profile.address,
      specialty: profile.specialty,
      description: profile.description,
      image: profile.image,
    },
  })
}

async function main() {
  const doctorPassword = requireEnv('SEED_DOCTOR_PASSWORD')
  const patientPassword = requireEnv('SEED_PATIENT_PASSWORD')
  const admin = createAdminClient()

  // Keep admin Auth account; wipe demo appointments + non-admin profiles
  await prisma.appointment.deleteMany()
  await prisma.user.deleteMany({
    where: { email: { not: ADMIN_EMAIL } },
  })

  // Align admin profile id with Auth (password untouched — you keep remembering it)
  const { data: authUsers, error: authListError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  if (authListError) {
    throw new Error(`listUsers failed: ${authListError.message}`)
  }

  const adminAuth = authUsers.users.find(
    (u) => u.email?.toLowerCase() === ADMIN_EMAIL
  )
  if (!adminAuth) {
    throw new Error(
      `Auth user ${ADMIN_EMAIL} not found. Create/login admin in Supabase Auth first, then re-run seed.`
    )
  }

  const existingAdminProfile = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  })
  if (existingAdminProfile && existingAdminProfile.id !== adminAuth.id) {
    // Re-link profile to Auth id (no password change)
    await prisma.user.delete({ where: { id: existingAdminProfile.id } })
  }
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      id: adminAuth.id,
      email: ADMIN_EMAIL,
      name: 'Clinic Admin',
      role: 'ADMIN',
      phone: '0909999999',
      address: 'Clinic Headquarters',
    },
    update: {
      name: 'Clinic Admin',
      role: 'ADMIN',
      phone: '0909999999',
      address: 'Clinic Headquarters',
    },
  })
  // If upsert matched on email but id still wrong (edge), force id via recreate
  const adminRow = await prisma.user.findUniqueOrThrow({ where: { email: ADMIN_EMAIL } })
  if (adminRow.id !== adminAuth.id) {
    await prisma.user.delete({ where: { id: adminRow.id } })
    await prisma.user.create({
      data: {
        id: adminAuth.id,
        email: ADMIN_EMAIL,
        name: 'Clinic Admin',
        role: 'ADMIN',
        phone: '0909999999',
        address: 'Clinic Headquarters',
      },
    })
  }

  const doctorSeeds: SeedProfile[] = [
    {
      email: 'dr.smith@clinic.com',
      password: doctorPassword,
      name: 'Dr. John Smith',
      role: 'DOCTOR',
      specialty: 'Cardiology',
      description: 'Cardiologist with 15+ years of clinical experience',
      image: '/doctors/doctor1.jpg',
      phone: '0901111001',
    },
    {
      email: 'dr.jones@clinic.com',
      password: doctorPassword,
      name: 'Dr. Sarah Jones',
      role: 'DOCTOR',
      specialty: 'Pediatrics',
      description: 'Pediatrician focused on preventive child care',
      image: '/doctors/doctor2.jpg',
      phone: '0901111002',
    },
    {
      email: 'dr.wilson@clinic.com',
      password: doctorPassword,
      name: 'Dr. Michael Wilson',
      role: 'DOCTOR',
      specialty: 'Dermatology',
      description: 'Board-certified dermatologist',
      image: '/doctors/doctor3.jpg',
      phone: '0901111003',
    },
    {
      email: 'dr.brown@clinic.com',
      password: doctorPassword,
      name: 'Dr. Emily Brown',
      role: 'DOCTOR',
      specialty: 'Neurology',
      description: 'Neurologist specializing in headache and stroke care',
      image: '/doctors/doctor4.jpg',
      phone: '0901111004',
    },
    {
      email: 'dr.davis@clinic.com',
      password: doctorPassword,
      name: 'Dr. Robert Davis',
      role: 'DOCTOR',
      specialty: 'Orthopedics',
      description: 'Orthopedic surgeon — joint and sports injuries',
      image: '/doctors/doctor5.jpg',
      phone: '0901111005',
    },
  ]

  const patientSeeds: SeedProfile[] = [
    {
      email: 'nguyenvana.patient@gmail.com',
      password: patientPassword,
      name: 'Nguyen Van A',
      role: 'PATIENT',
      phone: '0901234567',
      address: '123 Nguyen Hue, District 1, HCMC',
    },
    {
      email: 'tranthib.patient@gmail.com',
      password: patientPassword,
      name: 'Tran Thi B',
      role: 'PATIENT',
      phone: '0902345678',
      address: '456 Le Loi, District 3, HCMC',
    },
    {
      email: 'levanc.patient@gmail.com',
      password: patientPassword,
      name: 'Le Van C',
      role: 'PATIENT',
      phone: '0903456789',
      address: '789 Vo Van Tan, District 3, HCMC',
    },
  ]

  const doctors = []
  for (const profile of doctorSeeds) {
    const id = await ensureAuthUser(admin, profile)
    doctors.push(await upsertProfile(id, profile))
  }

  const patients = []
  for (const profile of patientSeeds) {
    const id = await ensureAuthUser(admin, profile)
    patients.push(await upsertProfile(id, profile))
  }

  const day = 24 * 60 * 60 * 1000
  await prisma.appointment.createMany({
    data: [
      {
        patientId: patients[0].id,
        doctorId: doctors[0].id,
        date: new Date(Date.now() + day),
        time: '09:00',
        status: Status.PENDING,
        notes: 'Annual checkup',
        symptoms: 'Mild headache, fatigue',
      },
      {
        patientId: patients[1].id,
        doctorId: doctors[1].id,
        date: new Date(Date.now() + 2 * day),
        time: '14:30',
        status: Status.CONFIRMED,
        notes: 'Follow-up visit',
        symptoms: 'Low-grade fever, cough',
      },
      {
        patientId: patients[2].id,
        doctorId: doctors[2].id,
        date: new Date(Date.now() + 3 * day),
        time: '10:15',
        status: Status.PENDING,
        notes: 'Dermatology consult',
        symptoms: 'Rash and itching',
      },
      {
        patientId: patients[0].id,
        doctorId: doctors[3].id,
        date: new Date(Date.now() + 4 * day),
        time: '15:45',
        status: Status.COMPLETED,
        notes: 'Neurology consult',
        symptoms: 'Dizziness',
      },
    ],
  })

  console.log('Seed complete (passwords not printed):')
  console.log(`- Admin kept: ${ADMIN_EMAIL}`)
  console.log(`- Doctors: ${doctors.map((d) => d.email).join(', ')}`)
  console.log(`- Patients: ${patients.map((p) => p.email).join(', ')}`)
  console.log(`- Appointments: 4`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
