# Stark Team

Private internal operations platform for structured network organizations.

## Stack
- Next.js 14 (App Router)
- Supabase (Auth, Database, Storage)
- Tailwind CSS
- Anthropic Claude API
- Vercel (deployment)

## Setup

1. Clone this repo
2. Copy `.env.example` to `.env.local` and fill in all values
3. Create a Supabase project at https://supabase.com
4. Run the SQL in `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor
5. Install dependencies: `npm install`
6. Run locally: `npm run dev`

## Environment Variables

See `.env.example` for all required variables.

## Deployment

Deploy to Vercel. Set all environment variables in the Vercel dashboard.
The leaderboard snapshot cron is configured in `vercel.json` to run daily at midnight UTC.

## Roles
- **Admin**: Full platform access
- **Leader**: Branch management, verification queue, team view
- **Member**: Activities, goals, leaderboard, AI coach

## Ranks (lowest to highest)
Distributor → Manager → Senior Manager → Executive Manager → Director
