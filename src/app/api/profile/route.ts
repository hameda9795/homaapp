import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First try to find user by ID
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    // If not found by ID, try by email (fallback for old sessions)
    if (!user && session.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            image: session.user.image,
          },
        })
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    })

    return NextResponse.json({ profile, user: { id: user.id, email: user.email, name: user.name } })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    
    const resume = formData.get('resume') as File | null
    const jobTitles = formData.get('jobTitles') as string
    const education = formData.get('education') as string
    const location = formData.get('location') as string
    const languages = formData.get('languages') as string
    const sources = JSON.parse(formData.get('sources') as string || '[]')
    const dailyJobLimit = parseInt(formData.get('dailyJobLimit') as string || '10')

    // Find or create user by ID (more reliable than email)
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      // Create user with ID from session
      user = await prisma.user.create({
        data: {
          id: session.user.id,
          email: session.user.email || `user-${session.user.id}@placeholder.com`,
          name: session.user.name,
          image: session.user.image,
        },
      })
    }

    let resumeUrl: string | null = null
    let resumeText: string | null = null

    // Upload resume to Vercel Blob if provided
    if (resume) {
      try {
        const blob = await put(`resumes/${user.id}-${Date.now()}-${resume.name}`, resume, {
          access: 'public',
        })
        resumeUrl = blob.url
        resumeText = "Resume uploaded successfully. Text extraction pending..."
      } catch (uploadError) {
        console.error('Error uploading resume:', uploadError)
        // Continue without resume if upload fails
      }
    }

    // Upsert profile
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        ...(resumeUrl && { resumeUrl }),
        ...(resumeText && { resumeText }),
        jobTitles: jobTitles.split(',').map(t => t.trim()).filter(Boolean),
        education,
        location,
        languages: languages.split(',').map(l => l.trim()).filter(Boolean),
        sources,
        dailyJobLimit,
        isOnboarded: true,
      },
      create: {
        userId: user.id,
        resumeUrl,
        resumeText,
        jobTitles: jobTitles.split(',').map(t => t.trim()).filter(Boolean),
        education,
        location,
        languages: languages.split(',').map(l => l.trim()).filter(Boolean),
        sources,
        dailyJobLimit,
        isOnboarded: true,
      },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error saving profile:', error)
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
  }
}
