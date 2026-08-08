import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Public list of doctors for the booking form
export async function GET() {
  try {
    console.log('Fetching doctors list')
    const doctors = await prisma.user.findMany({
      where: {
        role: 'DOCTOR'
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log('Doctors fetched:', doctors.length)
    return NextResponse.json(doctors)
  } catch (error) {
    console.error('Error fetching doctors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch doctors' },
      { status: 500 }
    )
  }
} 