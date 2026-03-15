// test-language-filter.js
// تست دقت فیلتر زبان

const testJobs = [
  {
    job_title: "Digital Marketing Manager",
    job_description: "We are looking for a Digital Marketing Manager. English required. Dutch not necessary."
  },
  {
    job_title: "Marketing Manager",
    job_description: "We zoeken een Marketing Manager. Nederlands verplicht. Je moet vloeiend Nederlands spreken."
  },
  {
    job_title: "Software Engineer",
    job_description: "Looking for a Software Engineer. English speaking team. No Dutch required."
  },
  {
    job_title: "Sales Representative",
    job_description: "Verkoopmedewerker gezocht. Vereist: Nederlands moet je goed beheersen."
  },
  {
    job_title: "Product Manager",
    job_description: "International team. English is our working language. Dutch is a plus."
  }
];

function filterJobsByLanguage(jobs, language) {
  return jobs.filter(job => {
    const title = (job.job_title || '').toLowerCase();
    const description = (job.job_description || '').toLowerCase();
    const text = title + ' ' + description;
    
    if (language === 'english') {
      const dutchIndicators = ['nederlands', 'verplicht', 'moet', 'vereist', 'kunnen'];
      const hasDutch = dutchIndicators.some(word => text.includes(word));
      const hasEnglishIndicator = text.includes('english') || text.includes('engels');
      return !hasDutch || hasEnglishIndicator;
    } else if (language === 'netherlands') {
      const dutchIndicators = ['nederlands', 'verplicht', 'moet', 'vereist'];
      return dutchIndicators.some(word => text.includes(word));
    }
    return true;
  });
}

console.log('🧪 Testing Language Filter\n');
console.log('Test Jobs:');
testJobs.forEach((job, i) => {
  console.log(`${i + 1}. ${job.job_title}`);
});

console.log('\n--- English Filter ---');
const englishJobs = filterJobsByLanguage(testJobs, 'english');
console.log(`Found ${englishJobs.length} English jobs:`);
englishJobs.forEach(job => console.log(`  - ${job.job_title}`));

console.log('\n--- Netherlands Filter ---');
const dutchJobs = filterJobsByLanguage(testJobs, 'netherlands');
console.log(`Found ${dutchJobs.length} Dutch jobs:`);
dutchJobs.forEach(job => console.log(`  - ${job.job_title}`));

console.log('\n--- Analysis ---');
console.log('Expected English jobs: 3 (Digital Marketing, Software Engineer, Product Manager)');
console.log('Expected Dutch jobs: 2 (Marketing Manager, Sales Representative)');
console.log(`Actual English: ${englishJobs.length}, Dutch: ${dutchJobs.length}`);
