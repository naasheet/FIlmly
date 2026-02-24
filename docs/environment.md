# Environment variables

## apps/api
Required:
- DATABASE_URL
- JWT_SECRET

Optional:
- PORT (default: 4000)
- REDIS_URL
- ACCESS_TOKEN_TTL (default: 15m)
- REFRESH_TOKEN_TTL (default: 7d)
- OMDB_API_KEY
- BREVO_API_KEY
- BREVO_SENDER_EMAIL
- BREVO_SENDER_NAME (default: Filmly)
- RESET_CODE_TTL_MINUTES (default: 10)
- RESET_CODE_LENGTH (default: 6)

Examples:
- `.env.example` for local + general settings
- `.env.local.example` for local PostgreSQL

## apps/web
Required:
- VITE_API_URL (default: http://localhost:4000)
