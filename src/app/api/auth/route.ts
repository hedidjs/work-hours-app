import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET - check if authenticated (based on password in header)
export async function GET(request: NextRequest) {
  try {
    const password = request.headers.get('x-password')

    if (!password) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    let user = await prisma.user.findFirst()

    if (!user) {
      // יצירת משתמש ראשוני עם סיסמת ברירת מחדל
      const hashedPassword = await bcrypt.hash('2Lol.net', 10)
      user = await prisma.user.create({
        data: { password: hashedPassword }
      })
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (isValid) {
      return NextResponse.json({ authenticated: true })
    }

    return NextResponse.json({ authenticated: false }, { status: 401 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - login
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    let user = await prisma.user.findFirst()

    if (!user) {
      // יצירת משתמש ראשוני עם סיסמת ברירת מחדל
      const hashedPassword = await bcrypt.hash('2Lol.net', 10)
      user = await prisma.user.create({
        data: { password: hashedPassword }
      })
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (isValid) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT - change password
export async function PUT(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json()

    const user = await prisma.user.findFirst()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isValid = await bcrypt.compare(currentPassword, user.password)

    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
