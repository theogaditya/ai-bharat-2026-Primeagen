/**
 * generate-report.ts — Reads bench/results/ JSON + CSV and generates
 * a beautiful self-contained HTML report with Chart.js charts,
 * ready to screenshot for PPT slides.
 *
 * Run: bun bench/generate-report.ts
 * Output: bench/results/report.html
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const RESULTS_DIR = join(import.meta.dir, "results");

// ── Load results ─────────────────────────────────────────────────────────────

function loadJSON<T>(filename: string): T | null {
  const p = join(RESULTS_DIR, filename);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf-8")) as T;
}

function loadCSV(filename: string): { elapsed: number[]; length: number[] } {
  const p = join(RESULTS_DIR, filename);
  if (!existsSync(p)) return { elapsed: [], length: [] };
  const lines = readFileSync(p, "utf-8").trim().split("\n").slice(1);
  const elapsed: number[] = [];
  const length: number[] = [];
  for (const line of lines) {
    const [e, l] = line.split(",");
    elapsed.push(Number(e) / 1000); // convert ms → s
    length.push(Number(l));
  }
  return { elapsed, length };
}

interface HealthResult {
  service: string;
  requests: { total: number; perSecond: number };
  latency: { p50: number; p90: number; p99: number; average: number; max: number };
  errors: number;
}

interface HealthReport {
  timestamp: string;
  results: HealthResult[];
}

interface IngestionReport {
  timestamp: string;
  config: { connections: number; duration: number; url: string };
  metrics: {
    totalRequests: number;
    requestsPerSecond: number;
    latency: { average: number; p50: number; p90: number; p99: number; max: number };
    errors: number;
    timeouts: number;
    successRate: number;
  };
}

const health = loadJSON<HealthReport>("01-health.json");
const ingestion = loadJSON<IngestionReport>("02-ingestion.json");
const drain = loadCSV("drain.csv");

// ── Compute summary cards ─────────────────────────────────────────────────────

const userBe = health?.results.find(r => r.service === "user-be");
const compQ  = health?.results.find(r => r.service === "compQueue");
const selfSvc = health?.results.find(r => r.service === "self");

const drainRate = drain.elapsed.length > 1
  ? ((drain.length[0]! - drain.length[drain.length - 1]!) / drain.elapsed[drain.elapsed.length - 1]!).toFixed(1)
  : null;

// ── Build chart data ──────────────────────────────────────────────────────────

const healthServices = health?.results.map(r => r.service) ?? [];
const healthReqSec   = health?.results.map(r => r.requests.perSecond) ?? [];
const healthP50      = health?.results.map(r => r.latency.p50) ?? [];
const healthP90      = health?.results.map(r => r.latency.p90) ?? [];
const healthP99      = health?.results.map(r => r.latency.p99) ?? [];

// ── Generate HTML ─────────────────────────────────────────────────────────────

const ts = health?.timestamp ?? ingestion?.timestamp ?? new Date().toISOString();
const runDate = new Date(ts).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SwarajDesk — Backend Benchmark Report</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"><\/script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #0d0f14;
    --surface:   #13151c;
    --card:      #1a1d28;
    --border:    #252838;
    --accent1:   #6c63ff;
    --accent2:   #00d2a8;
    --accent3:   #ff6b6b;
    --accent4:   #ffa94d;
    --text:      #e8eaf0;
    --muted:     #7c7f9e;
    --radius:    14px;
  }

  body {
    font-family: 'Inter', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    padding: 48px 32px;
  }

  header {
    text-align: center;
    margin-bottom: 56px;
  }

  .tag {
    display: inline-block;
    background: linear-gradient(135deg, var(--accent1), var(--accent2));
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 4px 14px;
    border-radius: 40px;
    margin-bottom: 16px;
  }

  h1 {
    font-size: clamp(28px, 4vw, 46px);
    font-weight: 800;
    background: linear-gradient(135deg, #fff 30%, var(--accent1));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.15;
    margin-bottom: 10px;
  }

  .subtitle {
    color: var(--muted);
    font-size: 14px;
    letter-spacing: 0.3px;
  }

  /* ── Section ─────────────────────────────────────────────── */
  section { margin-bottom: 56px; }

  .section-title {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--accent1);
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  /* ── KPI cards ───────────────────────────────────────────── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 18px;
  }

  .kpi {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px 22px;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s;
  }

  .kpi:hover { transform: translateY(-2px); }

  .kpi::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    border-radius: 4px 4px 0 0;
  }

  .kpi.c1::before { background: var(--accent1); }
  .kpi.c2::before { background: var(--accent2); }
  .kpi.c3::before { background: var(--accent3); }
  .kpi.c4::before { background: var(--accent4); }

  .kpi-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 10px;
  }

  .kpi-value {
    font-size: 34px;
    font-weight: 800;
    line-height: 1;
    margin-bottom: 4px;
  }

  .kpi.c1 .kpi-value { color: var(--accent1); }
  .kpi.c2 .kpi-value { color: var(--accent2); }
  .kpi.c3 .kpi-value { color: var(--accent3); }
  .kpi.c4 .kpi-value { color: var(--accent4); }

  .kpi-unit {
    font-size: 12px;
    color: var(--muted);
    font-weight: 500;
  }

  /* ── Chart cards ─────────────────────────────────────────── */
  .chart-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
    gap: 24px;
  }

  .chart-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 28px 24px;
  }

  .chart-card h3 {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 22px;
  }

  .chart-wrap {
    position: relative;
    height: 280px;
  }

  /* ── Latency table ───────────────────────────────────────── */
  .lat-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .lat-table th {
    text-align: left;
    padding: 10px 14px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--muted);
    border-bottom: 1px solid var(--border);
  }

  .lat-table td {
    padding: 13px 14px;
    border-bottom: 1px solid var(--border);
    font-variant-numeric: tabular-nums;
  }

  .lat-table tr:last-child td { border-bottom: none; }

  .badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
  }

  .badge.ok  { background: rgba(0,210,168,.15); color: var(--accent2); }
  .badge.warn { background: rgba(255,107,107,.15); color: var(--accent3); }

  /* ── Footer ──────────────────────────────────────────────── */
  footer {
    text-align: center;
    color: var(--muted);
    font-size: 12px;
    margin-top: 64px;
    padding-top: 24px;
    border-top: 1px solid var(--border);
  }
