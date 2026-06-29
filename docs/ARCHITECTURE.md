# Architecture — unified-frontend

## System Positioning

unified-frontend sits as the unified web interface in front of the platform-orchestrator:

```
Browser → unified-frontend (Next.js 15) → orchestrator (FastAPI :8000) → sub-modules
```

## Rendering Architecture

### Server Components (default)
- Static/dashboard pages
- Data fetching via fetch() in Server Components
- Pass data down to Client Components as props

### Client Components ('use client')
- Interactive pages (settings, login, user profile)
- State management via hooks
- API calls through @/lib/api abstraction layer

## Data Flow

```
User Action → Client Component → @/lib/api → orchestrator API → Response
                                      ↓ (token injection happens here)
```

## Page Module Organization

| Route | Type | Component | Data Source |
|-------|------|-----------|-------------|
| / | Server | DashboardShell | orchestrator /health |
| /login | Client | LoginForm | orchestrator /auth/login |
| /settings | Client | SettingsPage | orchestrator /users/me |
| /trending/[platform] | Server | TrendingFeed | orchestrator /api/v1/trending |
| /user/* | Client | UserLayout | orchestrator /users/me |

## Security Architecture

- All client-side API calls go through `@/lib/api` which injects JWT
- Token expiry detection in finally block with redirected guard
- Login redirect using `router.push('/login')`
- No direct fetch from components
