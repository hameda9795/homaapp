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
  // Accept all common business emails, not just HR-specific
  const validKeywords = [
    'careers', 'hr', 'jobs', 'recruiting', 'hiring', 'talent', 'vacancy', 'werkenbij',
    'info', 'contact', 'hello', 'support', 'sales',
    'marketing', 'business', 'corporate', 'office',
    'admin', 'general', 'enquiries', 'partners', 'press', 'media',
    'groningen', 'amsterdam', 'leeuwarden', 'utrecht', 'rotterdam', 'eindhoven', 'denhaag',
    'apenheul', 'deventer', 'apeldoorn', 'nijmegen', 'arnhem', 'zwolle',
    'bydpr', 'ops', 'vbs', 'relations', 'investor'
  ]
  
  const filtered = emails.filter(email => {
    const localPart = email.split('@')[0]?.toLowerCase() || ''
    return validKeywords.some(keyword => localPart.includes(keyword))
  })
  
  // If no specific emails found, return first 3 emails as fallback
  if (filtered.length === 0 && emails.length > 0) {
    return emails.slice(0, 3)
  }
  
  return filtered
}
