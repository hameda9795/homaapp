import { extractDomain, filterHREmails, delay } from './utils'

// JSearch API configuration
const JSEARCH_API_KEY = process.env.RAPIDAPI_KEY
const JSEARCH_HOST = 'jsearch.p.rapidapi.com'

// Hunter.io API configuration ⭐
const HUNTER_API_KEY = process.env.HUNTER_API_KEY

// Website Contacts Scraper API configuration (fallback)
const WEBSITE_CONTACTS_API_KEY = process.env.RAPIDAPI_KEY
const WEBSITE_CONTACTS_HOST = 'website-contacts-scraper.p.rapidapi.com'

// Google Search API (Serper.dev as fallback)
const SERPER_API_KEY = process.env.SERPER_API_KEY

// لیست keyword ها برای matching job title
const JOB_TITLE_MAPPINGS: Record<string, string[]> = {
  'marketing': ['marketing', 'growth', 'brand', 'content', 'demand', 'digital', 'communications'],
  'sales': ['sales', 'business development', 'revenue', 'account'],
  'engineering': ['engineering', 'developer', 'technical', 'software', 'cto'],
  'hr': ['hr', 'recruiting', 'talent', 'people', 'career', 'human resources'],
  'product': ['product', 'product manager', 'product owner'],
  'design': ['design', 'ux', 'ui', 'creative'],
  'finance': ['finance', 'accounting', 'financial'],
}

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
  job_employment_type?: string | null
  job_is_remote?: boolean | null
  job_posted_at?: string | null
}

export interface ContactInfo {
  emails: { value: string; sources: string[] }[]
  phones: { value: string; sources: string[] }[]
  socials: { value: string; sources: string[] }[]
}

export interface HunterEmail {
  value: string
  type: string
  confidence: number
  first_name: string | null
  last_name: string | null
  position: string | null
  department: string | null
  seniority: string | null
}

export interface FoundContact {
  email: string
  name: string
  position: string
  department: string | null
  confidence: number
  source: 'hunter' | 'hunter-verified' | 'website-scraper' | 'pattern-guess'
  verification?: {
    result: string
    score: number
  }
}

/**
 * جستجوی شغل با JSearch با فیلترهای پیشرفته
 */
