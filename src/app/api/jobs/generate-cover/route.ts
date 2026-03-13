import { NextRequest, NextResponse } from 'next/server'
import { generateCoverLetter } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { jobs, resumeText, userName = 'Candidate' } = await request.json()

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: 'Jobs array is required' }, { status: 400 })
    }

    if (!resumeText) {
      return NextResponse.json({ error: 'Resume text is required' }, { status: 400 })
    }

    const results = []

    for (const job of jobs) {
      try {
        if (!job.hrEmail) {
          results.push({
            job_id: job.job_id,
            employer_name: job.employer_name,
            job_title: job.job_title,
            hrEmail: job.hrEmail,
            coverLetter: null,
            emailSubject: null,
            hasCoverLetter: false,
            error: 'No HR email available',
          })
          continue
        }

        const coverLetter = await generateCoverLetter(
          job.job_title,
          job.employer_name,
          job.job_description || '',
          resumeText,
          userName
        )

        const emailSubject = `Sollicitatie: ${job.job_title} bij ${job.employer_name}`

        results.push({
          job_id: job.job_id,
          employer_name: job.employer_name,
          job_title: job.job_title,
          hrEmail: job.hrEmail,
          coverLetter,
          emailSubject,
          hasCoverLetter: true,
        })
      } catch (error) {
        console.error(`Error generating cover letter for ${job.employer_name}:`, error)
        results.push({
          job_id: job.job_id,
          employer_name: job.employer_name,
          job_title: job.job_title,
          hrEmail: job.hrEmail,
          coverLetter: null,
          emailSubject: null,
          hasCoverLetter: false,
          error: 'Failed to generate cover letter',
        })
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error generating cover letters:', error)
    return NextResponse.json({ error: 'Failed to generate cover letters', details: String(error) }, { status: 500 })
  }
}
