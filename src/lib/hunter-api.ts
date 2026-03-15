// lib/hunter-api.ts
// بهینه‌سازی شده برای Hunter.io با استراتژی هوشمند

const HUNTER_API_KEY = process.env.HUNTER_API_KEY || '';

// لیست keyword ها برای matching
const JOB_TITLE_MAPPINGS: Record<string, string[]> = {
  'marketing': ['marketing', 'growth', 'brand', 'content', 'demand', 'digital'],
  'sales': ['sales', 'business development', 'revenue'],
  'engineering': ['engineering', 'cto', 'developer', 'technical'],
  'hr': ['hr', 'recruiting', 'talent', 'people', 'career'],
  'product': ['product', 'pm', 'product manager'],
};

export interface HunterEmail {
  value: string;
  type: string;
  confidence: number;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  department: string | null;
  seniority: string | null;
  linkedin: string | null;
  twitter: string | null;
  phone_number: string | null;
  sources: Array<{
    domain: string;
    uri: string;
    extracted_on: string;
    last_seen_on: string;
    still_on_page: boolean;
  }>;
}

export interface DomainSearchResult {
  domain: string;
  disposable: boolean;
  webmail: boolean;
  accept_all: boolean;
  pattern: string | null;
  organization: string | null;
  country: string | null;
  state: string | null;
  emails: HunterEmail[];
}

/**
 * پیدا کردن بهترین contact بر اساس job title
 */
export async function findBestContactForJob(
  domain: string,
  jobTitle: string
): Promise<{ email: string | null; contact: HunterEmail | null; confidence: number }> {
  
  if (!HUNTER_API_KEY) {
    throw new Error('HUNTER_API_KEY not configured');
  }
  
  // ۱. دریافت همه ایمیل‌ها
  const result = await domainSearch(domain);
  if (!result || result.emails.length === 0) {
    return { email: null, contact: null, confidence: 0 };
  }
  
  console.log(`Found ${result.emails.length} emails for ${domain}`);
  console.log(`Email pattern: ${result.pattern}`);
  
  // ۲. شناسایی keyword های مرتبط با job
  const jobLower = jobTitle.toLowerCase();
  const relevantKeywords: string[] = [];
  
  for (const [category, keywords] of Object.entries(JOB_TITLE_MAPPINGS)) {
    if (keywords.some(k => jobLower.includes(k))) {
      relevantKeywords.push(...keywords);
    }
  }
  
  // اگر هیچ category پیدا نشد، از همه keyword ها استفاده کن
  if (relevantKeywords.length === 0) {
    relevantKeywords.push('manager', 'director', 'vp', 'head', 'lead');
  }
  
  console.log('Relevant keywords:', relevantKeywords);
  
  // ۳. Score دادن به هر contact
  const scoredContacts = result.emails.map(email => {
    let score = 0;
    const position = (email.position || '').toLowerCase();
    const department = (email.department || '').toLowerCase();
    
    // امتیاز برای matching با job keywords
    relevantKeywords.forEach(keyword => {
      if (position.includes(keyword)) score += 30;
      if (department.includes(keyword)) score += 20;
    });
    
    // امتیاز برای seniority
    if (position.includes('director')) score += 25;
    if (position.includes('vp') || position.includes('vice president')) score += 20;
    if (position.includes('manager')) score += 15;
    if (position.includes('head')) score += 15;
    if (position.includes('lead')) score += 10;
    
    // امتیاز برای confidence خود Hunter
    score += (email.confidence / 100) * 20;
    
    return { email, score };
  });
  
  // ۴. مرتب‌سازی بر اساس score
  scoredContacts.sort((a, b) => b.score - a.score);
  
  // ۵. برگردوندن بهترین گزینه
  const best = scoredContacts[0];
  if (best && best.score > 30) {
    // بررسی اعتبار ایمیل
    const verification = await verifyEmail(best.email.value);
    if (verification && verification.result === 'deliverable') {
      return {
        email: best.email.value,
        contact: best.email,
        confidence: Math.min(best.score, 100),
      };
    }
  }
  
  // ۶. Fallback: استفاده از pattern
  if (result.pattern && scoredContacts.length > 0) {
    const bestGuess = scoredContacts[0];
    return {
      email: bestGuess.email.value,
      contact: bestGuess.email,
      confidence: bestGuess.score * 0.7, // confidence کمتر چون verify نشده
    };
  }
  
  return { email: null, contact: null, confidence: 0 };
}

/**
 * Domain Search API
 */
async function domainSearch(domain: string): Promise<DomainSearchResult | null> {
  const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Domain Search Error:', data.errors?.[0]?.details);
      return null;
    }
    
    return data.data;
  } catch (error) {
    console.error('Error in domainSearch:', error);
    return null;
  }
}

/**
 * Email Verifier API
 */
async function verifyEmail(email: string): Promise<any | null> {
  const url = `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${HUNTER_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Email Verifier Error:', data.errors?.[0]?.details);
      return null;
    }
    
    return data.data;
  } catch (error) {
    console.error('Error in verifyEmail:', error);
    return null;
  }
}

/**
 * Email Finder API - وقتی اسم contact رو می‌دانیم
 */
export async function findEmailByName(
  firstName: string,
  lastName: string,
  domain: string
): Promise<{ email: string | null; confidence: number }> {
  const url = `https://api.hunter.io/v2/email-finder?first_name=${firstName}&last_name=${lastName}&domain=${domain}&api_key=${HUNTER_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Email Finder Error:', data.errors?.[0]?.details);
      return { email: null, confidence: 0 };
    }
    
    return {
      email: data.data?.email || null,
      confidence: data.data?.score || 0,
    };
  } catch (error) {
    console.error('Error in findEmailByName:', error);
    return { email: null, confidence: 0 };
  }
}

// تست
async function test() {
  const result = await findBestContactForJob('inriver.com', 'Digital Marketing Lead');
  console.log('\n🎯 Best Contact Found:');
  console.log('Email:', result.email);
  console.log('Confidence:', result.confidence + '%');
  console.log('Contact Info:', result.contact);
}

// اجرا فقط اگر مستقیم اجرا شده
if (require.main === module) {
  test();
}

export { domainSearch, verifyEmail };
