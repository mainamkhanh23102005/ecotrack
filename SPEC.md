# Spec: EcoTrack — Economic Indicators Dashboard

## Objective

EcoTrack is a public, no-login web dashboard that lets anyone explore and compare
economic indicators across countries over time. Think "mini Trading Economics."

**Users:** General public, students, economics enthusiasts.

**Core value:** Type a country name → instantly see GDP, Inflation, Unemployment,
Interest Rate, and Population as interactive charts with historical data.

**Success looks like:** A user lands on the page, sees Vietnam's data by default,
searches for "Brazil", switches to a 20-year view, and reads the charts — all
without signing in or hitting a loading spinner more than once.

---

## Tech Stack

| Layer      | Choice                          | Version   |
|------------|---------------------------------|-----------|
| Frontend   | React (Vite)                    | React 18  |
| Charts     | Recharts                        | ^2.x      |
| Styling    | Tailwind CSS                    | ^3.x      |
| Backend    | Node.js + Express               | Node 20   |
| Database   | MongoDB Atlas (free tier)       | Mongoose 7|
| Deployment | Vercel (client) + Render (server) + MongoDB Atlas | — |
| Data source| World Bank Open Data API        | v2, free  |

---

## Commands

```bash
# Root (run from project root)
npm run dev           # starts both client and server concurrently
npm run build         # builds client for production

# Client (from client/)
npm run dev           # Vite dev server on http://localhost:5173
npm run build         # production build → client/dist/
npm run preview       # preview production build locally
npm run lint          # ESLint

# Server (from server/)
npm run dev           # nodemon server.js on http://localhost:5000
npm start             # node server.js (production)
npm test              # Jest test suite
```

---

## Project Structure

```
ecotrack/
├── client/                    # React frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CountrySearch.jsx      # searchable dropdown, 200+ countries
│   │   │   ├── TimeRangeSelector.jsx  # 5 / 10 / 20 / All years
│   │   │   ├── SummaryCards.jsx       # 5 latest-value cards
│   │   │   ├── IndicatorChart.jsx     # single Recharts line chart
│   │   │   └── ChartsGrid.jsx         # 2-col responsive grid of 5 charts
│   │   ├── hooks/
│   │   │   └── useIndicators.js       # fetches + formats data from backend
│   │   ├── services/
│   │   │   └── api.js                 # axios calls to Express backend
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css                  # Tailwind base
│   ├── .env                           # VITE_API_URL=http://localhost:5000
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                    # Express backend
│   ├── models/
│   │   └── IndicatorCache.js          # Mongoose schema for cached responses
│   ├── routes/
│   │   ├── countries.js               # GET /api/countries
│   │   └── indicators.js              # GET /api/indicators/:code
│   ├── services/
│   │   └── worldbank.js               # fetches from World Bank API
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── server.js                      # Express entry point
│   ├── .env                           # MONGODB_URI, PORT, CLIENT_URL
│   └── package.json
│
├── SPEC.md
├── README.md
└── .gitignore
```

---

## World Bank API Reference

Base URL: `https://api.worldbank.org/v2/`

**Country list:**
```
GET /country?format=json&per_page=300
```

**Indicator data:**
```
GET /country/{code}/indicator/{indicatorCode}?format=json&per_page=60&mrv=60
```

| Indicator       | Code              | Unit                       |
|-----------------|-------------------|----------------------------|
| GDP             | NY.GDP.MKTP.CD    | current USD                |
| Inflation       | FP.CPI.TOTL.ZG    | annual %                   |
| Unemployment    | SL.UEM.TOTL.ZS    | % of labor force           |
| Interest Rate   | FR.INR.RINR       | real %                     |
| Population      | SP.POP.TOTL       | total persons              |

Default country on load: **Vietnam (code: VN)**

---

## API Endpoints (Express)

```
GET /api/countries
  → [ { name, code, capitalCity, region }, ... ]
  → cached in MongoDB for 7 days (rarely changes)

GET /api/indicators/:countryCode
  → { gdp: [...], inflation: [...], unemployment: [...],
      interestRate: [...], population: [...] }
  → each array: [ { year: 2023, value: 123456789 }, ... ]
  → cached in MongoDB for 24 hours per country

GET /health
  → { status: "ok", uptime }
```

---

## MongoDB Schema

```js
// models/IndicatorCache.js
{
  countryCode: { type: String, required: true },   // "VN"
  dataType:    { type: String, required: true },   // "indicators" | "countries"
  data:        { type: Object, required: true },   // raw parsed response
  cachedAt:    { type: Date, default: Date.now },
  expiresAt:   { type: Date, required: true }      // cachedAt + TTL
}
// Index: { countryCode, dataType } unique
// TTL index on expiresAt for automatic document expiry
```

