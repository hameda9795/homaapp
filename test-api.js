const key = process.env.RAPIDAPI_KEY || require('fs').readFileSync('.env.local', 'utf8').match(/RAPIDAPI_KEY="(.+)"/)[1];

console.log('Testing email scraper endpoints...\n');

const endpoints = [
  'https://website-contacts-scraper.p.rapidapi.com/scrape-contacts?query=google.com',
  'https://website-contacts-scraper.p.rapidapi.com/scrape?domain=google.com',
  'https://website-contacts-scraper.p.rapidapi.com/scrape?website=google.com',
];

async function test() {
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: {
          'x-rapidapi-key': key,
          'x-rapidapi-host': 'website-contacts-scraper.p.rapidapi.com'
        }
      });
      console.log(`${url.split('/').pop()}: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log('  Response:', JSON.stringify(data).slice(0, 200));
      }
    } catch (e) {
      console.log(`${url.split('/').pop()}: ERROR - ${e.message}`);
    }
  }
}

test();
