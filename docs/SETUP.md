# Local Setup Guide

This guide explains how to run Safety Quest on a development computer. It does not configure or modify the production Vultr server.

## 1. Prerequisites

Install:

- [Node.js 22 or later](https://nodejs.org/) (npm is included).
- [Git](https://git-scm.com/).
- A [Supabase](https://supabase.com/) project for authentication and saved learner data.
- An NRP API token if you want to use Rocky's live AI responses.

You can still explore the guest learning experience without configuring every external service. Features that depend on Supabase or the AI provider will need their respective credentials.

## 2. Clone the repository and install dependencies

Open a terminal and run:

```bash
git clone https://github.com/sophiaBeker/HackGlobal-Rocky-Raccoon.git
cd HackGlobal-Rocky-Raccoon
npm install
```

## 3. Configure Supabase

1. Create a project in the [Supabase dashboard](https://supabase.com/dashboard).
2. Open the project's **SQL Editor**.
3. Open `supabase-schema.sql` from this repository, copy its contents, and run the SQL in the Supabase SQL Editor. This creates the learner progress and conversation tables, indexes, and Row Level Security policies used by the application.
4. In the Supabase project settings, locate the project URL and public/anonymous (publishable) key.
5. Put those values in your local `.env` file as `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
6. Update the matching `supabaseUrl` and `supabaseAnonKey` values in the public `config.js` file so the browser connects to the same Supabase project.

The public browser key is designed to be used by the frontend. Database access must remain protected by the Row Level Security policies in `supabase-schema.sql`.

### Account deletion

The account-deletion endpoint requires `SUPABASE_SERVICE_ROLE_KEY` in the server-side `.env` file. This is a privileged secret: never put it in `config.js`, frontend JavaScript, HTML, screenshots, or source control. If it is not configured, account deletion will report that the feature is not configured.

## 4. Configure environment variables

Create a local environment file from the provided template:

```bash
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Open `.env` and replace the example values. The main settings are:

| Variable | Purpose |
|---|---|
| `PORT` | Local server port; defaults to `3000`. |
| `NRP_API_KEY` | Server-side API token for Rocky's AI. |
| `NRP_BASE_URL` | NRP OpenAI-compatible API base URL. The template contains the project endpoint. |
| `NRP_MODEL` | Model name; the template uses `gpt-oss`. |
| `SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_ANON_KEY` | Supabase public/anonymous key used by the server's Supabase client. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional for ordinary app use; required for the server-side account deletion feature. Keep it secret. |

The template also includes optional rate-limit, proxy, cache-salt, and security settings. Leave optional values unchanged unless you understand the deployment environment and the effect of changing them.

**Important:** Never commit `.env`. The repository's `.gitignore` excludes it. Do not paste private keys into issues, pull requests, chat messages, or screenshots.

## 5. Start the application

Start the server:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

For development, you can use Node's watch mode:

```bash
npm run dev
```

Stop the server with `Ctrl+C`.

## 6. Check the backend

With the server running, open:

```text
http://localhost:3000/api/health
```

The endpoint reports whether the server is running and whether the AI and Supabase configuration were detected. It does not prove that external credentials are valid or that every external service is reachable.

## 7. Run automated tests

From the repository root:

```bash
npm test
```

The project uses Node.js's built-in test runner. The tests cover selected backend account, lesson, and topic-guardrail behavior. They do not perform a full browser test or verify live Supabase/NRP credentials.

## Troubleshooting

- **The server says a module is missing:** Run `npm install` from the repository root.
- **Port 3000 is already in use:** Stop the other process or set a different `PORT` in `.env`, then use that port in the browser.
- **Supabase features do not work:** Check that the values in `.env` and `config.js` belong to the same Supabase project, and confirm that you ran `supabase-schema.sql`.
- **Rocky uses fallback responses:** Check that `NRP_API_KEY` is set correctly and that `NRP_BASE_URL` and `NRP_MODEL` match the service configuration.
- **Account deletion is unavailable:** Confirm that `SUPABASE_SERVICE_ROLE_KEY` is set in the server's `.env`. Never expose that key in browser code.
- **A change does not appear in the browser:** Refresh the page and check the browser developer console and network panel for failed requests.

## Production deployment

The production site is hosted separately at [https://safetyquestlearning.com](https://safetyquestlearning.com). Its server credentials are not included in this repository. Do not copy production secrets into a local commit or share them when requesting help.
