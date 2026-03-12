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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    // Check daily limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const jobsToday = await prisma.jobApplication.count({
      where: {
        userId: session.user.id,
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

    const jobsToProcess = Math.min(remainingJobs, 10) // Process max 10 per request
    const allJobs: JobSearchResult[] = []

    // Search for each job title
    for (const jobTitle of profile.jobTitles.slice(0, 2)) {
      try {
        const jobs = await searchJobs(
          jobTitle,
          profile.location || 'Netherlands',
          1,
          1
        )
        allJobs.push(...jobs)
        
        // Rate limiting
        await delay(1000)
      } catch (error) {
        console.error(`Error searching jobs for ${jobTitle}:`, error)
      }
    }

    // Deduplicate and limit jobs
    const uniqueJobs = allJobs
      .filter((job, index, self) => 
        index === self.findIndex(j => j.job_id === job.job_id)
      )
      .slice(0, jobsToProcess)

    const processedJobs = []

    // Process each job
    for (const job of uniqueJobs) {
      try {
        // Check if job already exists
        const existingJob = await prisma.jobApplication.findFirst({
          where: {
            userId: session.user.id,
            jobId: job.job_id,
          },
        })

        if (existingJob) {
          continue
        }

        // Find HR email
        const { email: hrEmail, source: emailSource } = await findHREmail(
          job.employer_name,
          job.employer_website
        )

        // Create job application
        const jobApplication = await prisma.jobApplication.create({
          data: {
            userId: session.user.id,
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

        // Generate cover letter if HR email found and we have resume text
        if (hrEmail && profile.resumeText && profile.resumeText !== 'Resume text extraction pending...') {
          try {
            const coverLetter = await generateCoverLetter(
              job.job_title,
              job.employer_name,
              job.job_description,
              profile.resumeText,
              user?.name || 'Candidate'
            )

            await prisma.jobApplication.update({
              where: { id: jobApplication.id },
              data: {
                coverLetter,
                status: 'COVER_LETTER_GENERATED',
              },
            })

            jobApplication.coverLetter = coverLetter
            jobApplication.status = 'COVER_LETTER_GENERATED'
          } catch (error) {
            console.error('Error generating cover letter:', error)
          }
        }

        processedJobs.push(jobApplication)

        // Rate limiting between jobs
        await delay(2000)
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
