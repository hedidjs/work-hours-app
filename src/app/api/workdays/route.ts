import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - get all work days
export async function GET() {
  try {
    const workDays = await prisma.workDay.findMany({
      include: { segments: true },
      orderBy: { date: 'desc' }
    })

    // המרה לפורמט שהקליינט מצפה לו
    const formattedWorkDays = workDays.map(day => ({
      id: day.id,
      employerId: day.employerId,
      date: day.date,
      location: day.location,
      startTime: day.startTime,
      endTime: day.endTime,
      kilometers: day.kilometers,
      selectedBonuses: JSON.parse(day.selectedBonuses || '[]'),
      customDailyRate: day.customDailyRate,
      calculationMode: day.calculationMode as 'combined' | 'separate',
      regularHours: day.regularHours,
      overtimeHours: day.overtimeHours,
      totalBeforeVat: day.totalBeforeVat,
      totalWithVat: day.totalWithVat,
      segments: day.segments.map(seg => ({
        id: seg.id,
        location: seg.location,
        startTime: seg.startTime,
        endTime: seg.endTime,
        customDailyRate: seg.customDailyRate,
        selectedBonuses: JSON.parse(seg.selectedBonuses || '[]')
      }))
    }))

    return NextResponse.json(formattedWorkDays)
  } catch (error) {
    console.error('Get work days error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - create new work day
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const workDay = await prisma.workDay.create({
      data: {
        employerId: data.employerId,
        date: data.date,
        location: data.location || '',
        startTime: data.startTime,
        endTime: data.endTime,
        kilometers: data.kilometers || 0,
        selectedBonuses: JSON.stringify(data.selectedBonuses || []),
        customDailyRate: data.customDailyRate,
        calculationMode: data.calculationMode || 'combined',
        regularHours: data.regularHours || 0,
        overtimeHours: data.overtimeHours || 0,
        totalBeforeVat: data.totalBeforeVat || 0,
        totalWithVat: data.totalWithVat || 0,
        segments: {
          create: (data.segments || []).map((seg: {
            location: string;
            startTime: string;
            endTime: string;
            customDailyRate?: number;
            selectedBonuses?: string[];
          }) => ({
            location: seg.location,
            startTime: seg.startTime,
            endTime: seg.endTime,
            customDailyRate: seg.customDailyRate,
            selectedBonuses: JSON.stringify(seg.selectedBonuses || [])
          }))
        }
      },
      include: { segments: true }
    })

    return NextResponse.json({
      id: workDay.id,
      employerId: workDay.employerId,
      date: workDay.date,
      location: workDay.location,
      startTime: workDay.startTime,
      endTime: workDay.endTime,
      kilometers: workDay.kilometers,
      selectedBonuses: JSON.parse(workDay.selectedBonuses || '[]'),
      customDailyRate: workDay.customDailyRate,
      calculationMode: workDay.calculationMode,
      regularHours: workDay.regularHours,
      overtimeHours: workDay.overtimeHours,
      totalBeforeVat: workDay.totalBeforeVat,
      totalWithVat: workDay.totalWithVat,
      segments: workDay.segments.map(seg => ({
        id: seg.id,
        location: seg.location,
        startTime: seg.startTime,
        endTime: seg.endTime,
        customDailyRate: seg.customDailyRate,
        selectedBonuses: JSON.parse(seg.selectedBonuses || '[]')
      }))
    })
  } catch (error) {
    console.error('Create work day error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
