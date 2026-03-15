// find-email-by-name.js
// پیدا کردن ایمیل با اسم و شرکت

const HUNTER_API_KEY = '0351c384630362c38f9a735ee40ade0d8ff8f82d';

async function findEmailByName(firstName, lastName, domain) {
  const url = `https://api.hunter.io/v2/email-finder?first_name=${firstName}&last_name=${lastName}&domain=${domain}&api_key=${HUNTER_API_KEY}`;
  
  console.log(`🔍 Finding: ${firstName} ${lastName} @ ${domain}`);
  console.log('----------------------------------------');
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Error:', data.errors?.[0]?.details || 'Unknown error');
      return null;
    }
    
    const result = data.data;
    
    console.log(`📧 Email: ${result.email}`);
    console.log(`💯 Confidence: ${result.confidence}%`);
    console.log(`📊 Score: ${result.score}%`);
    console.log(`📍 Position: ${result.position || 'N/A'}`);
    console.log(`🏢 Company: ${result.company || 'N/A'}`);
    
    if (result.sources && result.sources.length > 0) {
      console.log(`\n📚 Sources (${result.sources.length}):`);
      result.sources.forEach((source, i) => {
        console.log(`   ${i + 1}. ${source.domain} (${source.uri})`);
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// تست با اسم‌های مختلف برای پیدا کردن HR/Marketing
async function runTests() {
  // پیدا کردن Erika Wong (که تو سرچ LinkedIn پیدا کردیم)
  await findEmailByName('Erika', 'Wong', 'inriver.com');
  console.log('\n========================================\n');
  
  // Mark Ortiz رو هم دوباره چک کنیم
  await findEmailByName('Mark', 'Ortiz', 'inriver.com');
}

runTests();
