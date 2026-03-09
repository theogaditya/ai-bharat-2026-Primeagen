# SwarajDesk — Backend Benchmark Suite

Measures request latency, throughput, and queue processing capacity for the `user-be`, `compQueue`, and `self` backend services.

---

## Prerequisites

### 1. Configure the bench environment

```bash
cp bench/.env.example bench/.env
```

Edit `bench/.env` and fill in:

| Variable | What it is |
|---|---|
| `BENCH_USER_EMAIL` | Email of a real user in your local Postgres DB |
| `BENCH_USER_PASSWORD` | Their password |
| `BENCH_CATEGORY_ID` | A valid UUID from the `Category` table |
| `BENCH_SUB_CATEGORY` | Any valid sub-category string (e.g. `Pothole`) |

> **Finding a category ID:**
> ```bash
> psql $DATABASE_URL -c 'SELECT id, name FROM "Category" LIMIT 5;'
> ```

---

### 2. Install bench dependencies

```bash
cd bench && bun install
```

---

### 3. Start the full backend stack

All services must be running **before** you start benchmarking. Open separate terminals for each:

> **Infrastructure note:** PostgreSQL (NeonDB) and Redis (Redis.io) are cloud-hosted — **no local setup needed**. The services connect via the `DATABASE_URL` and `REDIS_URL` in each package's `.env`.

**Services:**
```bash
# Terminal 1 — user-be (port 3000)
cd packages/user-be && bun run dev

# Terminal 2 — compQueue (port 3005)
cd packages/compQueue && bun run dev

# Terminal 3 — self (port 3030)
cd packages/self && bun run dev
```

**Verify everything is up:**
```bash
curl http://localhost:3000/api/health
curl http://localhost:3005/health
curl http://localhost:3030/health
```

All three should return `200 OK`.

---

## Running the Benchmarks

### Option A — Full suite (recommended)

```bash
bash bench/run-all.sh
```

This runs all three stages automatically and prints a final summary table.

---

### Option B — Individual scripts

Run each script independently for more control.

#### Stage 1 — Health endpoint benchmark
Tests all three service health endpoints (100 connections × 20s):
```bash
bun bench/01-health.bench.ts
```

#### Stage 2 — Complaint ingestion benchmark
Tests `POST /api/complaints` with auth (200 connections × 30s):
```bash
bun bench/02-ingestion.bench.ts
```

#### Stage 3 — Queue drain monitor
Run **at the same time** as stage 2 (in a separate terminal):
```bash
bun bench/03-queue-drain.ts
```

#### Seed only — Pre-fill the queue
Push 1000 complaints into Redis without running the full bench:
```bash
bun bench/seed-queue.ts
```
Then run `03-queue-drain.ts` alone to measure pure processing speed.

---

## Results

All results are saved to `bench/results/`:

| File | Contents |
|---|---|
| `01-health.json` | Health bench — latency/throughput per service |
| `02-ingestion.json` | Ingestion bench — req/sec, p50/p90/p99, error rate |
| `drain.csv` | Queue drain timeseries — `elapsed_ms, queue_length` |

---

## Key Metrics Produced

| Metric | Source |
|---|---|
| API req/sec | `01-health.json` → `requests.perSecond` |
| p99 latency | `01-health.json` → `latency.p99` |
| Ingestion rate | `02-ingestion.json` → `requestsPerSecond` |
| Queue drain speed | `drain.csv` — start length ÷ drain time |
