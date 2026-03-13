import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('Send email: No session user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobId } = await request.json()

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    const job = await prisma.jobApplication.findFirst({
      where: {
        id: jobId,
        userId: session.user.id,
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (!job.hrEmail) {
      return NextResponse.json({ error: 'No HR email available' }, { status: 400 })
    }

    if (!job.coverLetter) {
      return NextResponse.json({ error: 'No cover letter generated' }, { status: 400 })
    }

    // Get user's account for access token
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'google',
      },
    })

    if (!account?.access_token) {
      return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 })
    }

    // Create Gmail API client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
    })

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    // Create email
    const subject = `Sollicitatie: ${job.jobTitle}`
    const emailBody = job.coverLetter

    const email = [
      `To: ${job.hrEmail}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      emailBody,
    ].join('\n')

    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    // Send email
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    })

    // Update job status
    await prisma.jobApplication.update({
      where: { id: jobId },
      data: {
        status: 'SENT',
        appliedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, message: 'Email sent successfully' })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
