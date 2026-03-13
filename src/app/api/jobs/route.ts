import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { JobStatus } from '@prisma/client'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('Unauthorized: No session user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user by ID or email
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user && session.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as JobStatus | null
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Prisma.JobApplicationWhereInput = { userId: user.id }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { employerName: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } },
        { jobLocation: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [jobs, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.jobApplication.count({ where }),
    ])

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('Unauthorized: No session user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user by ID or email
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user && session.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { jobId, status } = body

    if (!jobId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const job = await prisma.jobApplication.updateMany({
      where: {
        id: jobId,
        userId: user.id,
      },
      data: {
        status,
        ...(status === 'SENT' || status === 'APPLIED' ? { appliedAt: new Date() } : {}),
      },
    })

    return NextResponse.json({ success: true, job })
  } catch (error) {
    console.error('Error updating job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
