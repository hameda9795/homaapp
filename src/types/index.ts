import { JobStatus, JobSource } from '@prisma/client'

export interface JobApplicationWithDetails {
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
  appliedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface UserProfileData {
  id: string
  userId: string
  resumeUrl: string | null
  resumeText: string | null
  jobTitles: string[]
  education: string | null
  location: string | null
  languages: string[]
  sources: JobSource[]
  dailyJobLimit: number
  isOnboarded: boolean
}

export interface OnboardingFormData {
  resume: File | null
  jobTitles: string
  education: string
  location: string
  languages: string
  sources: JobSource[]
  dailyJobLimit: number
}

export interface DashboardFilters {
  status?: JobStatus
  dateFrom?: Date
  dateTo?: Date
  search?: string
}
