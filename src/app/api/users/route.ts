import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    console.log('Received request to create user')
    const body = await request.json()
    console.log('Request body:', { ...body, password: undefined })

    const { id, email, name, phone, address, role } = body

    if (!id || !email || !name || !phone || !address || !role) {
      console.error('Missing required fields:', { id, email, name, phone, address, role })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Creating user in database:', { id, email, role })
    const user = await prisma.user.create({
      data: {
        id,
        email,
        name,
        phone,
        address,
        role
      }
    })

    console.log('User created successfully:', user.id)
    return NextResponse.json(user)
  } catch (error: unknown) {
    console.error('Error creating user:', error)
    const prismaError = error as { code?: string; message?: string }

    // Prisma unique constraint (email or id already exists)
    if (prismaError.code === 'P2002') {
      console.error('Duplicate user error:', prismaError)
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    if (prismaError.code) {
      console.error('Prisma error:', prismaError)
      return NextResponse.json(
        { error: `Database error: ${prismaError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: prismaError.message || 'Failed to create user profile' },
      { status: 500 }
    )
  }
}
