import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
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

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalJobs, sentJobs, todayJobs, profile] = await Promise.all([
      prisma.jobApplication.count({
        where: { userId: user.id },
      }),
      prisma.jobApplication.count({
        where: {
          userId: user.id,
          status: { in: ['SENT', 'APPLIED'] },
        },
      }),
      prisma.jobApplication.count({
        where: {
          userId: user.id,
          createdAt: { gte: today },
        },
      }),
      prisma.userProfile.findUnique({
        where: { userId: user.id },
      }),
    ])

    return NextResponse.json({
      total: totalJobs,
      sent: sentJobs,
      today: todayJobs,
      limit: profile?.dailyJobLimit || 10,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
