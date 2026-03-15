// test-final.js
// تست نهایی Hunter.io با سیستم جدید

const HUNTER_API_KEY = '0351c384630362c38f9a735ee40ade0d8ff8f82d'

// لیست keyword ها برای matching
const JOB_TITLE_MAPPINGS = {
  'marketing': ['marketing', 'growth', 'brand', 'content', 'demand', 'digital', 'communications'],
  'sales': ['sales', 'business development', 'revenue', 'account'],
  'engineering': ['engineering', 'developer', 'technical', 'software', 'cto'],
  'hr': ['hr', 'recruiting', 'talent', 'people', 'career', 'human resources'],
  'product': ['product', 'product manager', 'product owner'],
  'design': ['design', 'ux', 'ui', 'creative'],
  'finance': ['finance', 'accounting', 'financial'],
}

async function findBestContactForJob(domain, jobTitle) {
  console.log(`\n🔍 Finding best contact for ${domain}`)
  console.log(`📝 Job Title: ${jobTitle}\n`)
  
  // ۱. Domain Search
  const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`
  const response = await fetch(url)
  const data = await response.json()
  
  if (!response.ok || !data.data?.emails?.length) {
    console.log('❌ No emails found')
    return null
  }
  
  const emails = data.data.emails
  console.log(`✅ Found ${emails.length} emails`)
  console.log(`📧 Pattern: ${data.data.pattern || 'unknown'}\n`)
  
  // ۲. شناسایی keyword ها
  const jobLower = jobTitle.toLowerCase()
  const relevantKeywords = []
  
  for (const [category, keywords] of Object.entries(JOB_TITLE_MAPPINGS)) {
    if (keywords.some(k => jobLower.includes(k))) {
      relevantKeywords.push(...keywords)
    }
  }
  
  if (relevantKeywords.length === 0) {
    relevantKeywords.push('manager', 'director', 'vp', 'head', 'lead', 'hr', 'recruit')
  }
  
  console.log('🎯 Matching keywords:', relevantKeywords.slice(0, 5).join(', '), '...\n')
  
  // ۳. Score دادن
  const scoredContacts = emails.map(email => {
    let score = 0
    const position = (email.position || '').toLowerCase()
    const department = (email.department || '').toLowerCase()
    
    relevantKeywords.forEach(keyword => {
      if (position.includes(keyword)) score += 30
      if (department.includes(keyword)) score += 20
    })
    
    if (position.includes('director')) score += 25
    if (position.includes('vp') || position.includes('vice president')) score += 20
    if (position.includes('manager')) score += 15
    if (position.includes('head')) score += 15
    if (position.includes('lead')) score += 10
    
    score += (email.confidence / 100) * 20
    
    return { email, score }
  })
  
  scoredContacts.sort((a, b) => b.score - a.score)
  
  // نمایش top 3
  console.log('🏆 Top 3 matches:')
  scoredContacts.slice(0, 3).forEach((item, i) => {
    const name = `${item.email.first_name || ''} ${item.email.last_name || ''}`.trim()
    console.log(`  ${i + 1}. ${item.email.value}`)
    console.log(`     ${name} | ${item.email.position || 'N/A'}`)
    console.log(`     Score: ${item.score.toFixed(0)} | Confidence: ${item.email.confidence}%`)
    console.log('')
  })
  
  // ۴. انتخاب بهترین
  const best = scoredContacts[0]
  if (!best || best.score < 20) {
    console.log('⚠️ No good match found')
    return null
  }
  
  // ۵. بررسی اعتبار
  console.log('🔍 Verifying best email...')
  const verifyUrl = `https://api.hunter.io/v2/email-verifier?email=${best.email.value}&api_key=${HUNTER_API_KEY}`
  const verifyResponse = await fetch(verifyUrl)
  const verifyData = await verifyResponse.json()
  
  const result = {
    email: best.email.value,
    name: `${best.email.first_name || ''} ${best.email.last_name || ''}`.trim(),
    position: best.email.position || 'Unknown',
    department: best.email.department,
    confidence: Math.min(best.score, 100),
    hunterConfidence: best.email.confidence,
    verification: verifyData.data ? {
      result: verifyData.data.result,
      score: verifyData.data.score,
    } : null,
  }
  
  console.log('\n✅ Final Result:')
  console.log(`  Email: ${result.email}`)
  console.log(`  Name: ${result.name}`)
  console.log(`  Position: ${result.position}`)
  console.log(`  Department: ${result.department || 'N/A'}`)
  console.log(`  Match Score: ${result.confidence.toFixed(0)}%`)
  console.log(`  Hunter Confidence: ${result.hunterConfidence}%`)
  if (result.verification) {
    console.log(`  Verification: ${result.verification.result} (${result.verification.score}%)`)
  }
  
  return result
}

// تست
async function runTest() {
  await findBestContactForJob('inriver.com', 'Digital Marketing Lead')
  
  console.log('\n========================================\n')
  
  // تست با شرکت دیگه
  await findBestContactForJob('stripe.com', 'Software Engineer')
}

runTest().catch(console.error)
