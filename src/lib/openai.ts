import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateCoverLetter(
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  resumeText: string,
  userName: string
): Promise<string> {
  const prompt = `Schrijf een professionele sollicitatiebrief in het NEDERLANDS voor de functie van ${jobTitle} bij ${companyName}.

Gebruik deze vacaturebeschrijving:
${jobDescription}

Gebruik dit CV als basis voor personalisatie:
${resumeText}

Schrijf de brief op naam van: ${userName}

BELANGRIJKE RICHTLIJNEN:
- Schrijf in een 100% menselijke, natuurlijke toon (niet als AI)
- Gebruik professioneel maar persoonlijk Nederlands
- Toon enthousiasme zonder overdreven te zijn
- Benoem specifieke vaardigheden uit het CV die relevant zijn voor de vacature
- Vermijd generieke frasen als "ik ben geschreven om te solliciteren"
- Houd het beknopt: maximaal 300-400 woorden
- Sluit af met een call-to-action
- Gebruik geen placeholders - schrijf een complete brief

De brief moet lijken alsof hij door een echt persoon is geschreven, niet door AI.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Je bent een ervaren Nederlandse HR-professional die overtuigende, persoonlijke sollicitatiebrieven schrijft. Je schrijft altijd in het Nederlands met een natuurlijke, menselijke toon.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.8,
    max_tokens: 1000,
  })

  return response.choices[0]?.message?.content || ''
}

export async function findCompanyWebsite(companyName: string): Promise<string | null> {
  const prompt = `Zoek naar de officiële website van dit bedrijf: ${companyName}

Geef ALLEEN de volledige URL terug (bijvoorbeeld: https://www.company.com). 
Als je het niet zeker weet, geef dan null terug.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Je bent een zoekmachine die alleen officiële bedrijfswebsites vindt. Geef alleen de URL terug, geen extra tekst.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 100,
  })

  const url = response.choices[0]?.message?.content?.trim()
  if (url && url.startsWith('http')) {
    return url
  }
  return null
}
