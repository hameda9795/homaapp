'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAppState, Job } from '@/lib/store'
import { 
  Search, 
  Loader2, 
  GraduationCap, 
  Languages, 
  Briefcase, 
  Clock, 
  Calendar,
  Home,
  MapPin,
  Filter
} from 'lucide-react'

// نوع فیلترها
type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'any'
type JobType = 'fulltime' | 'parttime' | 'contract' | 'internship' | 'any'
type WorkMode = 'onsite' | 'hybrid' | 'remote' | 'any'
type DatePosted = '24h' | '3d' | '7d' | '30d' | 'all'
type LanguageOption = 'netherlands' | 'english' | 'both'

export default function Step1() {
  const router = useRouter()
  const { state, updateState } = useAppState()
  
  // State اصلی
  const [query, setQuery] = useState(state.query)
  const [location, setLocation] = useState(state.location || 'Netherlands')
  const [language, setLanguage] = useState<LanguageOption>(state.language || 'both')
  const [education, setEducation] = useState(state.education)
  
  // State فیلترهای جدید
  const [experience, setExperience] = useState<ExperienceLevel>(state.experience || 'any')
  const [jobType, setJobType] = useState<JobType>(state.jobType || 'any')
  const [workMode, setWorkMode] = useState<WorkMode>(state.workMode || 'any')
  const [datePosted, setDatePosted] = useState<DatePosted>(state.datePosted || '30d')
  
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
    job_employment_type?: string
    job_is_remote?: boolean
    job_posted_at?: string
  }>>([])
  const [filteredJobs, setFilteredJobs] = useState(jobs)
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    
    setLoading(true)
    console.log('Step1: Starting search with filters:', { 
      query, location, language, experience, jobType, workMode, datePosted 
    })
    
    try {
      const response = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query, 
          location, 
          language,
          experience,
          jobType,
          workMode,
          datePosted
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setJobs(data.jobs || [])
        setFilteredJobs(data.jobs || [])
      } else {
        alert('Error: ' + (data.error || 'Unknown error'))
      }
    } catch (error: Error | unknown) {
      console.error('Step1 Error:', error)
      alert('Failed to search jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    const selectedJobs = filteredJobs.map(job => ({ ...job, selected: true }))
    updateState({ 
      step: 2, 
      query, 
      location,
      language,
      education,
      experience,
      jobType,
      workMode,
      datePosted,
      jobs: selectedJobs 
    })
    router.push('/step2')
  }

  // Badge برای نمایش نوع کار
  const getWorkModeBadge = (job: Job) => {
    const isRemote = job.job_is_remote || job.job_location?.toLowerCase().includes('remote')
    const isHybrid = job.job_description?.toLowerCase().includes('hybrid')
    
    if (isRemote) return <Badge variant="default" className="bg-green-600">Remote</Badge>
    if (isHybrid) return <Badge variant="default" className="bg-blue-600">Hybrid</Badge>
    return <Badge variant="outline">On-site</Badge>
  }

  // Badge برای نوع employment
  const getJobTypeBadge = (job: Job) => {
    const type = job.job_employment_type?.toLowerCase() || ''
    if (type.includes('full')) return <Badge variant="secondary">Full-time</Badge>
    if (type.includes('part')) return <Badge variant="secondary">Part-time</Badge>
    if (type.includes('contract')) return <Badge variant="secondary">Contract</Badge>
    if (type.includes('intern')) return <Badge variant="secondary">Internship</Badge>
    return null
  }

  // تاریخ انتشار
  const getPostedDate = (job: Job) => {
    if (!job.job_posted_at) return null
    const date = new Date(job.job_posted_at)
    const now = new Date()
    const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return `${Math.floor(days / 7)} weeks ago`
  }

  return (
    <div className="container max-w-5xl py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Search className="h-6 w-6" />
            Step 1: Find Jobs
          </CardTitle>
          <CardDescription>
            Search for jobs with advanced filters
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Row 1: Job Title & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="query" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Job Title
              </Label>
              <Input
                id="query"
                placeholder="e.g. Software Engineer, Marketing Manager"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                id="location"
                placeholder="e.g. Amsterdam, Rotterdam"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: Language & Education */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                Language
              </Label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageOption)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="netherlands">🇳🇱 Netherlands (Dutch)</option>
                <option value="english">🇬🇧 English</option>
                <option value="both">🌍 Netherlands and English</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="education" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Education (Optional)
              </Label>
              <Input
                id="education"
                placeholder="e.g. Bachelor in Computer Science"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
              />
            </div>
          </div>

          {/* Toggle Filters Button */}
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="w-full"
          >
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
          </Button>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              {/* Experience Level */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Experience
                </Label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value as ExperienceLevel)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="any">Any Level</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                </select>
              </div>

              {/* Job Type */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Job Type
                </Label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value as JobType)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="any">Any Type</option>
                  <option value="fulltime">Full-time</option>
                  <option value="parttime">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              {/* Work Mode */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Work Mode
                </Label>
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="any">Any Mode</option>
                  <option value="onsite">On-site</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="remote">Remote</option>
                </select>
              </div>

              {/* Date Posted */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Posted
                </Label>
                <select
                  value={datePosted}
                  onChange={(e) => setDatePosted(e.target.value as DatePosted)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="24h">Last 24 hours</option>
                  <option value="3d">Last 3 days</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="all">Any time</option>
                </select>
              </div>
            </div>
          )}

          {/* Search Button */}
          <Button 
            onClick={handleSearch} 
            disabled={loading || !query.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Search className="mr-2 h-5 w-5" />
            )}
            Search Jobs
          </Button>

          {/* Results */}
          {filteredJobs.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                  Found {filteredJobs.length} jobs
                </h3>
                <span className="text-sm text-muted-foreground">
                  Showing all results
                </span>
              </div>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredJobs.map((job) => (
                  <Card key={job.job_id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-lg">{job.job_title}</h4>
                          {getWorkModeBadge(job)}
                          {getJobTypeBadge(job)}
                        </div>
                        
                        <p className="text-sm font-medium text-primary mt-1">
                          {job.employer_name}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.job_location}
                          </span>
                          {job.job_posted_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {getPostedDate(job)}
                            </span>
                          )}
                        </div>
                        
                        {/* Job Description Preview */}
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {job.job_description?.substring(0, 150)}...
                        </p>
                      </div>
                      
                      <a 
                        href={job.job_apply_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="shrink-0 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        View Job →
                      </a>
                    </div>
                  </Card>
                ))}
              </div>

              <Button 
                onClick={handleContinue}
                className="w-full"
                size="lg"
              >
                Continue to Step 2 with {filteredJobs.length} jobs →
              </Button>
            </div>
          )}

          {filteredJobs.length === 0 && jobs.length === 0 && !loading && (
            <div className="text-center py-10 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Enter your search criteria and click Search Jobs</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
