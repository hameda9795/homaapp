// test-api-integration.js
// تست API integration

async function testAPIIntegration() {
  const testJobs = [
    {
      job_id: 'test1',
      employer_name: 'Inriver',
      employer_website: 'https://www.inriver.com',
      job_title: 'Digital Marketing Lead'
    }
  ];
  
  console.log('🧪 Testing API integration...\n');
  
  try {
    // تست find-emails API
    const response = await fetch('http://localhost:3000/api/jobs/find-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobs: testJobs }),
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('\nResults:');
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      console.log('Job:', result.job_title);
      console.log('Company:', result.employer_name);
      console.log('Email:', result.hrEmail);
      console.log('Contact Name:', result.contactName);
      console.log('Contact Position:', result.contactPosition);
      console.log('Confidence:', result.confidence);
      console.log('Source:', result.emailSource);
      
      if (result.hrEmail?.includes('info@') || result.hrEmail?.includes('contact@')) {
        console.log('\n⚠️ WARNING: Got generic email instead of individual!');
        console.log('This means Hunter.io failed and fallback was used.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure the dev server is running: npm run dev');
  }
}

testAPIIntegration();