</style>
</head>
<body>

<header>
  <div class="tag">Backend Benchmark Report</div>
  <h1>SwarajDesk Performance</h1>
  <p class="subtitle">Run on ${runDate} &nbsp;·&nbsp; Bun runtime &nbsp;·&nbsp; NeonDB + Redis.io</p>
</header>

<!-- ── KPI Summary ────────────────────────────────────────────────── -->
<section>
  <div class="section-title">Key Metrics</div>
  <div class="kpi-grid">

    <div class="kpi c1">
      <div class="kpi-label">API Health Throughput</div>
      <div class="kpi-value">${userBe?.requests.perSecond?.toLocaleString() ?? "—"}</div>
      <div class="kpi-unit">req / sec &nbsp;(user-be)</div>
    </div>

    <div class="kpi c2">
      <div class="kpi-label">Complaint Ingestion</div>
      <div class="kpi-value">${ingestion?.metrics.requestsPerSecond?.toLocaleString() ?? "—"}</div>
      <div class="kpi-unit">req / sec</div>
    </div>

    <div class="kpi c4">
      <div class="kpi-label">p99 API Latency</div>
      <div class="kpi-value">${userBe?.latency.p99 ?? "—"}</div>
      <div class="kpi-unit">ms &nbsp;(user-be, 100 conns)</div>
    </div>

    <div class="kpi c3">
      <div class="kpi-label">Ingestion Success</div>
      <div class="kpi-value">${ingestion?.metrics.successRate ?? "—"}<span style="font-size:20px">%</span></div>
      <div class="kpi-unit">error rate: ${ingestion ? (100 - ingestion.metrics.successRate).toFixed(2) : "—"}%</div>
    </div>

    <div class="kpi c2">
      <div class="kpi-label">compQueue Throughput</div>
      <div class="kpi-value">${compQ?.requests.perSecond?.toLocaleString() ?? "—"}</div>
      <div class="kpi-unit">req / sec (health endpoint)</div>
    </div>

    ${drainRate ? `
    <div class="kpi c1">
      <div class="kpi-label">Queue Drain Speed</div>
      <div class="kpi-value">${drainRate}</div>
      <div class="kpi-unit">complaints / sec</div>
    </div>` : ""}

  </div>
