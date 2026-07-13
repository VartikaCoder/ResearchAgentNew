# web

Next.js 15 frontend for Research Agent.

## Setup

```bash
cd apps/web
pnpm install
```

Optional env (`apps/web/.env.local`):

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Run

Start the API first (`apps/api` on port 3001), then:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The UI connects with native `EventSource` to `GET /research?goal=...` and streams agent progress into the live panel.
