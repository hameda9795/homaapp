# JobAuto - AI-Powered Job Application Automation

A Next.js 14 web application that automates job searching and application processes using AI-generated cover letters in Dutch.

## Features

- **User Onboarding**: Upload resume, set job preferences, connect Gmail
- **Job Search**: Automatically search LinkedIn and Indeed via JSearch API
- **Email Discovery**: Find HR contact emails from company websites
- **AI Cover Letters**: Generate personalized Dutch cover letters using GPT-4o
- **Dashboard**: Track all applications with status updates
- **Email Sending**: Send applications directly from connected Gmail
- **Dark Mode**: Full dark mode support

## Tech Stack

- **Framework**: Next.js 14 App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Neon) + Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **AI**: OpenAI GPT-4o
- **APIs**: JSearch API, Website Contacts Scraper API

## Getting Started

### 1. Clone and Install

```bash
cd job-automation
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Random secret for NextAuth
- `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for development)
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
- `OPENAI_API_KEY`: Your OpenAI API key
- `RAPIDAPI_KEY`: Your RapidAPI key (for JSearch & Website Contacts Scraper)
- `SERPER_API_KEY`: (Optional) For Google Search fallback

### 3. Database Setup

```bash
# Run Prisma migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env.local`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign In**: Click "Sign In" and authenticate with Google (includes Gmail permission)
2. **Complete Onboarding**: 
   - Upload your resume (PDF/DOCX)
   - Enter job titles you're looking for
   - Add education, location, and languages
   - Select job sources (LinkedIn, Indeed)
   - Set daily job limit
3. **Dashboard**: 
   - Click "Search Jobs" to find new opportunities
   - Review found jobs and generated cover letters
   - Click "Send" to email applications directly
   - Track application status

## API Integration Details

### JSearch API (RapidAPI)
- Endpoint: `https://jsearch.p.rapidapi.com/search`
- Returns: Job listings from LinkedIn & Indeed

### Website Contacts Scraper (RapidAPI)
- Endpoint: `https://website-contacts-scraper.p.rapidapi.com/scrape`
- Returns: Emails, phones, social links from company websites
- Filters: Only keeps emails with HR keywords (careers, hr, jobs, etc.)

### OpenAI GPT-4o
- Generates human-like Dutch cover letters
- Personalizes based on job description + resume

## Project Structure

```
job-automation/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # NextAuth.js
│   │   │   ├── jobs/         # Job search & management
│   │   │   ├── cover-letter/ # Cover letter generation
│   │   │   ├── send-email/   # Gmail integration
│   │   │   └── profile/      # User profile
│   │   ├── auth/signin/      # Sign in page
│   │   ├── onboarding/       # Onboarding wizard
│   │   ├── dashboard/        # Main dashboard
│   │   ├── page.tsx          # Landing page
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   ├── theme-provider.tsx
│   │   ├── session-provider.tsx
│   │   └── navbar.tsx
│   ├── lib/
│   │   ├── utils.ts          # Utility functions
│   │   ├── prisma.ts         # Prisma client
│   │   ├── auth.ts           # Auth configuration
│   │   ├── api.ts            # External API helpers
│   │   └── openai.ts         # OpenAI integration
│   └── types/
│       └── index.ts          # TypeScript types
├── prisma/
│   └── schema.prisma         # Database schema
├── .env.example
├── next.config.js
├── tailwind.config.ts
└── package.json
```

## Important Edge Cases Handled

1. **Missing Company Website**: Uses Google Search API to find official website
2. **No HR Email Found**: Marks job as "Manual Apply"
3. **Rate Limiting**: Adds delays between API calls (500ms-2000ms)
4. **Duplicate Prevention**: Checks if job already exists before adding
5. **Daily Limits**: Enforces user-defined daily job processing limits

## License

MIT
