import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateCoverLetter } from '@/lib/openai'

export async function POST(request: NextRequest) {
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

    const { jobId } = await request.json()

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    const [profile, job] = await Promise.all([
      prisma.userProfile.findUnique({
        where: { userId: user.id },
      }),
      prisma.jobApplication.findFirst({
        where: {
          id: jobId,
          userId: user.id,
        },
      }),
    ])

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (!profile?.resumeText || profile.resumeText === 'Resume text extraction pending...') {
      return NextResponse.json({ error: 'Resume not available' }, { status: 400 })
    }

    const coverLetter = await generateCoverLetter(
      job.jobTitle,
      job.employerName,
      job.jobDescription || '',
      profile.resumeText,
      user?.name || 'Candidate'
    )

    // Update job with cover letter
    await prisma.jobApplication.update({
      where: { id: jobId },
      data: {
        coverLetter,
        status: 'COVER_LETTER_GENERATED',
      },
    })

    return NextResponse.json({ coverLetter })
  } catch (error) {
    console.error('Error generating cover letter:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
