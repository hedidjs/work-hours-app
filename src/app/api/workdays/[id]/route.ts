import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - get single work day
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const workDay = await prisma.workDay.findUnique({
      where: { id },
      include: { segments: true }
    })

    if (!workDay) {
      return NextResponse.json({ error: 'Work day not found' }, { status: 404 })
    }

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
    console.error('Get work day error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT - update work day
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    // מחיקת segments קיימים
    await prisma.workSegment.deleteMany({
      where: { workDayId: id }
    })

    const workDay = await prisma.workDay.update({
      where: { id },
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
    console.error('Update work day error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE - delete work day
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.workDay.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete work day error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