---

## Code Style

**React — functional components + hooks only:**

```jsx
// components/IndicatorChart.jsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function IndicatorChart({ title, data, unit, color = '#3b82f6' }) {
  if (!data?.length) return <div className="chart-skeleton" />;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-600 mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [`${v} ${unit}`, title]} />
          <Line type="monotone" dataKey="value" stroke={color} dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Conventions:**
- PascalCase for components, camelCase for hooks/services/utils
- One component per file, file name matches component name
- `useIndicators(countryCode, years)` hook owns all data-fetching logic
- All API base URL references go through `services/api.js` — never hardcode URLs in components
- Environment variables: `VITE_` prefix for client, bare names for server
- Async/await everywhere, no raw `.then()` chains
- Tailwind utility classes only — no custom CSS except `index.css` base layer

**Express:**
```js
// Clean route handler shape
router.get('/:countryCode', async (req, res, next) => {
  try {
    const data = await getIndicators(req.params.countryCode);
    res.json(data);
  } catch (err) {
    next(err);
  }
});
```

---

## Testing Strategy

**Scope for MVP:** Backend unit tests only. Frontend testing is deferred — Recharts
and DOM interactions add setup cost that isn't worth it for a 1-week solo build.

```
Framework:   Jest (server/)
Location:    server/__tests__/
Coverage:    Routes and worldbank.js service
Run:         npm test (from server/)
```

**What to test:**
- `worldbank.js` — correct URL construction, response parsing, null/missing values
- `GET /api/indicators/:code` — returns cached data, fetches fresh when cache is stale
- `GET /api/countries` — returns array with expected shape
- Error cases: invalid country code → 404, World Bank API down → 503

**What NOT to test in MVP:**
- React components (deferred)
- MongoDB connection itself (use `mongodb-memory-server` only if time allows)

---

## Boundaries

**Always do:**
- Run `npm run lint` before committing
- Use environment variables for MongoDB URI, ports, and API base URLs
- Return proper HTTP status codes (200, 404, 503) from Express
- Validate `countryCode` param is 2–3 uppercase letters before hitting World Bank
- Show a loading state on the frontend while data fetches
- Cache every World Bank response in MongoDB — never hit the API twice for the same data within 24 hours

**Ask first:**
- Adding a new npm dependency (keep bundle small)
- Changing the MongoDB schema after initial setup
- Adding a new API endpoint not listed in this spec
- Enabling any paid tier on Vercel, Render, or MongoDB Atlas

**Never do:**
- Commit `.env` files (add to `.gitignore` before first commit)
- Store user data or PII of any kind
- Make World Bank API calls directly from the React frontend (always go through the Express backend)
- Use class components in React
- Hard-code country codes, indicator codes, or API URLs outside of a single config/constants file

---

## Success Criteria

The MVP is done when all of the following are true:

- [ ] Default load shows Vietnam's 5 indicators without any user interaction
- [ ] Summary cards display the most recent non-null value for each indicator
- [ ] All 5 line charts render with correct labels and units
- [ ] Country search dropdown works for 200+ countries (type to filter)
- [ ] Time range selector (5 / 10 / 20 / All) correctly filters chart data
- [ ] Switching countries updates all charts and cards
- [ ] MongoDB caches responses; a second request for the same country within 24h does not call World Bank API
- [ ] Backend returns a clear error if a country has no data for an indicator
- [ ] Page is usable on a 375px-wide mobile screen
- [ ] Cold load (no cache) completes in < 5 seconds on a standard connection
- [ ] Cached load (MongoDB hit) completes in < 1 second
- [ ] App is deployed and publicly accessible (Vercel URL + Render URL)
- [ ] README has setup instructions and live demo link

---

## Resolved Decisions

1. **Interest Rate fallback:** Use `FR.INR.RINR` (real interest rate) first; if the
   country has no data for that code, fall back to `FR.INR.LNDP` (lending rate).
   Label the chart accordingly ("Interest Rate (Real)" vs "Interest Rate (Lending)").

2. **GDP Y-axis:** Auto-scale to billions/trillions with a unit label. Format:
   `$1.2T`, `$450B`, `$3.8M`. Apply the same scaling logic to Population
   (e.g. `1.4B`, `50M`).

3. **Country comparison:** Toggle on the same page. A "Compare with…" button appears
   next to the country search; selecting a second country overlays a second line
   (dashed, different color) on each chart. One toggle, no routing change.

4. **Render cold start:** Show a persistent banner: *"Server is waking up, please
   wait…"* with a spinner. Poll `/health` every 3 seconds; dismiss the banner when
   it responds. Do not silently ping — make the wait visible to the user.
