// test-hunter-api-v2.js
// تست API Hunter.io با فیلتر بهتر برای HR/Marketing

const HUNTER_API_KEY = '0351c384630362c38f9a735ee40ade0d8ff8f82d';

// لیست keyword های بهتر برای پیدا کردن contact مرتبط
const RELEVANT_KEYWORDS = [
  // HR/Recruiting
  'hr', 'recruit', 'talent', 'career', 'hiring', 'people', 'culture',
  // Marketing
  'marketing', 'growth', 'demand', 'brand', 'content', 'digital', 'seo', 'product',
  // Executive
  'ceo', 'founder', 'director', 'vp', 'vice president', 'head of', 'chief',
  // General
  'manager', 'lead', 'coordinator'
];

async function testHunterDomainSearch(domain, jobTitle = '') {
  const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`;
  
  console.log(`🔍 Domain: ${domain}`);
  if (jobTitle) console.log(`📝 Job Title: ${jobTitle}`);
  console.log('----------------------------------------');
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Error:', data.errors?.[0]?.details || 'Unknown error');
      return null;
    }
    
    console.log(`✅ Total emails found: ${data.data.emails.length}\n`);
    
    // نمایش همه ایمیل‌ها
    console.log('📧 All Emails:');
    data.data.emails.forEach((email, index) => {
      const name = `${email.first_name || ''} ${email.last_name || ''}`.trim();
      console.log(`${index + 1}. ${email.value} (${name || 'No name'})`);
      if (email.position) console.log(`   Position: ${email.position}`);
      console.log(`   Confidence: ${email.confidence}%`);
    });
    
    // فیلتر کردن ایمیل‌های مرتبط با job
    console.log('\n----------------------------------------');
    console.log('🎯 Relevant Contacts:\n');
    
    const relevantEmails = data.data.emails.filter(email => {
      const text = `${email.position || ''} ${email.department || ''} ${email.value}`.toLowerCase();
      return RELEVANT_KEYWORDS.some(keyword => text.includes(keyword));
    });
    
    // اگر job title داریم، score بدهیم
    if (jobTitle) {
      const jobKeywords = jobTitle.toLowerCase().split(' ');
      
      relevantEmails.sort((a, b) => {
        const scoreA = calculateRelevanceScore(a, jobKeywords);
        const scoreB = calculateRelevanceScore(b, jobKeywords);
        return scoreB - scoreA;
      });
    }
    
    if (relevantEmails.length > 0) {
      relevantEmails.forEach((email, index) => {
        const name = `${email.first_name || ''} ${email.last_name || ''}`.trim();
        console.log(`${index + 1}. ${email.value}`);
        console.log(`   Name: ${name || 'N/A'}`);
        console.log(`   Position: ${email.position || 'N/A'}`);
        console.log(`   Department: ${email.department || 'N/A'}`);
        console.log(`   Confidence: ${email.confidence}%`);
        console.log('');
      });
    } else {
      console.log('No relevant contacts found.');
    }
    
    // پیشنهاد بهترین contact برای job
    if (jobTitle && relevantEmails.length > 0) {
      console.log('----------------------------------------');
      console.log('⭐ Best Contact for this job:\n');
      const best = relevantEmails[0];
      const name = `${best.first_name || ''} ${best.last_name || ''}`.trim();
      console.log(`   ${best.value}`);
      console.log(`   ${name || 'N/A'} - ${best.position || 'N/A'}`);
      console.log(`   Confidence: ${best.confidence}%`);
    }
    
    if (data.data.pattern) {
      console.log('\n----------------------------------------');
      console.log(`📧 Email Pattern: ${data.data.pattern}`);
    }
    
    return relevantEmails;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

function calculateRelevanceScore(email, jobKeywords) {
  let score = email.confidence; // شروع با confidence score
  
  const position = (email.position || '').toLowerCase();
  const department = (email.department || '').toLowerCase();
  
  // امتیاز برای matching keywords
  jobKeywords.forEach(keyword => {
    if (position.includes(keyword)) score += 20;
    if (department.includes(keyword)) score += 15;
  });
  
  // امتیاز بیشتر برای executive roles
  if (position.includes('vp') || position.includes('vice president')) score += 10;
  if (position.includes('director')) score += 8;
  if (position.includes('manager')) score += 5;
  
  return score;
}

// تست
async function runTest() {
  // تست با inriver.com برای Digital Marketing Lead job
  await testHunterDomainSearch('inriver.com', 'Digital Marketing Lead');
}

runTest();
