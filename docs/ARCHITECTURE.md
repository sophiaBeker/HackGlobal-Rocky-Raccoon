# Architecture Overview

Safety Quest is a small full-stack web application. The browser serves the learning interface, an Express server provides application APIs, Supabase handles authentication and persistent learner data, and an NRP-hosted language model powers Ask Rocky.

## High-level request flow

```text
Learner's browser
  ├── HTML, CSS, and JavaScript
  ├── Public Supabase project URL/key
  └── Same-origin requests to /api/*
          |
          v
Node.js + Express server
  ├── Serves the frontend files
  ├── Authenticates requests with Supabase
  ├── Loads lesson content
  ├── Applies request validation, privacy checks,
  |   rate limits, and AI safety screening
  ├── Calls the NRP OpenAI-compatible API for Ask Rocky
  └── Uses Supabase for account-related data operations
          |
          +----> Supabase Auth and database
          |
          +----> NRP-hosted language model
```

## Main components

### Frontend

- `index.html` provides the main application page.
- `css/` contains the page styles, component styles, and responsive presentation.
- `js/` contains the browser-side application behavior, including lessons, flashcards, profile/progress features, and Rocky conversation UI.
- `config.js` contains browser-visible configuration for the Supabase URL and public key, plus the same-origin chat endpoint. It must never contain server-only credentials.

### Backend

- `server/server.js` creates the Express application, serves the frontend, configures security middleware, and defines API routes such as `/api/chat` and `/api/health`.
- `server/account.js` handles the account-deletion endpoint. Deletion requires server-side password re-verification and the Supabase service-role key.
- `server/rocky-explain.js` contains the lesson-explanation endpoint.
- `server/lib/` contains shared authentication, lesson loading, moderation, privacy, and topic-classification helpers.

### Supabase

`supabase-schema.sql` defines the learner progress and conversation data structures, indexes, and Row Level Security policies. Supabase Auth manages registered accounts. Row Level Security policies are intended to restrict learner records to the authenticated owner.

### AI integration

Ask Rocky sends requests from the Express backend to the NRP OpenAI-compatible API. The API token is read from the server environment and must not be exposed to the browser. The backend applies validation and safety checks before and after model responses; these checks are prototype safeguards, not a substitute for professional child-safety review.

## Configuration and trust boundaries

- Browser configuration is public. Treat anything in `config.js` as visible to every visitor.
- `NRP_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are private server secrets and belong only in the server's environment.
- The Supabase public/anonymous key is not a substitute for database authorization; Row Level Security must be enabled and correctly configured.
- The server is intended to sit behind a reverse proxy in production. Proxy trust settings should match the actual number and arrangement of trusted proxies.

## Tests

The `tests/` directory contains Node.js tests for selected account, lesson, and topic behavior. Run them with `npm test`. These tests do not replace end-to-end browser, deployment, external-service, or security testing.
