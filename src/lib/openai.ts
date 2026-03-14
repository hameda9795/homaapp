import OpenAI from 'openai'

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set')
  }
  return new OpenAI({ apiKey })
}

export async function generateCoverLetter(
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  resumeText: string,
  userName: string,
  education: string = '',
  language: 'en' | 'nl' = 'nl'
): Promise<string> {
  const openai = getOpenAIClient()
  
  const isDutch = language === 'nl'
  
  // Build education section if provided
  const educationSection = education 
    ? (isDutch 
        ? `Opleiding: ${education}\n` 
        : `Education: ${education}\n`)
    : ''
  
  const prompt = isDutch 
    ? `Schrijf een sollicitatiebrief voor de functie van ${jobTitle} bij ${companyName}.

VACATURE:
${jobDescription}

MIJN ACHTERGROND:
${resumeText}
${educationSection}

MIJN NAAM: ${userName}

KRITIEKE INSTRUCTIES (volg deze strikt):
1. Schrijf als een ECHT PERSOON, niet als een robot of AI
2. Gebruik informeel, persoonlijk Nederlands (geen "geachte", gebruik "hoi" of "hallo")
3. Begin met iets specifieks over het bedrijf dat je echt aanspreekt
4. Vertel een kort verhaal of geef een concreet voorbeeld
5. Vermijd formele zinnen als "ik solliciteer naar deze functie"
6. Gebruik korte zinnen en normale taal zoals in een WhatsApp-bericht
7. Maximaal 250 woorden
8. Eindig met een casual call-to-action zoals "Laat maar weten!" of "Ik hoor graag van je"

De brief moet klinken alsof een vriend het voor je heeft geschreven, niet een computer.`
    : `Write a cover letter for the position of ${jobTitle} at ${companyName}.

JOB DESCRIPTION:
${jobDescription}

MY BACKGROUND:
${resumeText}
${educationSection}

MY NAME: ${userName}

CRITICAL INSTRUCTIONS (follow strictly):
1. Write like a REAL PERSON, not a robot or AI
2. Use informal, personal English (warm and friendly tone)
3. Start with something specific about the company that genuinely appeals to you
4. Tell a short story or give a concrete example
5. Avoid formal phrases like "I am writing to apply for this position"
6. Use short sentences and casual language like in a text message
7. Maximum 250 words
8. End with a casual call-to-action like "Let me know!" or "Looking forward to hearing from you"

The letter should sound like a friend wrote it for you, not a computer.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: isDutch 
          ? 'Je bent een vriend die helpt met solliciteren. Je schrijft informeel, persoonlijk en authentiek. Geen robotspraak.'
          : 'You are a friend helping with job applications. You write informally, personally and authentically. No robot speak.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.9,
    max_tokens: 800,
  })

  return response.choices[0]?.message?.content || ''
}

export async function findCompanyWebsite(companyName: string): Promise<string | null> {
  const openai = getOpenAIClient()
  
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
