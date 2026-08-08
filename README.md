# Dertlyu — AI Image Generation Platform

A production-ready, provider-independent AI image generation web application built with Next.js.

## Architecture

```
Browser
   |
   v
Next.js Application
   |
   +---- API (/api/generate, /api/generations)
   |
   +---- Generation Service
              |
              v
        Provider Manager
          /          \
         v            v
 Pollinations     Hugging Face
         \            /
          \          /
           v        v
         Image Storage
               |
               v
        PostgreSQL (or in-memory for dev)
```

### Key Design Principles

- **Frontend never calls provider APIs directly** — all generation goes through `/api/generate`
- **Provider abstraction** — add/remove providers without changing the frontend
- **Secrets server-side only** — API keys, storage credentials, and database credentials never exposed to the client
- **Normalized errors** — user-friendly messages, technical details logged server-side
- **Persistent storage** — images stored in local/S3/Supabase storage, not provider URLs

## Local Setup

### Prerequisites

- Node.js 20+
- npm
- PostgreSQL (optional — uses in-memory store when `DATABASE_URL` is unset)

### Installation

```bash
npm install
cp .env.example .env
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Pollinations works without configuration. For Hugging Face, set `HF_TOKEN` in `.env`.

### Database Setup (Production)

```bash
# Set DATABASE_URL in .env, then:
npm run db:push
```

Or apply the migration manually:

```bash
psql $DATABASE_URL -f drizzle/0000_initial.sql
```

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `IMAGE_PROVIDER_PRIMARY` | No | Primary provider (`pollinations` or `huggingface`) |
| `IMAGE_PROVIDER_FALLBACK` | No | Fallback provider |
| `POLLINATIONS_API_KEY` | No | Pollinations API key (optional) |
| `HF_TOKEN` | For HF | Hugging Face API token |
| `HF_IMAGE_MODEL` | No | Hugging Face model ID |
| `DATABASE_URL` | For prod | PostgreSQL connection string |
| `STORAGE_PROVIDER` | No | `local`, `s3`, or `supabase` |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis for rate limiting |

## Provider Configuration

### Pollinations (default)

Works out of the box. Set `POLLINATIONS_API_KEY` for higher rate limits.

### Hugging Face

```env
HF_TOKEN=your_token
HF_IMAGE_MODEL=stabilityai/stable-diffusion-xl-base-1.0
IMAGE_PROVIDER_FALLBACK=huggingface
```

### Provider Fallback

```env
IMAGE_PROVIDER_PRIMARY=pollinations
IMAGE_PROVIDER_FALLBACK=huggingface
```

If the primary provider fails, the manager automatically tries the fallback.

## Storage Setup

### Local (default for development)

```env
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./storage
```

### Cloudflare R2 / S3

```env
STORAGE_PROVIDER=s3
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_URL=
```

### Supabase Storage

```env
STORAGE_PROVIDER=supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm run test         # Run tests
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema to database
```

## Testing

```bash
npm run test
```

Tests cover:
- Provider manager (primary success, fallback, all-fail)
- Request validation
- Database repository operations
- Error normalization

External providers are mocked — no real API calls in tests.

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables from `.env.example`
4. Deploy

Required for production:
- `DATABASE_URL` (PostgreSQL — e.g. Supabase, Neon)
- `STORAGE_PROVIDER` with credentials (or local won't work on serverless)
- `NEXT_PUBLIC_APP_URL` (your production URL)

Optional:
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` for distributed rate limiting
- `HF_TOKEN` for Hugging Face fallback
- `POLLINATIONS_API_KEY` for higher Pollinations limits

### Build Verification

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

## API

### POST /api/generate

```json
{
  "prompt": "A cinematic landscape",
  "width": 1024,
  "height": 1024,
  "aspectRatio": "1:1",
  "style": "realistic"
}
```

### GET /api/generations

List recent generations.

### GET /api/generations/:id

Get generation details.

## Security

- Server-side rate limiting (memory or Upstash Redis)
- Request validation with Zod
- Prompt safety checks
- No arbitrary URL fetching from client input
- User ID derived from server-side auth (never trusted from client)
- Storage path traversal prevention
- Secrets never logged or returned to client
- CSRF protection via same-origin API calls

## License

MIT
