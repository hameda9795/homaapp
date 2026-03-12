import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalJobs, sentJobs, todayJobs, profile] = await Promise.all([
      prisma.jobApplication.count({
        where: { userId: session.user.id },
      }),
      prisma.jobApplication.count({
        where: {
          userId: session.user.id,
          status: { in: ['SENT', 'APPLIED'] },
        },
      }),
      prisma.jobApplication.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: today },
        },
      }),
      prisma.userProfile.findUnique({
        where: { userId: session.user.id },
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
