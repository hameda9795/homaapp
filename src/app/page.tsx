'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppState } from '@/lib/store'

export default function Home() {
  const router = useRouter()
  const { isLoaded, state } = useAppState()

  useEffect(() => {
    if (isLoaded) {
      // Redirect to current step
      router.push(`/step${state.step}`)
    }
  }, [isLoaded, state.step, router])

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
}
