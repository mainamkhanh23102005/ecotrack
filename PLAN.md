# Implementation Plan: EcoTrack

Reference spec: SPEC.md
Timeline: 1–2 weeks, solo developer

---

## Phases at a Glance

```
Phase 1: Scaffolding      ── repo, env, tooling, empty client + server
Phase 2: Backend Core     ── Express + MongoDB + World Bank integration
Phase 3: Frontend Core    ── React layout, country search, charts, cards
Phase 4: Polish & Deploy  ── responsive design, comparison mode, cold-start UX, deploy
```

Phases 1–2 must complete before Phase 3 starts (frontend depends on the API).
Within each phase, tasks are ordered by dependency.

---

## Phase 1: Scaffolding

### Task 1.1 — Repo & root workspace setup
- Create `client/` (Vite + React) and `server/` (Node/Express) directories
- Add root `package.json` with `dev` script using `concurrently`
- Add `.gitignore` covering `node_modules`, `.env`, `dist`, `build`
- **Verify:** `npm run dev` from root starts both without errors (placeholder responses ok)

### Task 1.2 — Server skeleton
- `server/server.js`: Express app, CORS, JSON body parser, port from `process.env.PORT || 5000`
- `server/.env.example`: `MONGODB_URI=`, `PORT=5000`, `CLIENT_URL=http://localhost:5173`
- `server/middleware/errorHandler.js`: catches errors, returns `{ error: message }` + correct status
- `GET /health` endpoint returning `{ status: "ok", uptime: process.uptime() }`
- **Verify:** `curl http://localhost:5000/health` returns `{ status: "ok" }`

### Task 1.3 — Client skeleton
- Vite config: proxy `/api` → `http://localhost:5000` in dev
- Tailwind CSS wired up (`tailwind.config.js`, `index.css` with directives)
- `client/.env.example`: `VITE_API_URL=http://localhost:5000`
- `App.jsx`: single `<h1>EcoTrack</h1>` placeholder
- **Verify:** `npm run dev` (client) renders the heading, no console errors

### Task 1.4 — MongoDB connection
- Install `mongoose`
- `server/db.js`: connect using `MONGODB_URI`, log success/failure
- Import and call in `server.js` before starting the HTTP server
- **Verify:** Server logs "MongoDB connected" on startup

---

## Phase 2: Backend Core

### Task 2.1 — IndicatorCache model
- `server/models/IndicatorCache.js` per the schema in SPEC.md
- Unique compound index on `{ countryCode, dataType }`
- MongoDB TTL index on `expiresAt` (auto-deletes expired docs)
- **Verify:** Can save and retrieve a test document in Mongoose shell / test

### Task 2.2 — World Bank service
- `server/services/worldbank.js` exports:
  - `fetchCountries()` — fetches all countries, filters to `region.id !== "NA"` (removes aggregates), returns `[{ name, code, capitalCity, region }]`
  - `fetchIndicator(countryCode, indicatorCode)` — fetches up to 60 years of data, returns `[{ year, value }]` sorted ascending, nulls removed
  - `fetchInterestRate(countryCode)` — tries `FR.INR.RINR` first; if fewer than 5 data points, falls back to `FR.INR.LNDP`; returns `{ data, label }` where label is "Real" or "Lending"
- All functions throw a typed error with `statusCode` if World Bank returns non-200 or empty
- **Verify:** Unit tests for URL construction, null filtering, interest-rate fallback logic

### Task 2.3 — Countries route
- `server/routes/countries.js`: `GET /api/countries`
- Check MongoDB cache first (dataType: "countries") — if found and not expired, return it
- Otherwise call `worldbank.fetchCountries()`, store in cache (TTL: 7 days), return result
- **Verify:** First call hits World Bank; second call (within 7 days) returns from cache (check logs)

### Task 2.4 — Indicators route
- `server/routes/indicators.js`: `GET /api/indicators/:countryCode`
- Validate `countryCode`: must match `/^[A-Z]{2,3}$/` — 400 if invalid
- Check MongoDB cache (dataType: "indicators", TTL: 24h)
- On cache miss: call all 5 fetch functions in parallel (`Promise.all`), assemble response shape:
  ```json
  {
    "gdp":          { "data": [...], "label": "GDP" },
    "inflation":    { "data": [...], "label": "Inflation Rate" },
    "unemployment": { "data": [...], "label": "Unemployment Rate" },
    "interestRate": { "data": [...], "label": "Interest Rate (Real|Lending)" },
    "population":   { "data": [...], "label": "Population" }
  }
  ```
- Individual indicator failures return `{ data: [], label: "...", error: "No data" }` — never crash the whole request
- **Verify:** `GET /api/indicators/VN` returns correct shape; `GET /api/indicators/BADCODE` returns 400

### Task 2.5 — Backend tests
- `server/__tests__/worldbank.test.js`: mock `axios`, test URL construction, null filtering, fallback logic
- `server/__tests__/indicators.test.js`: mock worldbank service, test cache hit vs miss, 400 on bad code
- `server/__tests__/countries.test.js`: test cache behavior
- **Verify:** `npm test` passes, no skipped tests

---

## Phase 3: Frontend Core

