# Bitcoin Blocks 🛠️

A Farcaster Mini App game where users predict Bitcoin block transaction counts and win prizes!

## Features

- 🎮 **Real-time Gameplay** - Predict Bitcoin block transactions
- 🏆 **Leaderboard** - See who's closest to the actual count
- 💬 **Live Chat** - Chat with other players in real-time
- 💰 **Prize System** - Win $SECOND tokens for accurate predictions
- 👑 **Admin Panel** - Manage rounds and prizes

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Auth**: Farcaster Mini App SDK
- **Wallet**: Wagmi + Farcaster Wallet Connector
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/bitcoin-blocks.git
cd bitcoin-blocks

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your credentials
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Neynar API (for Farcaster user lookup)
NEXT_PUBLIC_NEYNAR_API_KEY=your_neynar_api_key

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_FIDS=250704,1107084
```

### Database Setup

1. Create a new Supabase project
2. Run the SQL schema in `supabase/schema.sql`
3. Enable Realtime for all tables

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Game Flow

1. **Admin creates a round** with duration and prize
2. **Users submit predictions** for transaction count
3. **Round closes** when timer expires
4. **Admin fetches Bitcoin data** and determines winner
5. **Winner announced** in real-time to all players

## Admin Access

Admin FIDs are configured in `.env.local`:
- FID 250704
- FID 1107084

Admins can:
- Create new rounds
- Close rounds
- Update round results
- Configure prizes

## Deployment

### Vercel

```bash
# Deploy to Vercel
vercel --prod
```

### Environment Variables on Vercel

Set the same environment variables from `.env.local` in your Vercel project settings.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  VERCEL (Frontend)                       │
│  - Next.js App                                          │
│  - React Components                                     │
│  - Supabase Client → Realtime Subscriptions            │
└─────────────────────────────────────────────────────────┘
                         ↕️ WebSocket
┌─────────────────────────────────────────────────────────┐
│              SUPABASE (Backend)                          │
│  - PostgreSQL Database                                  │
│  - Row Level Security                                   │
│  - Realtime Subscriptions                               │
│  - Tables: rounds, guesses, chat_messages, prize_config │
└─────────────────────────────────────────────────────────┘
```

## License

MIT
