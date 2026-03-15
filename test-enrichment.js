// test-enrichment.js
// تست Enrichment API برای اطلاعات بیشتر

const HUNTER_API_KEY = '0351c384630362c38f9a735ee40ade0d8ff8f82d';

async function enrichEmail(email) {
  const url = `https://api.hunter.io/v2/combined/enrich?email=${email}&api_key=${HUNTER_API_KEY}`;
  
  console.log(`🔍 Enriching: ${email}`);
  console.log('----------------------------------------');
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Error:', data.errors?.[0]?.details || 'Unknown error');
      return null;
    }
    
    console.log('✅ Full Data:\n');
    console.log(JSON.stringify(data.data, null, 2));
    
    return data.data;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// تست با Erika Wong
enrichEmail('erika.wong@inriver.com');
