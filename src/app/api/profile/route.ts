import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    let resumeUrl: string | null = null
    let resumeText: string | null = null

    // Process resume if uploaded
    if (resume) {
      const bytes = await resume.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Save file
      const uploadDir = join(process.cwd(), 'public', 'uploads')
      const fileName = `${session.user.id}-${Date.now()}-${resume.name}`
      const filePath = join(uploadDir, fileName)
      
      await writeFile(filePath, buffer)
      resumeUrl = `/uploads/${fileName}`

      // For PDF/DOCX text extraction, we'll need additional libraries
      // For now, we'll store the file and extract text client-side or use a service
      resumeText = "Resume text extraction pending..."
    }

    // Upsert profile
    const profile = await prisma.userProfile.upsert({
      where: { userId: session.user.id },
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
        userId: session.user.id,
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
