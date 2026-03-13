import { NextRequest, NextResponse } from 'next/server'
import { searchJobs } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    console.log('API: Job search started')
    const { query, location = 'Netherlands', page = 1 } = await request.json()
    console.log('API: Received query:', query, 'location:', location)

    if (!query) {
      console.log('API: Missing query')
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    if (!process.env.RAPIDAPI_KEY) {
      console.log('API: RAPIDAPI_KEY not configured')
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    console.log('API: Calling searchJobs...')
    const jobs = await searchJobs(query, location, page, 1)
    console.log('API: Found jobs:', jobs.length)

    return NextResponse.json({ jobs })
  } catch (error: Error | unknown) {
    console.error('API Error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ 
      error: 'Failed to search jobs', 
      details: message
    }, { status: 500 })
  }
}
