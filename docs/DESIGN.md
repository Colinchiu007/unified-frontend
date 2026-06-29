# Design Decisions — unified-frontend

## Server Component First

**Decision**: Default to Server Components; use Client Components only when interactivity is needed.

**Rationale**: Smaller JS bundle, faster page loads, better SEO. Server Components handle initial data fetch, Client Components handle user interaction.

## Three States Mandatory

**Decision**: Every Client Component must implement loading / error / empty states.

**Rationale**: Consistent UX across all interactive pages. Prevents partial rendering and broken state flash.

## API Encapsulation

**Decision**: All orchestrator API calls go through @/lib/api abstraction layer.

**Rationale**: Single point for token injection, error handling, and timeout management. Components never fetch directly.

## Token Expiry Handling

**Decision**: Token expiry detected in finally block with redirected flag guard. Components set redirected=true before router.push() to prevent setState on unmounted component.

**Rationale**: Prevents React memory leak warnings and duplicate redirects.

## API Isolation

**Decision**: Each API call in @/lib/api is isolated — one fetch, one response handler. No shared state in the API layer.

**Rationale**: Prevents cross-contamination between API calls. Makes testing easier.

## Directory Structure

- `src/app/` — Next.js App Router pages
- `src/components/` — Reusable components
- `src/lib/` — Utilities and API layer
- `src/__tests__/` — Test files mirroring src structure
