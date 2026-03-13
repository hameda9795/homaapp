'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useAppState } from '@/lib/store'
import { Mail, FileText, ExternalLink, Eye, RefreshCw, Trash2 } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const { state, updateState, resetState } = useAppState()
  const [selectedJob, setSelectedJob] = useState<any>(null)

  const handleReset = () => {
    if (confirm('Are you sure? All data will be lost.')) {
      resetState()
      router.push('/step1')
    }
  }

  const jobsWithEmail = state.jobs.filter(j => j.hrEmail)
  const jobsWithCoverLetter = state.jobs.filter(j => j.coverLetter)

  return (
    <div className="container py-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.jobs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With HR Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobsWithEmail.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Send</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobsWithCoverLetter.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/step1')}>
              <RefreshCw className="h-4 w-4 mr-1" />
              New Search
            </Button>
            <Button variant="destructive" size="sm" onClick={handleReset}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Job Applications</CardTitle>
          <CardDescription>
            Click on any job to view details, email, and cover letter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Company</th>
                  <th className="text-left py-3 px-2">Position</th>
                  <th className="text-left py-3 px-2">Location</th>
                  <th className="text-left py-3 px-2">HR Email</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.jobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No jobs found. Start a new search.
                    </td>
                  </tr>
                ) : (
                  state.jobs.map((job) => (
                    <tr key={job.job_id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{job.employer_name}</td>
                      <td className="py-3 px-2">{job.job_title}</td>
                      <td className="py-3 px-2">{job.job_location || 'N/A'}</td>
                      <td className="py-3 px-2">
                        {job.hrEmail ? (
                          <span className="text-green-600 text-xs">{job.hrEmail}</span>
                        ) : (
                          <Badge variant="outline">Not Found</Badge>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {job.coverLetter ? (
                          <Badge className="bg-green-100 text-green-800">Ready</Badge>
                        ) : job.hrEmail ? (
                          <Badge variant="secondary">Email Found</Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedJob(job)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {job.job_apply_link && (
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              title="View Job Posting"
                            >
                              <a href={job.job_apply_link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Job Details Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedJob?.job_title}</DialogTitle>
            <DialogDescription>
              {selectedJob?.employer_name} - {selectedJob?.job_location}
            </DialogDescription>
          </DialogHeader>
          
          {selectedJob && (
            <div className="space-y-6 mt-4">
              {/* HR Email Section */}
              {selectedJob.hrEmail && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4" />
                    <span className="font-medium">HR Email</span>
                  </div>
                  <p className="text-sm">{selectedJob.hrEmail}</p>
                  {selectedJob.emailSource && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Source: {selectedJob.emailSource}
                    </p>
                  )}
                </div>
              )}

              {/* Cover Letter Section */}
              {selectedJob.coverLetter && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">Cover Letter</span>
                  </div>
                  {selectedJob.emailSubject && (
                    <p className="text-sm font-medium mb-2">
                      Subject: {selectedJob.emailSubject}
                    </p>
                  )}
                  <div className="whitespace-pre-wrap text-sm font-mono bg-background p-3 rounded border">
                    {selectedJob.coverLetter}
                  </div>
                </div>
              )}

              {/* Job Description */}
              {selectedJob.job_description && (
                <div>
                  <h4 className="font-medium mb-2">Job Description</h4>
                  <div className="text-sm text-muted-foreground max-h-40 overflow-y-auto">
                    {selectedJob.job_description}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {selectedJob.job_apply_link && (
                  <Button asChild className="flex-1">
                    <a href={selectedJob.job_apply_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Job Posting
                    </a>
                  </Button>
                )}
                {selectedJob.hrEmail && (
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      const subject = selectedJob.emailSubject || `Application: ${selectedJob.job_title}`
                      const body = selectedJob.coverLetter || ''
                      window.open(`mailto:${selectedJob.hrEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Open in Email Client
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
