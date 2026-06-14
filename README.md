# EcoTrack

**Live demo:** https://client-ecotrack2.vercel.app

A public economic indicators dashboard. Search any country and explore GDP, Inflation, Unemployment, Interest Rate, and Population as interactive charts — powered by the World Bank Open Data API.

## Features

- 200+ countries via searchable dropdown
- 5 economic indicators as line charts (Recharts)
- Time range filter: 5Y / 10Y / 20Y / All
- MongoDB caching (24h TTL) — fast repeat loads
- Responsive layout (mobile → desktop)
- Cold-start banner with auto-dismiss when server wakes

## Tech stack

| Layer    | Choice                          |
|----------|---------------------------------|
| Frontend | React 18 + Vite + Tailwind CSS  |
| Charts   | Recharts                        |
| Backend  | Node.js + Express               |
| Database | MongoDB Atlas (free tier)       |
| Deploy   | Vercel (client) + Render (server)|
| Data     | World Bank Open Data API v2     |

## Local setup

**Prerequisites:** Node 20+, npm 10+, a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

```bash
# 1. Clone
git clone https://github.com/<your-username>/ecotrack.git
cd ecotrack

# 2. Install root dependencies
npm install

# 3. Configure server env
cp server/.env.example server/.env
# Edit server/.env — set MONGODB_URI to your Atlas connection string

# 4. Configure client env
cp client/.env.example client/.env
# Default VITE_API_URL=http://localhost:5000 works for local dev

# 5. Install sub-dependencies
npm install --prefix server
npm install --prefix client

# 6. Start both servers
npm run dev
# → Client: http://localhost:5173
# → Server: http://localhost:5000
```

## Running tests

```bash
cd server && npm test
```

## Deployment

| Service | Config |
|---------|--------|
| **Render** (server) | Root dir: `server/` · Build: `npm install` · Start: `npm start` · Env: `MONGODB_URI`, `PORT`, `CLIENT_URL` |
| **Vercel** (client) | Root dir: `client/` · Build: `npm run build` · Output: `dist/` · Env: `VITE_API_URL` |

## Data source

[World Bank Open Data](https://data.worldbank.org/) — free, no API key required.
