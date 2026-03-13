# Local Testing Guide

## 1. Setup Environment Variables

فایل `.env.local` رو ویرایش کن و API Key ها رو اضافه کن:

```env
OPENAI_API_KEY="sk-your-openai-key"
RAPIDAPI_KEY="your-rapidapi-key"
```

### دریافت API Keys:

**RapidAPI Key:**
1. برو به https://rapidapi.com
2. ثبت‌نام کن
3. Subscribe to "JSearch" (رایگان هست)
4. Subscribe to "Website Contacts Scraper" 
5. از قسمت Apps، API Key رو کپی کن

**OpenAI Key:**
1. برو به https://platform.openai.com/api-keys
2. Create new secret key
3. API Key رو کپی کن

## 2. Install Dependencies

```bash
npm install
```

## 3. Run Development Server

```bash
npm run dev
```

بعد برو به: http://localhost:3000

## 4. Testing Steps

### مرحله 1: جستجوی شغل
- برو به http://localhost:3000/step1
- وارد کن: Job Title = "Software Engineer"
- Location = "Amsterdam"
- دکمه Search رو بزن

### مرحله 2: پیدا کردن ایمیل
- روی Continue to Step 2 کلیک کن
- دکمه Find HR Emails رو بزن
- منتظر بمون ایمیل‌ها پیدا بشن

### مرحله 3: ساخت کاور لتر
- روی Continue to Step 3 کلیک کن
- Name و Resume Text رو وارد کن
- دکمه Generate Cover Letters رو بزن

### مرحله 4: داشبورد
- روی View Dashboard کلیک کن
- جدول رو ببین و روی هر job کلیک کن

## Troubleshooting

### اگر "API key not configured" دیدی:
- چک کن `.env.local` درست پر شده
- سرور رو restart کن (Ctrl+C و دوباره `npm run dev`)

### اگر job search کار نکرد:
- RapidAPI key رو چک کن
- console مرورگر (F12) رو چک کن

### اگر خطای Type دیدی:
```bash
npm run build
```
بگیر و خطا رو ببین