### Task 3.1 — API service layer
- `client/src/services/api.js`: axios instance with `baseURL` from `VITE_API_URL`
- Exports: `getCountries()`, `getIndicators(countryCode)`
- **Verify:** Can call from browser console and see data

### Task 3.2 — `useIndicators` hook
- `client/src/hooks/useIndicators.js`
- Args: `(countryCode, years)` where years is `5 | 10 | 20 | null` (null = all)
- State: `{ data, loading, error }`
- Fetches on `countryCode` change; filters `data` by year range client-side
- Returns filtered data arrays for all 5 indicators plus the `interestRate.label`
- **Verify:** Hook returns Vietnam data on mount; changing `years` re-filters without re-fetching

### Task 3.3 — App layout + CountrySearch
- `App.jsx`: top bar with app name, `CountrySearch`, `TimeRangeSelector`; below that `SummaryCards`; below that `ChartsGrid`
- `CountrySearch.jsx`: fetches country list on mount, renders a searchable `<select>` or combobox; defaults to `VN`
- `TimeRangeSelector.jsx`: four buttons `5Y | 10Y | 20Y | All`; active state highlighted
- **Verify:** Dropdown shows 200+ countries; selecting one triggers data re-fetch

### Task 3.4 — SummaryCards
- `SummaryCards.jsx`: receives the 5 latest values; renders one card per indicator
- Each card: indicator name, formatted latest value + unit, year of that value
- GDP/Population use the auto-scale formatter (`$1.2T`, `1.4B`)
- Show a placeholder skeleton card while loading
- **Verify:** Cards show correct latest values for Vietnam (cross-check against World Bank website)

### Task 3.5 — IndicatorChart + ChartsGrid
- `IndicatorChart.jsx`: Recharts `LineChart` in a `ResponsiveContainer`; title, Y-axis with auto-scale tick formatter, `Tooltip` with formatted value
- GDP Y-axis formatter: `$1.2T` / `$450B` / `$3.8M`; Population: `1.4B` / `50M`; others: `1.2%` or raw
- `ChartsGrid.jsx`: 2-column CSS grid on desktop, 1-column on mobile; renders 5 `IndicatorChart` instances
- Show a loading skeleton (pulsing gray rectangle) per chart while data loads
- **Verify:** All 5 charts render for Vietnam; switching to 10Y view trims the data correctly

### Task 3.6 — Cold-start banner
- `WakeUpBanner.jsx`: shown when `GET /health` fails or times out on first load
- Polls `/health` every 3 seconds, dismisses automatically when server responds
- Shows spinner + "Server is waking up, please wait…" text
- **Verify:** With server stopped, banner appears; when server starts, banner dismisses

---

## Phase 4: Polish & Deploy

### Task 4.1 — Responsive design pass
- Verify layout at 375px (iPhone SE), 768px (tablet), 1280px (desktop)
- Top bar: stack vertically on mobile
- Charts: 1-col on mobile, 2-col on ≥768px
- Cards: 2-col on mobile, 5-col on desktop
- **Verify:** Chrome DevTools responsive mode, no horizontal overflow at 375px

### Task 4.2 — Country comparison toggle (nice-to-have)
- Add "Compare with…" button next to `CountrySearch`
- When activated: second `CountrySearch` appears; `useIndicators` called for both countries
- `IndicatorChart` accepts optional `compareData` prop; renders second dashed line in amber
- Legend shows both country names
- **Verify:** Overlay two countries on all 5 charts simultaneously

### Task 4.3 — Deploy
- **Server (Render):**
  - New Web Service from `server/` directory
  - Build command: `npm install`; Start command: `npm start`
  - Set env vars: `MONGODB_URI`, `PORT`, `CLIENT_URL` (Vercel URL)
- **Client (Vercel):**
  - Root directory: `client/`
  - Build: `npm run build`; Output: `dist/`
  - Set env var: `VITE_API_URL` (Render URL)
- **Verify:** Live URL loads Vietnam data end-to-end with no console errors

### Task 4.4 — README
- Setup instructions: prerequisites, clone, env file setup, `npm run dev`
- Live demo link (Vercel URL)
- Screenshot or GIF of the dashboard
- World Bank API attribution
- **Verify:** A fresh clone following the README reaches a working local app

---

## Risk Log

| Risk | Mitigation |
|---|---|
| World Bank API rate limits or downtime | MongoDB cache absorbs repeat traffic; show graceful error if API is down |
| Interest Rate data gaps (many countries have none) | Dual-indicator fallback + "No data" graceful empty state |
| Render cold start (~30s) | Wake-up banner with polling (Task 3.6) |
| MongoDB Atlas free tier 512MB limit | 24h TTL auto-expiry keeps collection small |
| Recharts bundle size | Recharts is tree-shakeable; import only used chart types |

---

## Dependency Order

```
1.1 → 1.2 → 1.4 → 2.1 → 2.2 → 2.3
                              ↘       ↘
                               2.4 → 2.5
                                       ↓
              1.3 → 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6
                                                       ↓
                                          4.1 → 4.2 → 4.3 → 4.4
```

Phases 1 and 3 scaffolding (1.1, 1.2, 1.3) can be done in one sitting.
Phase 2 backend (2.1–2.5) must fully complete before Phase 3 hooks/components.
