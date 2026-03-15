// verify-email.js
// بررسی اعتبار ایمیل با Hunter.io Email Verifier

const HUNTER_API_KEY = '0351c384630362c38f9a735ee40ade0d8ff8f82d';

async function verifyEmail(email) {
  const url = `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${HUNTER_API_KEY}`;
  
  console.log(`🔍 Verifying: ${email}`);
  console.log('----------------------------------------');
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Error:', data.errors?.[0]?.details || 'Unknown error');
      return;
    }
    
    const result = data.data;
    
    console.log(`📧 Email: ${result.email}`);
    console.log(`📊 Status: ${result.status}`); // valid, invalid, accept_all, etc.
    console.log(`🎯 Result: ${result.result}`); // deliverable, undeliverable, risky
    console.log(`💯 Score: ${result.score}%`);
    console.log(`📍 Regexp: ${result.regexp ? '✅ Valid format' : '❌ Invalid format'}`);
    console.log(`🌐 MX Records: ${result.mx_records ? '✅ Found' : '❌ Not found'}`);
    console.log(`🔒 SMTP Check: ${result.smtp_check !== undefined ? (result.smtp_check ? '✅ Valid' : '❌ Invalid') : 'N/A'}`);
    
    if (result.sources && result.sources.length > 0) {
      console.log(`\n📚 Sources (${result.sources.length}):`);
      result.sources.slice(0, 5).forEach((source, i) => {
        console.log(`   ${i + 1}. ${source.domain} (${source.extracted_on})`);
      });
    }
    
    // نتیجه‌گیری
    console.log('\n----------------------------------------');
    if (result.result === 'deliverable' && result.score >= 80) {
      console.log('✅ ایمیل معتبر و قابل ارسال است');
    } else if (result.result === 'risky') {
      console.log('⚠️ ایمیل risk دارد (احتمال bounce)');
    } else if (result.result === 'undeliverable') {
      console.log('❌ ایمیل نامعتبر است');
    } else {
      console.log(`ℹ️ وضعیت: ${result.result}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// تست ایمیل‌های پیدا شده
const emailsToVerify = [
  'mark.ortiz@inriver.com',
  'warren.daniels@inriver.com',
];

async function runVerification() {
  for (const email of emailsToVerify) {
    await verifyEmail(email);
    console.log('\n========================================\n');
  }
}

runVerification();
