'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppState } from '@/lib/store'
import { Search, Loader2 } from 'lucide-react'

export default function Step1() {
  const router = useRouter()
  const { state, updateState } = useAppState()
  const [query, setQuery] = useState(state.query)
  const [location, setLocation] = useState(state.location)
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState<Array<{
    job_id: string
    employer_name: string
    employer_website: string | null
    job_title: string
    job_description: string
    job_apply_link: string
    job_location: string
    job_city: string | null
    job_country: string | null
  }>>([])

  const handleSearch = async () => {
    if (!query.trim()) return
    
    setLoading(true)
    console.log('Step1: Starting search for:', query, location)
    
    try {
      const response = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, location }),
      })
      
      console.log('Step1: Response status:', response.status)

      const data = await response.json()
      console.log('Step1: Response data:', data)
      
      if (response.ok) {
        setJobs(data.jobs || [])
      } else {
        alert('Error: ' + (data.error || 'Unknown error') + '\n' + (data.details || ''))
      }
    } catch (error: Error | unknown) {
      console.error('Step1 Error:', error)
      const message = error instanceof Error ? error.message : String(error)
      alert('Failed to search jobs: ' + message)
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    const selectedJobs = jobs.map(job => ({ ...job, selected: true }))
    updateState({ 
      step: 2, 
      query, 
      location, 
      jobs: selectedJobs 
    })
    router.push('/step2')
  }

  return (
    <div className="container max-w-4xl py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Step 1: Find Jobs</CardTitle>
          <CardDescription>
            Search for jobs based on your preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="query">Job Title</Label>
              <Input
                id="query"
                placeholder="e.g. Software Engineer"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g. Amsterdam"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={handleSearch} 
            disabled={loading || !query.trim()}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Search Jobs
          </Button>

          {jobs.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Found {jobs.length} jobs:</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {jobs.map((job) => (
                  <Card key={job.job_id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{job.job_title}</h4>
                        <p className="text-sm text-muted-foreground">{job.employer_name}</p>
                        <p className="text-sm text-muted-foreground">{job.job_location}</p>
                      </div>
                      <a 
                        href={job.job_apply_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline"
                      >
                        View Job
                      </a>
                    </div>
                  </Card>
                ))}
              </div>

              <Button 
                onClick={handleContinue}
                className="w-full"
                variant="default"
              >
                Continue to Step 2 →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
