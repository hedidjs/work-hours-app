import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - get business details
export async function GET() {
  try {
    let business = await prisma.businessDetails.findFirst()

    if (!business) {
      // יצירת רשומה ריקה אם אין
      business = await prisma.businessDetails.create({
        data: {}
      })
    }

    return NextResponse.json({
      logo: business.logo || '',
      name: business.name,
      businessNumber: business.businessNumber,
      address: business.address,
      phone: business.phone,
      email: business.email,
      bankName: business.bankName,
      bankBranch: business.bankBranch,
      bankAccount: business.bankAccount
    })
  } catch (error) {
    console.error('Get business details error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT - update business details
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()

    let business = await prisma.businessDetails.findFirst()

    if (business) {
      business = await prisma.businessDetails.update({
        where: { id: business.id },
        data: {
          logo: data.logo,
          name: data.name || '',
          businessNumber: data.businessNumber || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          bankName: data.bankName || '',
          bankBranch: data.bankBranch || '',
          bankAccount: data.bankAccount || ''
        }
      })
    } else {
      business = await prisma.businessDetails.create({
        data: {
          logo: data.logo,
          name: data.name || '',
          businessNumber: data.businessNumber || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          bankName: data.bankName || '',
          bankBranch: data.bankBranch || '',
          bankAccount: data.bankAccount || ''
        }
      })
    }

    return NextResponse.json({
      logo: business.logo || '',
      name: business.name,
      businessNumber: business.businessNumber,
      address: business.address,
      phone: business.phone,
      email: business.email,
      bankName: business.bankName,
      bankBranch: business.bankBranch,
      bankAccount: business.bankAccount
    })
  } catch (error) {
    console.error('Update business details error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
