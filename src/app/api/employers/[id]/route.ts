import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - get single employer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const employer = await prisma.employer.findUnique({
      where: { id },
      include: { bonuses: true }
    })

    if (!employer) {
      return NextResponse.json({ error: 'Employer not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: employer.id,
      name: employer.name,
      dailyRate: employer.dailyRate,
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
    console.error('Get employer error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT - update employer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    // מחיקת תוספות קיימות
    await prisma.bonus.deleteMany({
      where: { employerId: id }
    })

    // עדכון המעסיק עם תוספות חדשות
    const employer = await prisma.employer.update({
      where: { id },
      data: {
        name: data.name,
        dailyRate: data.dailyRate || 0,
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
    console.error('Update employer error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE - delete employer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.employer.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete employer error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
