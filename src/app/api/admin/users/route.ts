import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServiceRoleClient } from '@/lib/supabase-admin'
import { createSupabaseRouteClient } from '@/lib/supabase-route'
import {
  checkRateLimit,
  getClientIP,
  isValidEmail,
  sanitizeString,
} from '@/lib/security'
import { isDoctorSpecialty } from '@/lib/specialties'

export const dynamic = 'force-dynamic'

const ROLES = ['PATIENT', 'DOCTOR', 'ADMIN'] as const
type Role = (typeof ROLES)[number]

function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

export async function POST(request: Request) {
  try {
    const clientIP = getClientIP(request.headers)
    if (checkRateLimit(`admin-create-user-${clientIP}`, 20, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    console.log('Admin create-user request received')

    const supabase = await createSupabaseRouteClient()
    const {
      data: { user: caller },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !caller) {
      console.error('Admin create-user: not authenticated', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const callerProfile = await prisma.user.findUnique({
      where: { id: caller.id },
      select: { role: true },
    })

    if (callerProfile?.role !== 'ADMIN') {
      console.error('Admin create-user: caller is not ADMIN', caller.id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const name = typeof body.name === 'string' ? sanitizeString(body.name) : ''
    const phone = typeof body.phone === 'string' ? sanitizeString(body.phone) : ''
    const address = typeof body.address === 'string' ? sanitizeString(body.address) : ''
    const role = body.role
    const specialtyRaw = typeof body.specialty === 'string' ? body.specialty.trim() : ''

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }
    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: 'Name is required (minimum 2 characters)' },
        { status: 400 }
      )
    }
    if (!isRole(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const specialty = role === 'DOCTOR' ? specialtyRaw : null
    if (role === 'DOCTOR' && (!specialty || !isDoctorSpecialty(specialty))) {
      return NextResponse.json(
        { error: 'Please choose a valid doctor specialty' },
        { status: 400 }
      )
    }

    console.log('Creating Auth user via Admin API:', email, role)
    const admin = createServiceRoleClient()
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone, address, role },
    })

    if (createError || !created.user) {
      console.error('Admin createUser failed:', createError)
      const message = createError?.message || 'Failed to create auth user'
      const status = /already|registered|exists/i.test(message) ? 409 : 400
      return NextResponse.json({ error: message }, { status })
    }

    const authId = created.user.id
    console.log('Auth user created:', authId)

    try {
      const user = await prisma.user.create({
        data: {
          id: authId,
          email,
          name,
          phone: phone || null,
          address: address || null,
          role,
          specialty,
        },
      })

      console.log('User profile created:', user.id, user.role)
      return NextResponse.json({ user })
    } catch (profileError: unknown) {
      console.error('Prisma profile create failed, rolling back Auth user:', profileError)
      const { error: deleteError } = await admin.auth.admin.deleteUser(authId)
      if (deleteError) {
        console.error('Failed to roll back Auth user:', authId, deleteError)
      }

      const prismaError = profileError as { code?: string; message?: string }
      if (prismaError.code === 'P2002') {
        return NextResponse.json({ error: 'User already exists' }, { status: 409 })
      }

      return NextResponse.json(
        { error: prismaError.message || 'Failed to create user profile' },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    console.error('Admin create-user error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create user'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