</section>

<!-- ── Charts ─────────────────────────────────────────────────────── -->
<section>
  <div class="section-title">Throughput Comparison</div>
  <div class="chart-grid">

    <div class="chart-card">
      <h3>Requests per Second — All Services</h3>
      <div class="chart-wrap">
        <canvas id="reqSecChart"></canvas>
      </div>
    </div>

    <div class="chart-card">
      <h3>Latency Percentiles — Health Endpoints (ms)</h3>
      <div class="chart-wrap">
        <canvas id="latencyChart"></canvas>
      </div>
    </div>

    ${ingestion ? `
    <div class="chart-card">
      <h3>Ingestion Latency Breakdown (ms)</h3>
      <div class="chart-wrap">
        <canvas id="ingestionLatChart"></canvas>
      </div>
    </div>` : ""}

    ${drain.elapsed.length > 1 ? `
    <div class="chart-card">
      <h3>Queue Drain Over Time</h3>
      <div class="chart-wrap">
        <canvas id="drainChart"></canvas>
      </div>
    </div>` : ""}

  </div>
</section>

<!-- ── Raw latency table ──────────────────────────────────────────── -->
${health ? `
<section>
  <div class="section-title">Latency Detail Table</div>
  <div class="chart-card">
    <table class="lat-table">
      <thead>
        <tr>
          <th>Service</th>
          <th>p50 (ms)</th>
          <th>p90 (ms)</th>
          <th>p99 (ms)</th>
          <th>Max (ms)</th>
          <th>Req/sec</th>
          <th>Errors</th>
        </tr>
      </thead>
      <tbody>
        ${health.results.map(r => `
        <tr>
          <td><strong>${r.service}</strong></td>
          <td>${r.latency.p50}</td>
          <td>${r.latency.p90}</td>
          <td>${r.latency.p99}</td>
          <td>${r.latency.max}</td>
          <td>${r.requests.perSecond.toLocaleString()}</td>
          <td><span class="badge ${r.errors === 0 ? 'ok' : 'warn'}">${r.errors === 0 ? '0 ✓' : r.errors}</span></td>
        </tr>`).join("")}
        ${ingestion ? `
        <tr>
          <td><strong>user-be (POST /complaints)</strong></td>
          <td>${ingestion.metrics.latency.p50}</td>
          <td>${ingestion.metrics.latency.p90}</td>
          <td>${ingestion.metrics.latency.p99}</td>
          <td>${ingestion.metrics.latency.max}</td>
          <td>${ingestion.metrics.requestsPerSecond.toLocaleString()}</td>
          <td><span class="badge ${ingestion.metrics.errors === 0 ? 'ok' : 'warn'}">${ingestion.metrics.errors === 0 ? '0 ✓' : ingestion.metrics.errors}</span></td>
        </tr>` : ""}
      </tbody>
    </table>
  </div>
</section>` : ""}

<footer>
  Generated by SwarajDesk Bench Suite &nbsp;·&nbsp; Run at ${runDate}
</footer>

<script>
const ACCENT1 = '#6c63ff';
const ACCENT2 = '#00d2a8';
const ACCENT3 = '#ff6b6b';
const ACCENT4 = '#ffa94d';

