"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { JobStatus } from "@prisma/client"
import { 
  Search, 
  RefreshCw, 
  Send, 
  Eye, 
  ExternalLink, 
  Mail,
  MapPin,
  Building2,
  Loader2
} from "lucide-react"

interface JobApplication {
  id: string
  jobId: string | null
  employerName: string
  employerWebsite: string | null
  jobTitle: string
  jobDescription: string | null
  jobApplyLink: string | null
  jobLocation: string | null
  jobCity: string | null
  jobCountry: string | null
  hrEmail: string | null
  emailSource: string | null
  coverLetter: string | null
  status: JobStatus
  appliedAt: string | null
  createdAt: string
}

const statusColors: Record<JobStatus, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  PENDING: "secondary",
  EMAIL_FOUND: "default",
  NO_EMAIL_FOUND: "destructive",
  COVER_LETTER_GENERATED: "warning",
  READY_TO_SEND: "default",
  SENT: "success",
  MANUAL_APPLY: "secondary",
  APPLIED: "success",
  REJECTED: "destructive",
}

const statusLabels: Record<JobStatus, string> = {
  PENDING: "Pending",
  EMAIL_FOUND: "Email Found",
  NO_EMAIL_FOUND: "No Email",
  COVER_LETTER_GENERATED: "Cover Letter Ready",
  READY_TO_SEND: "Ready to Send",
  SENT: "Sent",
  MANUAL_APPLY: "Manual Apply",
  APPLIED: "Applied",
  REJECTED: "Rejected",
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [jobs, setJobs] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null)
  const [statusFilter, setStatusFilter] = useState<JobStatus | "ALL">("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    today: 0,
    limit: 10,
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchJobs()
      fetchStats()
    }
  }, [status, router])

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs")
      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (error) {
      console.error("Error fetching jobs:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/profile")
      const data = await response.json()
      if (data.profile) {
        setStats(prev => ({
          ...prev,
          limit: data.profile.dailyJobLimit,
        }))
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const handleSearchJobs = async () => {
    setSearching(true)
    try {
      const response = await fetch("/api/jobs/search", {
        method: "POST",
      })
      const data = await response.json()
      if (response.ok) {
        fetchJobs()
        fetchStats()
      } else {
        alert(data.error || "Failed to search jobs")
      }
    } catch (error) {
      console.error("Error searching jobs:", error)
    } finally {
      setSearching(false)
    }
  }

  const handleSendEmail = async (jobId: string) => {
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      })
      
      if (response.ok) {
        fetchJobs()
        alert("Email sent successfully!")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to send email")
      }
    } catch (error) {
      console.error("Error sending email:", error)
    }
  }

  const filteredJobs = jobs.filter(job => {
    if (statusFilter !== "ALL" && job.status !== statusFilter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        job.employerName.toLowerCase().includes(query) ||
        job.jobTitle.toLowerCase().includes(query) ||
        (job.jobLocation && job.jobLocation.toLowerCase().includes(query))
      )
    }
    return true
  })

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobs.filter(j => j.status === "SENT" || j.status === "APPLIED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.today} / {stats.limit}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Send</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobs.filter(j => j.status === "COVER_LETTER_GENERATED" && j.hrEmail).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies or positions..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as JobStatus | "ALL")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleSearchJobs} disabled={searching}>
          {searching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Search Jobs
        </Button>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Job Applications</CardTitle>
          <CardDescription>
            Track and manage your job applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Date</th>
                  <th className="text-left py-3 px-2">Company</th>
                  <th className="text-left py-3 px-2">Position</th>
                  <th className="text-left py-3 px-2">Location</th>
                  <th className="text-left py-3 px-2">HR Email</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No jobs found. Click &quot;Search Jobs&quot; to start.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 font-medium">{job.employerName}</td>
                      <td className="py-3 px-2">{job.jobTitle}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                          {job.jobLocation || "N/A"}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        {job.hrEmail ? (
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1 text-green-500" />
                            <span className="text-xs truncate max-w-[120px]">{job.hrEmail}</span>
                          </div>
                        ) : (
                          <Badge variant="outline">Not Found</Badge>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={statusColors[job.status]}>
                          {statusLabels[job.status]}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          {job.coverLetter && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedJob(job)}
                              title="View Cover Letter"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {job.jobApplyLink && (
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              title="View Job Posting"
                            >
                              <a href={job.jobApplyLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          {job.hrEmail && job.coverLetter && job.status !== "SENT" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSendEmail(job.id)}
                              title="Send Application"
                            >
                              <Send className="h-4 w-4" />
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

      {/* Cover Letter Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Cover Letter - {selectedJob?.employerName}
            </DialogTitle>
            <DialogDescription>
              {selectedJob?.jobTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-muted rounded-lg whitespace-pre-wrap font-mono text-sm">
            {selectedJob?.coverLetter}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
