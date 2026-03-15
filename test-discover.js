// test-discover.js
// تست Discover API برای پیدا کردن شرکت‌ها

const HUNTER_API_KEY = '0351c384630362c38f9a735ee40ade0d8ff8f82d';

async function discoverCompanies(filters) {
  const url = `https://api.hunter.io/v2/discover?api_key=${HUNTER_API_KEY}`;
  
  console.log('🔍 Discovering companies...');
  console.log('Filters:', JSON.stringify(filters, null, 2));
  console.log('----------------------------------------');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Error:', data.errors?.[0]?.details || 'Unknown error');
      return null;
    }
    
    console.log(`✅ Found ${data.data.length} companies\n`);
    
    data.data.forEach((company, index) => {
      console.log(`${index + 1}. ${company.organization}`);
      console.log(`   Domain: ${company.domain}`);
      console.log(`   Emails: ${company.emails_count?.total || 0} total`);
      console.log('');
    });
    
    return data.data;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// تست با فیلتر برای شرکت‌های هلندی
async function runTest() {
  // فیلتر: شرکت‌های هلندی با تعداد کارمند ۱۱-۲۰۰
  await discoverCompanies({
    headquarters_location: {
      include: [
        { country: 'NL' }  // Netherlands
      ]
    },
    headcount: ['11-50', '51-200', '201-500'],
    limit: 10
  });
}

runTest();
