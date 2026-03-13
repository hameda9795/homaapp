'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useAppState } from '@/lib/store'
import { Loader2, Mail } from 'lucide-react'

export default function Step2() {
  const router = useRouter()
  const { state, updateState } = useAppState()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<any[]>([])

  // Redirect if no jobs
  if (state.jobs.length === 0) {
    return (
      <div className="container max-w-4xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>No Jobs Found</CardTitle>
            <CardDescription>
              Please go back to Step 1 and search for jobs first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/step1')}>
              ← Back to Step 1
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleFindEmails = async () => {
    setLoading(true)
    setProgress(0)
    
    try {
      const response = await fetch('/api/jobs/find-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs: state.jobs }),
      })

      const data = await response.json()
      if (response.ok) {
        setResults(data.results || [])
        // Update jobs with email info
        const updatedJobs = state.jobs.map(job => {
          const result = data.results?.find((r: any) => r.job_id === job.job_id)
          return result ? { 
            ...job, 
            hrEmail: result.hrEmail,
            emailSource: result.emailSource
          } : job
        })
        updateState({ jobs: updatedJobs })
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to find emails')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    updateState({ step: 3 })
    router.push('/step3')
  }

  const jobsWithEmail = results.filter(r => r.hasEmail).length

  return (
    <div className="container max-w-4xl py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Step 2: Find HR Emails</CardTitle>
          <CardDescription>
            We will search for HR email addresses for each company
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {results.length === 0 ? (
            <Button 
              onClick={handleFindEmails} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finding emails... ({progress}%)
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Find HR Emails for {state.jobs.length} Jobs
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">Results:</p>
                <p className="text-sm text-muted-foreground">
                  Found emails for {jobsWithEmail} out of {results.length} companies
                </p>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map((result) => (
                  <Card key={result.job_id} className={`p-4 ${result.hasEmail ? 'border-green-500' : 'border-red-300'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{result.job_title}</h4>
                        <p className="text-sm text-muted-foreground">{result.employer_name}</p>
                        {result.hasEmail ? (
                          <p className="text-sm text-green-600 font-medium">{result.hrEmail}</p>
                        ) : (
                          <p className="text-sm text-red-500">No email found</p>
                        )}
                      </div>
                      {result.hasEmail && (
                        <div className="text-green-500">
                          <Mail className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => setResults([])}
                  variant="outline"
                  className="flex-1"
                >
                  Retry
                </Button>
                <Button 
                  onClick={handleContinue}
                  className="flex-1"
                  disabled={jobsWithEmail === 0}
                >
                  Continue to Step 3 →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