Chart.defaults.color = '#7c7f9e';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 12;

const gridColor = 'rgba(37,40,56,0.8)';

// ─── Req/sec bar chart ──────────────────────────────────────────────────────
{
  const services = ${JSON.stringify(healthServices)};
  const values   = ${JSON.stringify(healthReqSec)};
  const allServices = [...services];
  const allValues   = [...values];
  ${ingestion ? `allServices.push('user-be (POST)'); allValues.push(${ingestion.metrics.requestsPerSecond});` : ""}

  const colors = [ACCENT1, ACCENT2, ACCENT4, ACCENT3];

  new Chart(document.getElementById('reqSecChart'), {
    type: 'bar',
    data: {
      labels: allServices,
      datasets: [{
        label: 'Requests / sec',
        data: allValues,
        backgroundColor: allServices.map((_, i) => colors[i % colors.length] + 'cc'),
        borderColor: allServices.map((_, i) => colors[i % colors.length]),
        borderWidth: 2,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: gridColor },
          ticks: { callback: v => v.toLocaleString() }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

// ─── Latency percentile chart (grouped bars) ────────────────────────────────
{
  const labels = ${JSON.stringify(healthServices)};
  new Chart(document.getElementById('latencyChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'p50', data: ${JSON.stringify(healthP50)}, backgroundColor: ACCENT2 + '99', borderColor: ACCENT2, borderWidth: 2, borderRadius: 4 },
        { label: 'p90', data: ${JSON.stringify(healthP90)}, backgroundColor: ACCENT4 + '99', borderColor: ACCENT4, borderWidth: 2, borderRadius: 4 },
        { label: 'p99', data: ${JSON.stringify(healthP99)}, backgroundColor: ACCENT3 + '99', borderColor: ACCENT3, borderWidth: 2, borderRadius: 4 },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8 } } },
      scales: {
        y: { beginAtZero: true, grid: { color: gridColor }, ticks: { callback: v => v + ' ms' } },
        x: { grid: { display: false } }
      }
    }
  });
}

// ─── Ingestion latency chart ────────────────────────────────────────────────
${ingestion ? `{
  const m = ${JSON.stringify(ingestion.metrics.latency)};
  new Chart(document.getElementById('ingestionLatChart'), {
    type: 'bar',
    data: {
      labels: ['p50', 'p90', 'p99', 'Max', 'Avg'],
      datasets: [{
        label: 'Latency (ms)',
        data: [m.p50, m.p90, m.p99, m.max, m.average],
        backgroundColor: [ACCENT2+'bb', ACCENT4+'bb', ACCENT3+'bb', ACCENT1+'bb', ACCENT2+'66'],
        borderColor:     [ACCENT2,      ACCENT4,      ACCENT3,      ACCENT1,      ACCENT2],
        borderWidth: 2,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: gridColor }, ticks: { callback: v => v + ' ms' } },
        x: { grid: { display: false } }
      }
    }
  });
}` : ""}

// ─── Queue drain line chart ─────────────────────────────────────────────────
${drain.elapsed.length > 1 ? `{
  new Chart(document.getElementById('drainChart'), {
    type: 'line',
    data: {
      labels: ${JSON.stringify(drain.elapsed.map(s => s.toFixed(1) + 's'))},
      datasets: [{
        label: 'Queue length',
        data: ${JSON.stringify(drain.length)},
        borderColor: ACCENT1,
        backgroundColor: ACCENT1 + '22',
        borderWidth: 2.5,
        pointRadius: 0,
        fill: true,
        tension: 0.4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: gridColor } },
        x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } }
      }
    }
  });
}` : ""}

<\/script>
</body>
</html>`;

const outPath = join(RESULTS_DIR, "report.html");
writeFileSync(outPath, html);
console.log(`\n✅  Report generated → ${outPath}`);
console.log(`   Open in your browser and screenshot each chart for PPT slides.\n`);
