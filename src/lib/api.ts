import { extractDomain, filterHREmails, delay } from './utils'

// JSearch API configuration
const JSEARCH_API_KEY = process.env.RAPIDAPI_KEY
const JSEARCH_HOST = 'jsearch.p.rapidapi.com'

// Website Contacts Scraper API configuration
const WEBSITE_CONTACTS_API_KEY = process.env.RAPIDAPI_KEY
const WEBSITE_CONTACTS_HOST = 'website-contacts-scraper.p.rapidapi.com'

// Google Search API (Serper.dev as fallback)
const SERPER_API_KEY = process.env.SERPER_API_KEY

export interface JobSearchResult {
  job_id: string
  employer_name: string
  employer_website: string | null
  job_title: string
  job_description: string
  job_apply_link: string
  job_location: string
  job_city: string | null
  job_country: string | null
}

export interface ContactInfo {
  emails: { value: string; sources: string[] }[]
  phones: { value: string; sources: string[] }[]
  socials: { value: string; sources: string[] }[]
}

export async function searchJobs(
  query: string,
  location: string,
  page: number = 1,
  numPages: number = 1
): Promise<JobSearchResult[]> {
  if (!JSEARCH_API_KEY) {
    throw new Error('JSearch API key not configured')
  }

  const url = new URL('https://jsearch.p.rapidapi.com/search')
  // Location must be in query parameter, not as separate param
  url.searchParams.append('query', `${query} ${location}`)
  url.searchParams.append('page', page.toString())
  url.searchParams.append('num_pages', numPages.toString())
  url.searchParams.append('country', 'nl')
  url.searchParams.append('date_posted', 'all')

  try {
    console.log('API: Calling JSearch with query:', query)
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': JSEARCH_API_KEY,
        'X-RapidAPI-Host': JSEARCH_HOST,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API: JSearch HTTP error:', response.status)
      console.error('API: JSearch error body:', errorText)
      throw new Error(`API error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log('API: JSearch raw response:', JSON.stringify(data).slice(0, 500))
    console.log('API: JSearch response:', data.data?.length || 0, 'jobs')
    return data.data || []
  } catch (error: Error | unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('API: Error searching jobs:', message)
    throw error
  }
}

export async function scrapeWebsiteContacts(domain: string): Promise<ContactInfo> {
  if (!WEBSITE_CONTACTS_API_KEY) {
    throw new Error('Website Contacts Scraper API key not configured')
  }

  // Rate limiting - wait 500ms between calls
  await delay(500)

  const url = new URL('https://website-contacts-scraper.p.rapidapi.com/scrape-contacts')
  url.searchParams.append('query', domain)
  url.searchParams.append('match_email_domain', 'false')
  url.searchParams.append('external_matching', 'false')

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': WEBSITE_CONTACTS_API_KEY,
        'X-RapidAPI-Host': WEBSITE_CONTACTS_HOST,
      },
    })

    if (!response.ok) {
      console.error('API: Website scraper error:', response.status)
      return { emails: [], phones: [], socials: [] }
    }

    const data = await response.json()
    return data.data || { emails: [], phones: [], socials: [] }
  } catch (error) {
    console.error('Error scraping website contacts:', error)
    return { emails: [], phones: [], socials: [] }
  }
}

export async function findCompanyWebsiteGoogle(companyName: string): Promise<string | null> {
  if (!SERPER_API_KEY) {
    return null
  }

  // Rate limiting
  await delay(500)

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: `${companyName} official website`,
        num: 3,
      }),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const organic = data.organic || []
    
    for (const result of organic) {
      const link = result.link
      if (link && !link.includes('linkedin.com') && !link.includes('indeed.com')) {
        return link
      }
    }
    return null
  } catch (error) {
    console.error('Error searching Google:', error)
    return null
  }
}

export async function findHREmail(companyName: string, websiteUrl: string | null): Promise<{ email: string | null; source: string | null }> {
  let domain: string | null = null

  if (websiteUrl) {
    domain = extractDomain(websiteUrl)
  }

  // If no website provided, try Google search
  if (!domain) {
    const googleResult = await findCompanyWebsiteGoogle(companyName)
    if (googleResult) {
      domain = extractDomain(googleResult)
    }
  }

  if (!domain) {
    return { email: null, source: null }
  }

  // Scrape website contacts
  const contacts = await scrapeWebsiteContacts(domain)

  // Filter for HR emails
  const allEmails = contacts.emails.map(e => e.value)
  const hrEmails = filterHREmails(allEmails)

  if (hrEmails.length > 0) {
    // Find the email source
    const emailObj = contacts.emails.find(e => e.value === hrEmails[0])
    return { 
      email: hrEmails[0], 
      source: emailObj?.sources?.[0] || domain 
    }
  }

  return { email: null, source: null }
}
