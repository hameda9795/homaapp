import axios from 'axios'
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

  const options = {
    method: 'GET',
    url: 'https://jsearch.p.rapidapi.com/search',
    params: {
      query: `${query} in ${location}`,
      page: page.toString(),
      num_pages: numPages.toString(),
    },
    headers: {
      'X-RapidAPI-Key': JSEARCH_API_KEY,
      'X-RapidAPI-Host': JSEARCH_HOST,
    },
  }

  try {
    const response = await axios.request(options)
    return response.data.data || []
  } catch (error) {
    console.error('Error searching jobs:', error)
    throw error
  }
}

export async function scrapeWebsiteContacts(domain: string): Promise<ContactInfo> {
  if (!WEBSITE_CONTACTS_API_KEY) {
    throw new Error('Website Contacts Scraper API key not configured')
  }

  // Rate limiting - wait 500ms between calls
  await delay(500)

  const options = {
    method: 'GET',
    url: 'https://website-contacts-scraper.p.rapidapi.com/scrape',
    params: {
      domain: domain,
    },
    headers: {
      'X-RapidAPI-Key': WEBSITE_CONTACTS_API_KEY,
      'X-RapidAPI-Host': WEBSITE_CONTACTS_HOST,
    },
  }

  try {
    const response = await axios.request(options)
    return response.data.data || { emails: [], phones: [], socials: [] }
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
    const response = await axios.post(
      'https://google.serper.dev/search',
      {
        q: `${companyName} official website`,
        num: 3,
      },
      {
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    )

    const organic = response.data.organic || []
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
