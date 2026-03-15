// test-hunter-api.js
// تست API Hunter.io برای پیدا کردن ایمیل

const HUNTER_API_KEY = '0351c384630362c38f9a735ee40ade0d8ff8f82d';

async function testHunterDomainSearch(domain) {
  const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`;
  
  console.log(`🔍 Searching for domain: ${domain}`);
  console.log('----------------------------------------');
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Error:', data.errors?.[0]?.details || 'Unknown error');
      return;
    }
    
    console.log(`✅ Found ${data.data.emails.length} emails\n`);
    
    // نمایش ایمیل‌های پیدا شده
    data.data.emails.slice(0, 10).forEach((email, index) => {
      console.log(`${index + 1}. ${email.value}`);
      console.log(`   Confidence: ${email.confidence}%`);
      if (email.first_name || email.last_name) {
        console.log(`   Name: ${email.first_name || ''} ${email.last_name || ''}`);
      }
      if (email.position) {
        console.log(`   Position: ${email.position}`);
      }
      if (email.department) {
        console.log(`   Department: ${email.department}`);
      }
      console.log('');
    });
    
    // فیلتر کردن ایمیل‌های مرتبط با HR/Marketing
    console.log('----------------------------------------');
    console.log('🎯 HR/Marketing Related Emails:\n');
    
    const hrKeywords = ['hr', 'recruit', 'talent', 'career', 'marketing', 'digital'];
    const hrEmails = data.data.emails.filter(email => {
      const text = `${email.position || ''} ${email.department || ''} ${email.value}`.toLowerCase();
      return hrKeywords.some(keyword => text.includes(keyword));
    });
    
    if (hrEmails.length > 0) {
      hrEmails.forEach((email, index) => {
        console.log(`${index + 1}. ${email.value}`);
        console.log(`   Confidence: ${email.confidence}%`);
        console.log(`   Position: ${email.position || 'N/A'}`);
        console.log(`   Department: ${email.department || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('No HR/Marketing emails found in the results.');
    }
    
    // نمایش pattern ایمیل‌ها
    if (data.data.pattern) {
      console.log('----------------------------------------');
      console.log(`📧 Email Pattern: ${data.data.pattern}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// تست با چند دامنه
const domainsToTest = [
  'inriver.com',
  // می‌تونی دامنه‌های دیگه هم اضافه کنی
];

async function runTests() {
  for (const domain of domainsToTest) {
    await testHunterDomainSearch(domain);
    console.log('\n========================================\n');
  }
}

runTests();
