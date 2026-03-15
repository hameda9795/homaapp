import { NextRequest, NextResponse } from 'next/server'
import { findHREmail } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const { jobs } = await request.json()

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: 'Jobs array is required' }, { status: 400 })
    }

    const results = []

    for (const job of jobs) {
      try {
        const contact = await findHREmail(
          job.employer_name,
          job.employer_website,
          job.job_title
        )

        results.push({
          job_id: job.job_id,
          employer_name: job.employer_name,
          job_title: job.job_title,
          hrEmail: contact?.email || null,
          emailSource: contact?.source || null,
          contactName: contact?.name || null,
          contactPosition: contact?.position || null,
          confidence: contact?.confidence || 0,
          hasEmail: !!contact?.email,
        })
      } catch (error) {
        console.error(`Error finding email for ${job.employer_name}:`, error)
        results.push({
          job_id: job.job_id,
          employer_name: job.employer_name,
          job_title: job.job_title,
          hrEmail: null,
          emailSource: null,
          hasEmail: false,
          error: 'Failed to find email',
        })
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error finding emails:', error)
    return NextResponse.json({ error: 'Failed to find emails', details: String(error) }, { status: 500 })
  }
}
