import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - get all employers
export async function GET() {
  try {
    const employers = await prisma.employer.findMany({
      include: {
        bonuses: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // המרה לפורמט שהקליינט מצפה לו
    const formattedEmployers = employers.map(emp => ({
      id: emp.id,
      name: emp.name,
      dailyRate: emp.dailyRate,
      dailyHours: emp.dailyHours || 12,
      kmRate: emp.kmRate,
      overtimeRate: emp.overtimeRate,
      vatPercent: emp.vatPercent,
      bonuses: emp.bonuses.map(b => ({
        id: b.id,
        name: b.name,
        amount: b.amount
      }))
    }))

    return NextResponse.json(formattedEmployers)
  } catch (error) {
    console.error('Get employers error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - create new employer
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const employer = await prisma.employer.create({
      data: {
        name: data.name,
        dailyRate: data.dailyRate || 0,
        dailyHours: data.dailyHours || 12,
        kmRate: data.kmRate || 0,
        overtimeRate: data.overtimeRate || 0,
        vatPercent: data.vatPercent || 17,
        bonuses: {
          create: (data.bonuses || []).map((b: { name: string; amount: number }) => ({
            name: b.name,
            amount: b.amount
          }))
        }
      },
      include: { bonuses: true }
    })

    return NextResponse.json({
      id: employer.id,
      name: employer.name,
      dailyRate: employer.dailyRate,
      dailyHours: employer.dailyHours || 12,
      kmRate: employer.kmRate,
      overtimeRate: employer.overtimeRate,
      vatPercent: employer.vatPercent,
      bonuses: employer.bonuses.map(b => ({
        id: b.id,
        name: b.name,
        amount: b.amount
      }))
    })
  } catch (error) {
    console.error('Create employer error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
