'use client'

import { useState, useEffect } from 'react'

export interface Job {
  job_id: string
  employer_name: string
  employer_website: string | null
  job_title: string
  job_description: string
  job_apply_link: string
  job_location: string
  job_city: string | null
  job_country: string | null
  hrEmail?: string | null
  emailSource?: string | null
  coverLetter?: string | null
  emailSubject?: string | null
  selected?: boolean
}

const STORAGE_KEY = 'jobauto_data'

export interface AppState {
  step: number
  query: string
  location: string
  language: 'en' | 'nl'
  education: string
  resumeText: string
  userName: string
  jobs: Job[]
}

const defaultState: AppState = {
  step: 1,
  query: '',
  location: 'Netherlands',
  language: 'nl', // Default to Dutch
  education: '',
  resumeText: '',
  userName: '',
  jobs: [],
}

export function useAppState() {
  const [state, setState] = useState<AppState>(defaultState)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setState({ ...defaultState, ...parsed })
        } catch (e) {
          console.error('Failed to parse stored state:', e)
        }
      }
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [state, isLoaded])

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const resetState = () => {
    setState(defaultState)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return { state, updateState, resetState, isLoaded }
}
