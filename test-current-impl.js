// test-current-implementation.js
// تست کد فعلی برای پیدا کردن ایمیل

const HUNTER_API_KEY = process.env.HUNTER_API_KEY || '0351c384630362c38f9a735ee40ade0d8ff8f82d';

async function testCurrentImplementation() {
  const domain = 'inriver.com';
  const jobTitle = 'Digital Marketing Lead';
  
  console.log('🔍 Testing current implementation...');
  console.log('Domain:', domain);
  console.log('Job Title:', jobTitle);
  console.log('API Key exists:', !!HUNTER_API_KEY);
  console.log('');
  
  try {
    // تست Domain Search
    const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`;
    console.log('Calling Hunter.io Domain Search...');
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Hunter API Error:', data.errors?.[0]?.details || data);
      return;
    }
    
    console.log('✅ Hunter.io response received');
    console.log('Emails found:', data.data?.emails?.length || 0);
    console.log('Pattern:', data.data?.pattern);
    
    if (data.data?.emails?.length > 0) {
      console.log('\nAll emails:');
      data.data.emails.forEach((email, i) => {
        console.log(`${i + 1}. ${email.value} (${email.position || 'N/A'})`);
      });
      
      // تست فیلتر کردن
      console.log('\n🎯 Looking for Marketing/HR contacts...');
      const jobLower = jobTitle.toLowerCase();
      const relevantKeywords = ['marketing', 'growth', 'brand', 'content', 'demand', 'digital', 'hr', 'recruit'];
      
      const scoredContacts = data.data.emails.map(email => {
        let score = 0;
        const position = (email.position || '').toLowerCase();
        const department = (email.department || '').toLowerCase();
        
        relevantKeywords.forEach(keyword => {
          if (position.includes(keyword)) score += 30;
          if (department.includes(keyword)) score += 20;
        });
        
        if (position.includes('director')) score += 25;
        if (position.includes('vp') || position.includes('vice president')) score += 20;
        if (position.includes('manager')) score += 15;
        
        score += (email.confidence / 100) * 20;
        
        return { email, score };
      });
      
      scoredContacts.sort((a, b) => b.score - a.score);
      
      const best = scoredContacts[0];
      if (best && best.score > 20) {
        console.log('\n✅ Best match found:');
        console.log('Email:', best.email.value);
        console.log('Name:', `${best.email.first_name || ''} ${best.email.last_name || ''}`.trim());
        console.log('Position:', best.email.position);
        console.log('Score:', best.score);
      } else {
        console.log('\n⚠️ No good match found (score too low)');
        console.log('Best score was:', best?.score || 0);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCurrentImplementation();
