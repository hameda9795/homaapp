import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function filterHREmails(emails: string[]): string[] {
  const hrKeywords = ['careers', 'hr', 'jobs', 'recruiting', 'hiring', 'info', 'contact']
  return emails.filter(email => {
    const localPart = email.split('@')[0]?.toLowerCase() || ''
    return hrKeywords.some(keyword => localPart.includes(keyword))
  })
}
