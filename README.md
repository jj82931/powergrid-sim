# LV Mini Twin

Mini digital twin for low voltage feeders. Computes transformer loading, voltage limit violations, and PV hosting capacity across synthetic LV networks. Frontend is React TypeScript. Backend is FastAPI with pandapower. Deployed with Vercel and Render. No paid APIs and offline friendly first.

> Live demo
> Frontend Vercel: `https://powergrid-sim.vercel.app/`

## Highlights

* 12 synthetic LV feeders with 30 nodes each
* KPIs per run: transformer loading, min bus voltage, violation flag
* PV sweep curve and hosting capacity estimate
* Feeder compare tab
* SVG line view and simple map view
* Rule based guidance text
* CSV export and print friendly PDF summary option
* 5 minute in-memory cache and metrics endpoint with p95
* Zero LLM calls by design

## Why this project

Many distribution studies start with basic questions: where are the voltage problems and how much PV can we host. This project shows a small but complete path from network data to user facing answers in ten days. It is intentionally simple, fast to run, and easy to review.

## Tech stack

* Backend: Python 3.11, FastAPI, pandapower, Pydantic, Uvicorn
* Frontend: React, TypeScript, Vite, Testing Library, Vitest
* DevOps: Docker, GitHub Actions CI, Vercel FE, Render BE
* Data: CSV first for load and PV profiles, JSON networks
* Non-functional: average p95 <= 1 s on a 30-node feeder, cache TTL 300 s, unit tests >= 6, integration tests >= 3

---

## Repository structure

```
repo/
  backend/
    app/
      __init__.py
      main.py
      sim.py
      rules.py
      data.py
      cache.py
      metrics.py
      models/
        __init__.py
        network_gen.py
    tests/
      test_api_schema.py
      test_sim_kpi.py
      test_rules.py
      test_profiles.py
      test_network_gen.py
      test_metrics.py
    Dockerfile
    pytest.ini
  frontend/
    src/
      App.tsx
      components/
        CompareTab.tsx
        SweepChart.tsx
        SvgLineView.tsx
        MapView.tsx
        ResultsCard.tsx
      services/api.ts
    vite.config.ts
    tsconfig.json
    tsconfig.app.json
    package.json
    Dockerfile
  data/
    networks/            # 12 synthetic feeders JSON
    profiles/
      load_profile.csv
      pv_profile.csv
  scripts/
    warmup.py            # optional warmup
  .github/workflows/
    ci.yml
```

---

## Quick start

### Prerequisites

* Python 3.11
* Node 20 and npm
* Git

### 1. Backend

```bash
cd backend
python -m venv .venv
. .venv/bin/activate            # PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt

# optional: generate networks if data is empty
python -m app.models.network_gen

# run API
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Open `http://127.0.0.1:8000/feeders`.

If your shell cannot import `app`, run tests or server with `PYTHONPATH=.`

```bash
# Linux macOS
PYTHONPATH=. pytest -q
# Windows PowerShell
$env:PYTHONPATH="."; pytest -q
```

### 2. Frontend

```bash
cd frontend
npm ci
echo "VITE_API_URL=http://127.0.0.1:8000" > .env.local
npm run dev
```

Open `http://127.0.0.1:5173` and try Run, Compare, and PV Sweep.

---

## Docker

### Backend

```bash
# run from repo root
docker build -t lv-backend -f backend/Dockerfile .
docker run --rm -p 8000:8000 lv-backend
```

### Frontend

```bash
docker build -t lv-frontend -f frontend/Dockerfile --build-arg VITE_API_URL=http://127.0.0.1:8000 .
docker run --rm -p 3000:80 lv-frontend
```

Optional docker compose:

```yaml
services:
  backend:
    build: { context: ., dockerfile: backend/Dockerfile }
    ports: [ "8000:8000" ]
  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
      args: { VITE_API_URL: "http://backend:8000" }
    ports: [ "3000:80" ]
    depends_on: [ backend ]
```

---

## API

Base URL is `VITE_API_URL`.

### GET /feeders

```json
{ "feeders": ["feeder_00","feeder_01", "..."] }
```

### POST /simulate

Request

```json
{
  "feeder_id": "feeder_00",
  "pv_adoption": 0.3,
  "battery_adoption": 0.0,
  "hour": 12
}
```

Response

```json
{
  "feeder_id": "feeder_00",
  "hour": 12,
  "transformer_loading": 0.21,
  "min_voltage_pu": 0.987,
  "voltage_violation": 0,
  "advice": "OK"
}
```

### POST /sweep

```json
{ "feeder_id": "feeder_00", "hours": [4, 28, 74] }
```

Response contains `points` for pv in 0.0..1.0 and `hosting_capacity`.

### GET /net/{feeder\_id}

Returns the synthetic network JSON used by the views.

### GET /metrics

Returns recent request latency stats and cache counters.

---

## Data model

* 12 feeders, each 30 nodes, saved as JSON under `data/networks`
* Load and PV profiles in 15 minute steps under `data/profiles`
* Voltage limits: low 0.94 p.u., high 1.06 p.u.
* Transformer rating: 500 kVA
* Hosting capacity: maximum PV adoption before the first violation across selected hours

---

## Performance

* Target p95 <= 1 s on a 30 node feeder
* Fast path: bfsw algorithm, voltage angles disabled
* Cache: 300 s TTL on identical requests
* Profiles loaded with lru\_cache
* `/metrics` exposes avg, p50, p95, cache hits and misses

---

## Testing

Backend

```bash
cd backend
pytest -q
```

Frontend

```bash
cd frontend
npm test --silent -- --watch=false
```

CI runs both on each push.

---

## Deployment

### Backend on Render

* Build and Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
* Auto deploy on push
* Add CORS for Vercel domains in `main.py`
  Example:

  ```py
  allow_origins=["https://<your-vercel>.vercel.app"]
  ```

  You can also allow preview builds with `allow_origin_regex=r"https://.*\.vercel\.app$"`

### Frontend on Vercel

* Root Directory: `frontend`
* Build Command: `npm run build`
* Output Directory: `dist`
* Environment variable
  Key `VITE_API_URL` Value `https://powergrid-sim.onrender.com`
  Set for Production and Preview as needed

---

## Roadmap

* Optional Postgres storage for scenarios
* Better feeder outlier generation cases
* UI polish and richer CSV PDF exports
* More detailed violation diagnostics

## Limitations

* Synthetic networks only
* Simple load allocation and no reverse power flow modeling
* Battery adoption not used in the base KPI logic yet

## License

MIT or company default. Update this section if you need a different license.

## Credits

Built by Lucas Im for a time boxed portfolio project. No external paid services and no LLM calls.
