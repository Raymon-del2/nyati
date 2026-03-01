# 🦬 Nyati: Steel-Protected API Management

Nyati is a high-performance API key management platform designed for massive scale and developer-first security. Built with a "Turso-inspired" obsidian aesthetic, it provides the "Forge" for generating, managing, and validating secure access keys.

## Prerequisites

- **Node.js 18+** (Required for Next.js 14)
- **npm** or **yarn**
- **Supabase account** ([Create free account](https://nyaticore.vercel.app/api/v1m))
- **Ollama instance** or **Hugging Face Space** (for AI chat in /developer page)

## Quick Start for Developers

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd nyati-core
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env.local
```

4. **Configure your `.env.local` file:**
```env
# Required: Supabase (get these from your project settings)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Required: AI Service (for /developer AI chat feature)
OLLAMA_URL=https://your-ollama-instance.hf.space
```

5. **Run the development server:**
```bash
npm run dev
```

6. **Visit** `http://localhost:3000` **to access your dashboard**

## Common Setup Errors & Solutions

### Error: "NEXT_PUBLIC_SUPABASE_URL is required"
**Cause:** Missing Supabase env vars  
**Fix:** Create `.env.local` with your Supabase credentials from [Supabase Dashboard](https://app.supabase.com)

### Error: "OLLAMA_URL is not defined" (in /developer page)
**Cause:** Missing AI service URL  
**Fix:** Add `OLLAMA_URL` to `.env.local`. Get one from [Hugging Face Spaces](https://huggingface.co/spaces) or run Ollama locally

### Error: 401 Unauthorized on API routes
**Cause:** Not logged in or middleware blocking  
**Fix:** Sign up/in first. The middleware protects dashboard routes for authenticated users only.

### Error: AI not responding in chat
**Cause:** Model still loading or URL unreachable  
**Fix:** 
- First request may take 30-60s as model loads
- Check `OLLAMA_URL` is accessible (try visiting it in browser)
- The app has auto-retry logic for model loading

## Project Structure

```
nyati-core/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (proxy, AI, internal)
│   ├── [username]/        # Dashboard pages (protected)
│   ├── docs/              # Documentation pages
│   └── page.tsx           # Landing page
├── components/            # Reusable React components
├── hooks/                 # Custom React hooks (useNyatiSound, etc.)
├── lib/                   # Utilities, Supabase client, DB
├── public/                # Static assets (logo.webp, sounds/)
│   └── sounds/
│       └── nyati-wave.wav  # AI response sound
├── supabase/              # Database migrations
├── .env.example           # Environment template
└── README.md              # This file
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `OLLAMA_URL` | Yes* | Ollama/HF Space for AI chat |
| `INTERNAL_AI_URL` | No | Override internal AI endpoint |

*Required for `/developer` AI features only

## Available Scripts

- `npm run dev` - Start dev server with hot reload
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Database Setup

Run the migrations in `supabase/migrations/` to set up your database schema:
1. Go to Supabase Dashboard → SQL Editor
2. Copy and run each migration file

## Tech Stack

## 🚀 Features Built Today

- **Obsidian Dashboard**: A professional, dark-themed Command Center with a fixed sidebar and metric cards.
- **The Key Forge**: Functional UI for generating secure `ry_` prefixed API keys.
- **Steel Authentication**: Fully integrated Supabase Auth with email verification and "Check Your Email" flow.
- **Live API v1**: A functional endpoint that tracks request counts and validates `ry_` keys in real-time.
- **Identity System**: Support for custom `@usernames` and auto-generated "Auto-Putter" avatars via DiceBear.
- **Developer Docs**: Integrated documentation skeleton for R.A.T.A. protocol and integration guides.

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router) with React Server Components
- **Styling:** Tailwind CSS with custom obsidian theme
- **Icons:** Lucide-React
- **Auth & Database:** Supabase (PostgreSQL)
- **AI:** Ollama / Hugging Face Spaces (llama3.2:1b model)
- **Type Safety:** TypeScript

## 🛡️ Security Protocol (Steel Protection)

- **Prefixing**: All keys are strictly identified by the `ry_` signature
- **Hashing**: Raw keys are never stored; only SHA-256 hashes exist in the vault
- **Validation**: Real-time checking of key hints and active status

## 📈 Status: Live & Counting

The API is currently live in development mode, successfully tracking throughput and providing sub-second responses.

```bash
# Test your API key
curl -H "Authorization: Bearer ry_YOUR_KEY" http://localhost:3000/api/v1/ping
```

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:3000` to access your Nyati dashboard.
