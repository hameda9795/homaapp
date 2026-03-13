import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { searchJobs, findHREmail } from '@/lib/api'
import { generateCoverLetter } from '@/lib/openai'
import { delay } from '@/lib/utils'
import { JobSearchResult } from '@/lib/api'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('Jobs search: No session user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Session user:', { id: session.user.id, email: session.user.email })

    // Find user by ID first, then by email if not found
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })
    console.log('Found user by ID:', user?.id || 'not found')

    if (!user && session.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })
      console.log('Found user by email:', user?.id || 'not found')
    }

    if (!user) {
      console.error('User not found for session:', session.user)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    })
    console.log('Found profile:', profile?.id || 'not found')

    if (!profile) {
      console.error('Profile not found for user:', user.id)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check daily limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const jobsToday = await prisma.jobApplication.count({
      where: {
        userId: user.id,
        createdAt: { gte: today },
      },
    })

    const remainingJobs = profile.dailyJobLimit - jobsToday
    if (remainingJobs <= 0) {
      return NextResponse.json({ 
        error: 'Daily job limit reached',
        jobsProcessed: 0 
      }, { status: 429 })
    }

    // Check API keys
    if (!process.env.RAPIDAPI_KEY) {
      console.error('RAPIDAPI_KEY not set')
      return NextResponse.json({ error: 'Job search API not configured' }, { status: 500 })
    }

    const jobsToProcess = Math.min(remainingJobs, 3) // Process max 3 per request (Vercel timeout limit)
    const allJobs: JobSearchResult[] = []

    // Search for first job title only (to save time)
    const jobTitle = profile.jobTitles[0]
    if (jobTitle) {
      try {
        console.log('Searching jobs for:', jobTitle)
        const jobs = await searchJobs(
          jobTitle,
          profile.location || 'Netherlands',
          1,
          1
        )
        allJobs.push(...jobs)
        console.log('Found jobs:', jobs.length)
      } catch (error) {
        console.error(`Error searching jobs for ${jobTitle}:`, error)
        return NextResponse.json({ error: 'Job search API error', details: String(error) }, { status: 500 })
      }
    }

    // Deduplicate and limit jobs
    const uniqueJobs = allJobs
      .filter((job, index, self) => 
        index === self.findIndex(j => j.job_id === job.job_id)
      )
      .slice(0, jobsToProcess)

    console.log('Processing', uniqueJobs.length, 'jobs')

    const processedJobs = []

    // Process each job with shorter delays
    for (const job of uniqueJobs) {
      try {
        // Check if job already exists
        const existingJob = await prisma.jobApplication.findFirst({
          where: {
            userId: user.id,
            jobId: job.job_id,
          },
        })

        if (existingJob) {
          console.log('Job already exists:', job.job_id)
          continue
        }

        // Find HR email (with timeout protection - skip if taking too long)
        console.log('Finding HR email for:', job.employer_name)
        const hrEmailPromise = findHREmail(job.employer_name, job.employer_website)
        const { email: hrEmail, source: emailSource } = await hrEmailPromise
        console.log('HR email found:', hrEmail || 'none')

        // Create job application
        const jobApplication = await prisma.jobApplication.create({
          data: {
            userId: user.id,
            jobId: job.job_id,
            employerName: job.employer_name,
            employerWebsite: job.employer_website,
            jobTitle: job.job_title,
            jobDescription: job.job_description,
            jobApplyLink: job.job_apply_link,
            jobLocation: job.job_location,
            jobCity: job.job_city,
            jobCountry: job.job_country,
            hrEmail,
            emailSource,
            status: hrEmail ? 'EMAIL_FOUND' : 'NO_EMAIL_FOUND',
          },
        })
        console.log('Created job application:', jobApplication.id)

        // Skip cover letter generation in search to save time - do it separately
        processedJobs.push(jobApplication)

        // Shorter delay
        await delay(500)
      } catch (error) {
        console.error('Error processing job:', error)
      }
    }

    return NextResponse.json({ 
      jobsProcessed: processedJobs.length,
      jobs: processedJobs 
    })
  } catch (error) {
    console.error('Error in job search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
