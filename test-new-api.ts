// test-new-api.ts
// تست کد جدید api.ts

require('dotenv').config()

const { findHREmail } = require('./src/lib/api')

async function test() {
  console.log('🧪 Testing new API with Hunter.io integration\n')
  
  // تست با Inriver
  const result = await findHREmail(
    'Inriver',
    'https://www.inriver.com',
    'Digital Marketing Lead'
  )
  
  if (result) {
    console.log('\n✅ Success!')
    console.log('Email:', result.email)
    console.log('Name:', result.name)
    console.log('Position:', result.position)
    console.log('Department:', result.department)
    console.log('Confidence:', result.confidence + '%')
    console.log('Source:', result.source)
    if (result.verification) {
      console.log('Verification:', result.verification.result, `(${result.verification.score}%)`)
    }
  } else {
    console.log('\n❌ No contact found')
  }
}

test().catch(console.error)
