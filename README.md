# Dertlyu — AI Image Generation Platform

Production-ready AI image generation web app with a **provider-independent** architecture. The browser talks only to the application API; image providers, storage credentials, and database access stay server-side.

## Architecture

```text
Browser
   |
   v
Next.js Application
   |
   +---- API (/api/generate, /api/generations, /api/images)
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
         Image Storage (local / Netlify Blobs / R2)
               |
               v
           PostgreSQL (or in-memory for local/tests)
```

### Key directories

| Path | Purpose |
|---|---|
| `src/app` | UI routes and API handlers |
| `src/components` | Generate form, result, history |
| `src/lib/ai` | Provider interface, manager, Pollinations & Hugging Face |
| `src/lib/generation` | Validation + orchestration service |
| `src/lib/storage` | Object storage abstraction |
| `src/lib/db` | Generations schema + repositories |
| `src/lib/rate-limit` | In-memory / Upstash rate limiting |
| `netlify/database/migrations` | Postgres migrations |

## Local setup

Requirements: **Node.js 20+**, npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without `DATABASE_URL`, generations are stored in an in-memory repository (fine for local UI testing; data resets on restart). Without provider credentials, configure at least one provider (Pollinations works for many public models; Hugging Face requires `HF_TOKEN`).

## Environment variables

See [`.env.example`](./.env.example). Important variables:

| Variable | Required | Description |
|---|---|---|
| `IMAGE_PROVIDER_PRIMARY` | No (default `pollinations`) | Primary provider |
| `IMAGE_PROVIDER_FALLBACK` | No | Fallback provider |
| `POLLINATIONS_API_KEY` | Recommended | Pollinations API key |
| `HF_TOKEN` | For Hugging Face | Hugging Face token |
| `HF_IMAGE_MODEL` | No | Default HF model id |
| `DATABASE_URL` / `NETLIFY_DB_URL` | Prod | Postgres connection |
| `STORAGE_PROVIDER` | No | `local` \| `blobs` \| `r2` \| `memory` |
| `R2_*` | If R2 | Cloudflare R2 credentials |
| `UPSTASH_REDIS_REST_*` | Optional | Distributed rate limits |

Never commit real secrets. `.env*` files are gitignored (except `.env.example`).

## Provider configuration

1. Set `IMAGE_PROVIDER_PRIMARY` / `IMAGE_PROVIDER_FALLBACK`.
2. Configure credentials for each enabled provider.
3. If Hugging Face is unset, it is simply disabled; Pollinations can still run.
4. Frontend never calls provider URLs — only `POST /api/generate`.

## Database setup

Schema: `generations` (prompt, dimensions, provider/model metadata, image URL, storage key, status, timestamps). Indexes on `user_id`, `created_at`, `status`.

### Netlify Database (recommended for Netlify deploys)

```bash
npm install
npx netlify database init --yes   # or link an existing site
npm run db:generate               # after schema edits
# Hosted migrations apply automatically on deploy
# Local only:
npm run db:migrate
```

### Any Postgres

Set `DATABASE_URL` and apply `netlify/database/migrations/0000_generations.sql`.

## Storage setup

| Provider | When to use |
|---|---|
| `local` | Local development (writes to `.data/images`) |
| `blobs` | Netlify Blobs in production |
| `r2` | Cloudflare R2 / S3-compatible |
| `memory` | Tests |

Images are always persisted through the storage abstraction; clients receive application URLs such as `/api/images/...` (or a public R2 URL).

## Development commands

```bash
npm run dev          # Next.js dev server
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm test             # Vitest (providers mocked)
npm run build        # Production build
```

## Testing

Tests mock external image providers. They cover:

- Provider success / timeout / malformed responses
- Provider manager primary + fallback
- API validation, rate limiting, successful generation
- Repository create/list
- Authorization (users cannot read others’ generations)
- No secret leakage in API responses

## Deployment (Netlify)

1. Push this repository and create/link a Netlify site.
2. Set environment variables from `.env.example` in the Netlify UI (never commit secrets).
3. Prefer `STORAGE_PROVIDER=blobs` and Netlify Database (`@netlify/database` is already a dependency).
4. Deploy. Build command: `npm run build` (see `netlify.toml`).
5. Confirm `/api/health` reports expected provider availability.

`netlify.toml` is included. No production deploy is performed by this project setup until you configure credentials in Netlify.

## Security notes

- Provider and storage credentials are server-only.
- Session user id comes from an HTTP-only cookie (middleware); client `user_id` is rejected.
- Request body size, dimensions, and prompt length are validated with Zod (`.strict()`).
- Arbitrary provider/URL injection from the client is rejected.
- Rate limiting is enforced server-side.
- History routes are `noindex`.
- Errors returned to the client are normalized codes/messages only.

## License

Private repository — see GitHub settings for access control.
