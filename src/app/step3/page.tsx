'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAppState } from '@/lib/store'
import { Loader2, FileText } from 'lucide-react'

export default function Step3() {
  const router = useRouter()
  const { state, updateState } = useAppState()
  const [resumeText, setResumeText] = useState(state.resumeText)
  const [userName, setUserName] = useState(state.userName)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const jobsWithEmail = state.jobs.filter(j => j.hrEmail)

  // Redirect if no jobs with email
  if (jobsWithEmail.length === 0) {
    return (
      <div className="container max-w-4xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>No Jobs with Email</CardTitle>
            <CardDescription>
              No jobs with HR email found. Please go back to Step 2.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/step2')}>
              ← Back to Step 2
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleGenerate = async () => {
    if (!resumeText.trim() || !userName.trim()) {
      alert('Please enter your name and resume text')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/jobs/generate-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobs: jobsWithEmail,
          resumeText,
          userName
        }),
      })

      const data = await response.json()
      if (response.ok) {
        setResults(data.results || [])
        // Update jobs with cover letter info
        const updatedJobs = state.jobs.map(job => {
          const result = data.results?.find((r: any) => r.job_id === job.job_id)
          return result ? { 
            ...job, 
            coverLetter: result.coverLetter,
            emailSubject: result.emailSubject
          } : job
        })
        updateState({ 
          jobs: updatedJobs,
          resumeText,
          userName
        })
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate cover letters')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    updateState({ step: 4 })
    router.push('/dashboard')
  }

  const jobsWithCoverLetter = results.filter(r => r.hasCoverLetter).length

  return (
    <div className="container max-w-4xl py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Step 3: Generate Cover Letters</CardTitle>
          <CardDescription>
            We will generate personalized cover letters in Dutch for each job
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {results.length === 0 ? (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userName">Your Name</Label>
                  <Input
                    id="userName"
                    placeholder="e.g. John Doe"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resume">Your Resume / CV Text</Label>
                  <Textarea
                    id="resume"
                    placeholder="Paste your resume text here..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Copy and paste your resume text. AI will use this to personalize cover letters.
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={loading || !resumeText.trim() || !userName.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating cover letters...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Cover Letters for {jobsWithEmail.length} Jobs
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">Results:</p>
                <p className="text-sm text-muted-foreground">
                  Generated {jobsWithCoverLetter} cover letters
                </p>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map((result) => (
                  <Card key={result.job_id} className={`p-4 ${result.hasCoverLetter ? 'border-green-500' : 'border-red-300'}`}>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{result.job_title}</h4>
                          <p className="text-sm text-muted-foreground">{result.employer_name}</p>
                        </div>
                        {result.hasCoverLetter && (
                          <div className="text-green-500">
                            <FileText className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      {result.hasCoverLetter && (
                        <div className="bg-muted p-2 rounded text-xs">
                          <p className="font-medium">Subject: {result.emailSubject}</p>
                          <p className="text-muted-foreground mt-1 line-clamp-3">
                            {result.coverLetter}
                          </p>
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
                >
                  View Dashboard →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
