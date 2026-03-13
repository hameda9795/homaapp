import { NextRequest, NextResponse } from 'next/server'
import { searchJobs } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const { query, location = 'Netherlands', page = 1 } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    if (!process.env.RAPIDAPI_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const jobs = await searchJobs(query, location, page, 1)

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('Error searching jobs:', error)
    return NextResponse.json({ error: 'Failed to search jobs', details: String(error) }, { status: 500 })
  }
}
