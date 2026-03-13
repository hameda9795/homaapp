# Deploy to Vercel - Instructions

## 🚀 Quick Deploy

### 1. Environment Variables Required

Go to your Vercel Project Dashboard → Settings → Environment Variables and add these:

#### Required:
| Variable | Description | Where to get |
|----------|-------------|--------------|
| `NEXTAUTH_URL` | Your production URL | `https://homaapp.vercel.app` |
| `NEXTAUTH_SECRET` | Random secret string | Run: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `DATABASE_URL` | PostgreSQL URL | Automatically set by Vercel Postgres |

#### For Resume Uploads:
| Variable | Description |
|----------|-------------|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token | Add Vercel Blob from Integrations tab |

#### For AI Features:
| Variable | Description | Where to get |
|----------|-------------|--------------|
| `OPENAI_API_KEY` | OpenAI API Key | [OpenAI Dashboard](https://platform.openai.com) |
| `RAPIDAPI_KEY` | RapidAPI Key | [RapidAPI](https://rapidapi.com) |
| `SERPER_API_KEY` | Serper API Key (optional) | [Serper.dev](https://serper.dev) |

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials
3. Add these redirect URIs:
   - `https://homaapp.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for local dev)
4. Enable Gmail API if you want to send emails

### 3. Database Setup

1. Add Vercel Postgres from the Integrations tab
2. Run Prisma migrations:
   ```bash
   npx prisma migrate deploy
   ```

### 4. Vercel Blob Setup (for resume uploads)

1. Go to Vercel Dashboard → Storage tab
2. Add Vercel Blob
3. The `BLOB_READ_WRITE_TOKEN` will be automatically added to env vars

### 5. Build Settings

Make sure your build command is:
```bash
prisma generate && next build
```

This is already set in `package.json` scripts.

## 🔧 Troubleshooting

### "Unauthorized" error when creating profile
- Make sure `NEXTAUTH_SECRET` is set
- Make sure `NEXTAUTH_URL` matches your actual domain
- Try signing out and signing in again

### Resume upload fails
- Make sure `BLOB_READ_WRITE_TOKEN` is set
- Check Vercel Blob storage is added to your project

### Database errors
- Make sure `DATABASE_URL` is set correctly
- Run `npx prisma generate` locally and commit the changes

## 📋 Checklist before deploying

- [ ] All environment variables added to Vercel
- [ ] Google OAuth redirect URIs updated
- [ ] Database connected (Vercel Postgres)
- [ ] Vercel Blob storage added (for resumes)
- [ ] Run `npx prisma migrate deploy` after first deploy
