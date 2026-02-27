# 🦬 Nyati: Steel-Protected API Management

Nyati is a high-performance API key management platform designed for massive scale and developer-first security. Built with a "Turso-inspired" obsidian aesthetic, it provides the "Forge" for generating, managing, and validating secure access keys.

## 🚀 Features Built Today

- **Obsidian Dashboard**: A professional, dark-themed Command Center with a fixed sidebar and metric cards.
- **The Key Forge**: Functional UI for generating secure `ry_` prefixed API keys.
- **Steel Authentication**: Fully integrated Supabase Auth with email verification and "Check Your Email" flow.
- **Live API v1**: A functional endpoint that tracks request counts and validates `ry_` keys in real-time.
- **Identity System**: Support for custom `@usernames` and auto-generated "Auto-Putter" avatars via DiceBear.
- **Developer Docs**: Integrated documentation skeleton for R.A.T.A. protocol and integration guides.

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router) with Tailwind CSS
- **Icons**: Lucide-React & Heroicons
- **Backend**: Supabase (Auth & PostgreSQL)
- **Logic**: High-speed TypeScript (Ready for Rust Engine integration)

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