export async function searchJobs(
  query: string,
  location: string,
  language: 'netherlands' | 'english' | 'both' = 'both',
  experience: 'entry' | 'mid' | 'senior' | 'any' = 'any',
  jobType: 'fulltime' | 'parttime' | 'contract' | 'internship' | 'any' = 'any',
  workMode: 'onsite' | 'hybrid' | 'remote' | 'any' = 'any',
  datePosted: '24h' | '3d' | '7d' | '30d' | 'all' = '30d',
  page: number = 1,
  numPages: number = 1
): Promise<JobSearchResult[]> {
  if (!JSEARCH_API_KEY) {
    throw new Error('JSearch API key not configured')
  }

  const url = new URL('https://jsearch.p.rapidapi.com/search')
  
  // ساخت query بر اساس فیلترها
  let searchQuery = `${query} ${location}`
  
  // اضافه کردن experience level به query
  if (experience === 'entry') {
    searchQuery += ' entry level junior'
  } else if (experience === 'senior') {
    searchQuery += ' senior lead principal'
  }
  
  // اضافه کردن job type
  if (jobType !== 'any') {
    searchQuery += ` ${jobType}`
  }
  
  // اضافه کردن زبان
  if (language === 'english') {
    searchQuery += ' english speaking'
  } else if (language === 'netherlands') {
    searchQuery += ' dutch speaking'
  }
  
  // date_posted mapping
  const datePostedMap: Record<string, string> = {
    '24h': 'all', // JSearch دقت 24h نداره
    '3d': 'all',
    '7d': 'week',
    '30d': 'month',
    'all': 'all'
  }
  
  url.searchParams.append('query', searchQuery)
  url.searchParams.append('page', page.toString())
  url.searchParams.append('num_pages', numPages.toString())
  url.searchParams.append('country', 'nl')
  url.searchParams.append('date_posted', datePostedMap[datePosted] || 'month')
  // remote_jobs parameter فقط اگر workMode = remote
  if (workMode === 'remote') {
    url.searchParams.append('remote_jobs_only', 'true')
  }

  try {
    console.log('API: Calling JSearch:', { searchQuery, datePosted: datePostedMap[datePosted], workMode })
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
      throw new Error(`API error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    let jobs = data.data || []
    
    console.log('API: Found', jobs.length, 'jobs before filters')
    
    // فیلتر کردن بر اساس زبان
    if (language !== 'both' && jobs.length > 0) {
      jobs = filterJobsByLanguage(jobs, language)
      console.log('API: After language filter:', jobs.length)
    }
    
    // فیلتر کردن بر اساس experience level
    if (experience !== 'any' && jobs.length > 0) {
      jobs = filterJobsByExperience(jobs, experience)
      console.log('API: After experience filter:', jobs.length)
    }
    
    // فیلتر کردن بر اساس work mode
    if (workMode !== 'any' && jobs.length > 0) {
      jobs = filterJobsByWorkMode(jobs, workMode)
      console.log('API: After work mode filter:', jobs.length)
    }
    
    // فیلتر کردن بر اساس job type
    if (jobType !== 'any' && jobs.length > 0) {
      jobs = filterJobsByJobType(jobs, jobType)
      console.log('API: After job type filter:', jobs.length)
    }
    
    // فیلتر کردن بر اساس date posted
    if (datePosted !== 'all' && jobs.length > 0) {
      jobs = filterJobsByDatePosted(jobs, datePosted)
      console.log('API: After date filter:', jobs.length)
    }
    
    return jobs
  } catch (error: Error | unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('API: Error searching jobs:', message)
    throw error
  }
}

/**
 * فیلتر کردن jobها بر اساس زبان
 */
function filterJobsByLanguage(jobs: JobSearchResult[], language: 'netherlands' | 'english'): JobSearchResult[] {
  return jobs.filter(job => {
    const title = (job.job_title || '').toLowerCase()
    const description = (job.job_description || '').toLowerCase()
    const text = title + ' ' + description
    
    if (language === 'english') {
      const dutchIndicators = ['nederlands', 'verplicht', 'moet', 'vereist', 'kunnen']
      const hasDutch = dutchIndicators.some(word => text.includes(word))
      const hasEnglishIndicator = text.includes('english') || text.includes('engels')
      return !hasDutch || hasEnglishIndicator
    } else if (language === 'netherlands') {
      const dutchIndicators = ['nederlands', 'verplicht', 'moet', 'vereist']
      return dutchIndicators.some(word => text.includes(word))
    }
    return true
  })
}

/**
 * فیلتر کردن بر اساس experience level
 */
function filterJobsByExperience(jobs: JobSearchResult[], experience: 'entry' | 'mid' | 'senior'): JobSearchResult[] {
  return jobs.filter(job => {
    const title = (job.job_title || '').toLowerCase()
    const description = (job.job_description || '').toLowerCase()
    const text = title + ' ' + description
    
    if (experience === 'entry') {
      // Entry level = junior, entry, associate, graduate, starter
      const entryKeywords = ['junior', 'entry', 'associate', 'graduate', 'starter', 'trainee', '0-2 years', '1-2 years']
      const seniorKeywords = ['senior', 'lead', 'principal', 'head of', '5+ years', '7+ years']
      const isEntry = entryKeywords.some(k => text.includes(k))
      const isSenior = seniorKeywords.some(k => text.includes(k))
      return isEntry || !isSenior // اگر entry کلمه‌ای پیدا نشد و senior هم نباشه
    } else if (experience === 'senior') {
      const seniorKeywords = ['senior', 'lead', 'principal', 'head of', 'staff', 'architect', '5+ years', '7+ years', '8+ years']
      return seniorKeywords.some(k => text.includes(k))
    } else if (experience === 'mid') {
      // Mid level = نه entry نه senior
      const entryKeywords = ['junior', 'entry', 'associate', 'graduate', 'starter', 'trainee']
      const seniorKeywords = ['senior', 'lead', 'principal', 'head of', 'staff', 'architect']
      const isEntry = entryKeywords.some(k => text.includes(k))
      const isSenior = seniorKeywords.some(k => text.includes(k))
      return !isEntry && !isSenior
    }
    return true
  })
}

/**
 * فیلتر کردن بر اساس work mode
 */
function filterJobsByWorkMode(jobs: JobSearchResult[], workMode: 'onsite' | 'hybrid' | 'remote'): JobSearchResult[] {
  return jobs.filter(job => {
    const title = (job.job_title || '').toLowerCase()
    const description = (job.job_description || '').toLowerCase()
    const location = (job.job_location || '').toLowerCase()
    const text = title + ' ' + description + ' ' + location
    const isRemote = job.job_is_remote === true
    
    if (workMode === 'remote') {
      return isRemote || 
             text.includes('remote') || 
             text.includes('work from home') || 
             text.includes('wfh') ||
             location.includes('remote')
    } else if (workMode === 'hybrid') {
      return text.includes('hybrid') || 
             text.includes('flexible') ||
             (text.includes('remote') && text.includes('office'))
    } else if (workMode === 'onsite') {
      const remoteIndicators = ['remote', 'hybrid', 'work from home', 'wfh']
      const isRemote = remoteIndicators.some(k => text.includes(k)) || job.job_is_remote
      return !isRemote
    }
    return true
  })
}

/**
 * فیلتر کردن بر اساس job type
 */
function filterJobsByJobType(jobs: JobSearchResult[], jobType: 'fulltime' | 'parttime' | 'contract' | 'internship'): JobSearchResult[] {
  return jobs.filter(job => {
    const type = (job.job_employment_type || '').toLowerCase()
    const title = (job.job_title || '').toLowerCase()
    const description = (job.job_description || '').toLowerCase()
    const text = type + ' ' + title + ' ' + description
    
    if (jobType === 'fulltime') {
      return text.includes('full') || text.includes('full-time') || type.includes('fte')
    } else if (jobType === 'parttime') {
      return text.includes('part') || text.includes('part-time') || text.includes('parttime')
    } else if (jobType === 'contract') {
      return text.includes('contract') || text.includes('freelance') || text.includes('temporary')
    } else if (jobType === 'internship') {
      return text.includes('intern') || text.includes('stage') || text.includes('trainee')
    }
    return true
  })
}

/**
 * فیلتر کردن بر اساس date posted
 */
function filterJobsByDatePosted(jobs: JobSearchResult[], datePosted: '24h' | '3d' | '7d' | '30d'): JobSearchResult[] {
  const now = new Date()
  const daysMap = {
    '24h': 1,
    '3d': 3,
    '7d': 7,
    '30d': 30
  }
  const maxDays = daysMap[datePosted]
  
  return jobs.filter(job => {
    if (!job.job_posted_at) return true // اگر تاریخ نداشت، نگهش دار
    const postedDate = new Date(job.job_posted_at)
    const daysDiff = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff <= maxDays
  })
}

/**
 * ⭐ پیدا کردن HR Email با استراتژی Waterfall
 * ۱. Hunter.io Domain Search (primary)
 * ۲. Hunter.io Email Verification
 * ۳. Website Contacts Scraper (fallback)
 */
export async function findHREmail(
  companyName: string,
  websiteUrl: string | null,
  jobTitle: string = ''
): Promise<FoundContact | null> {
  
  const domain = websiteUrl ? extractDomain(websiteUrl) : null
  
  if (!domain) {
    console.log('No domain provided for', companyName)
    return null
  }

  console.log(`\n🔍 Finding HR email for ${companyName} (${domain})`)
  console.log(`📝 Job Title: ${jobTitle || 'N/A'}\n`)

  // ⭐ مرحله ۱: Hunter.io Domain Search
  if (HUNTER_API_KEY) {
    const hunterContact = await findBestContactWithHunter(domain, jobTitle)
    if (hunterContact) {
      console.log('✅ Found with Hunter.io:', hunterContact.email)
      return hunterContact
    }
  }

  // مرحله ۲: Website Contacts Scraper (fallback)
  console.log('⚠️ Hunter.io failed, trying Website Contacts Scraper...')
  const websiteContact = await findEmailWithWebsiteScraper(domain)
  if (websiteContact) {
    console.log('✅ Found with Website Scraper:', websiteContact.email)
    return websiteContact
  }

  console.log('❌ No HR email found for', companyName)
  return null
}

/**
 * ⭐ Hunter.io Domain Search + Smart Filtering
 */
async function findBestContactWithHunter(
  domain: string,
  jobTitle: string
): Promise<FoundContact | null> {
  
  try {
    const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok || !data.data?.emails?.length) {
      console.log('Hunter Domain Search: No results')
      return null
    }

    const emails: HunterEmail[] = data.data.emails
    console.log(`Hunter found ${emails.length} emails`)
    console.log(`Email pattern: ${data.data.pattern || 'unknown'}`)

    // شناسازی keyword های مرتبط با job
    const jobLower = jobTitle.toLowerCase()
    const relevantKeywords: string[] = []
    
    for (const [, keywords] of Object.entries(JOB_TITLE_MAPPINGS)) {
      if (keywords.some(k => jobLower.includes(k))) {
        relevantKeywords.push(...keywords)
      }
    }
    
    // اگر هیچ category پیدا نشد، از keywords عمومی استفاده کن
    if (relevantKeywords.length === 0) {
      relevantKeywords.push('manager', 'director', 'vp', 'head', 'lead', 'hr', 'recruit')
    }
    
    console.log('Matching keywords:', relevantKeywords)

    // Score دادن به هر contact
    const scoredContacts = emails.map(email => {
      let score = 0
      const position = (email.position || '').toLowerCase()
      const department = (email.department || '').toLowerCase()
      
      // امتیاز برای matching با job keywords
      relevantKeywords.forEach(keyword => {
        if (position.includes(keyword)) score += 30
        if (department.includes(keyword)) score += 20
      })
      
      // امتیاز برای seniority
      if (position.includes('director')) score += 25
      if (position.includes('vp') || position.includes('vice president')) score += 20
      if (position.includes('manager')) score += 15
      if (position.includes('head')) score += 15
      if (position.includes('lead')) score += 10
      
      // امتیاز برای confidence خود Hunter
      score += (email.confidence / 100) * 20
      
      return { email, score }
    })

    // مرتب‌سازی
    scoredContacts.sort((a, b) => b.score - a.score)
    
    // نمایش top 3
    console.log('\nTop 3 matches:')
    scoredContacts.slice(0, 3).forEach((item, i) => {
      console.log(`${i + 1}. ${item.email.value} (${item.email.position || 'N/A'}) - Score: ${item.score}`)
    })

    // انتخاب بهترین
    const best = scoredContacts[0]
    if (!best) {
      console.log('No emails found in Hunter')
      return null
    }
    
    // اگر score خیلی پایین بود، هشدار بده ولی بازم برگردون (بهتر از info@ است)
    if (best.score < 20) {
      console.log('⚠️ Low score but using Hunter result anyway (better than generic info@)')
    }

    // ⭐ بررسی اعتبار با Email Verifier
    const verification = await verifyEmailWithHunter(best.email.value) as { result?: string; score?: number } | null
    
    const contact: FoundContact = {
      email: best.email.value,
      name: `${best.email.first_name || ''} ${best.email.last_name || ''}`.trim(),
      position: best.email.position || 'Unknown',
      department: best.email.department,
      confidence: Math.min(best.score, 100),
      source: verification?.result === 'deliverable' ? 'hunter-verified' : 'hunter',
      verification: verification ? {
        result: verification.result || 'unknown',
        score: verification.score || 0,
      } : undefined,
    }

    return contact

  } catch (error) {
    console.error('Error in Hunter Domain Search:', error)
    return null
  }
}

/**
 * Hunter.io Email Verifier
 */
async function verifyEmailWithHunter(email: string): Promise<unknown | null> {
  if (!HUNTER_API_KEY) return null
  
  try {
    // Rate limiting
    await delay(500)
    
    const url = `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${HUNTER_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      console.log('Email verification failed:', data.errors?.[0]?.details)
      return null
    }

    console.log(`Verification for ${email}:`, data.data.result, `(score: ${data.data.score}%)`)
    return data.data

  } catch (error) {
    console.error('Error verifying email:', error)
    return null
  }
}

/**
 * Website Contacts Scraper (Fallback)
 */
async function findEmailWithWebsiteScraper(domain: string): Promise<FoundContact | null> {
  if (!WEBSITE_CONTACTS_API_KEY) return null

  await delay(500)

  try {
    const url = new URL('https://website-contacts-scraper.p.rapidapi.com/scrape-contacts')
    url.searchParams.append('query', domain)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': WEBSITE_CONTACTS_API_KEY,
        'X-RapidAPI-Host': WEBSITE_CONTACTS_HOST,
      },
    })

    if (!response.ok) {
      console.error('Website scraper error:', response.status)
      return null
    }

    const data = await response.json()
    
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      const result = data.data[0]
      const emails: string[] = []
      
      if (result.emails && Array.isArray(result.emails)) {
        for (const e of result.emails) {
          if (typeof e === 'string') emails.push(e)
          else if (e?.value) emails.push(e.value)
        }
      }
      
      const hrEmails = filterHREmails(emails)
      
      if (hrEmails.length > 0) {
        return {
          email: hrEmails[0],
          name: '',
          position: 'General Contact',
          department: null,
          confidence: 50,
          source: 'website-scraper',
        }
      }
    }

    return null

  } catch (error) {
    console.error('Error with website scraper:', error)
    return null
  }
}

/**
 * Google Search برای پیدا کردن وبسایت
 */
export async function findCompanyWebsiteGoogle(companyName: string): Promise<string | null> {
  if (!SERPER_API_KEY) return null

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

    if (!response.ok) return null

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

/**
 * Email Finder با اسم و فامیل (وقتی اسم contact رو می‌دانیم)
 */
export async function findEmailByName(
  firstName: string,
  lastName: string,
  domain: string
): Promise<{ email: string | null; confidence: number }> {
  
  if (!HUNTER_API_KEY) {
    return { email: null, confidence: 0 }
  }

  try {
    const url = `https://api.hunter.io/v2/email-finder?first_name=${firstName}&last_name=${lastName}&domain=${domain}&api_key=${HUNTER_API_KEY}`
    
    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      console.error('Email Finder Error:', data.errors?.[0]?.details)
      return { email: null, confidence: 0 }
    }

    return {
      email: data.data?.email || null,
      confidence: data.data?.score || 0,
    }

  } catch (error) {
    console.error('Error in email finder:', error)
    return { email: null, confidence: 0 }
  }
}
