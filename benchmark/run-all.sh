#!/usr/bin/env bash
# run-all.sh — Run the full SwarajDesk backend benchmark suite
#
# Usage: bash bench/run-all.sh
#
# Prerequisites:
#   1. All services running (user-be :3000, compQueue :3005, self :3030)
#   2. bench/.env configured (copy from bench/.env.example)
#   3. Dependencies installed: cd bench && bun install

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="$SCRIPT_DIR/results"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║        SwarajDesk — Full Benchmark Suite             ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${RESET}"
echo ""

# ── Sanity check: .env exists ──────────────────────────────────────────────
if [ ! -f "$SCRIPT_DIR/.env" ]; then
  echo -e "${RED}✗  bench/.env not found.${RESET}"
  echo "   Copy bench/.env.example → bench/.env and fill in your credentials."
  exit 1
fi

# ── Sanity check: bun available ───────────────────────────────────────────
if ! command -v bun &>/dev/null; then
  echo -e "${RED}✗  bun not found. Install from https://bun.sh${RESET}"
  exit 1
fi

# ── Initialization ────────────────────────────────────────────────────────────

RESULTS_DIR="$SCRIPT_DIR/results"
ARCHIVE_DIR="$RESULTS_DIR/tar"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  [0/4]  Initializing Benchmark Suite${RESET}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

mkdir -p "$RESULTS_DIR"
mkdir -p "$ARCHIVE_DIR"

# Archive existing results if any exist
if ls "$RESULTS_DIR"/*.json 1> /dev/null 2>&1 || ls "$RESULTS_DIR"/*.csv 1> /dev/null 2>&1; then
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  ARCHIVE_DEST="$ARCHIVE_DIR/run_$TIMESTAMP"
  mkdir -p "$ARCHIVE_DEST"
  echo "  📦  Archiving previous results to tar/run_$TIMESTAMP/"
  # Move all json/csv and the report html if it exists
  mv "$RESULTS_DIR"/*.json "$ARCHIVE_DEST/" 2>/dev/null || true
  mv "$RESULTS_DIR"/*.csv "$ARCHIVE_DEST/" 2>/dev/null || true
  mv "$RESULTS_DIR"/*.html "$ARCHIVE_DEST/" 2>/dev/null || true
  # Optionally copy plots if they exist
  if [ -d "$RESULTS_DIR/plots" ] && [ "$(ls -A "$RESULTS_DIR/plots" 2>/dev/null)" ]; then
    cp -r "$RESULTS_DIR/plots" "$ARCHIVE_DEST/"
  fi
fi

# Clean up any stragglers
rm -f "$RESULTS_DIR"/*.json "$RESULTS_DIR"/*.csv "$RESULTS_DIR"/*.html
rm -rf "$RESULTS_DIR/plots"

# ── Install deps if needed ─────────────────────────────────────────────────
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
  echo -e "${YELLOW}⚙  Installing bench dependencies...${RESET}"
  cd "$SCRIPT_DIR" && bun install
  echo ""
fi


# ── Step 1: Health Benchmarks ──────────────────────────────────────────────
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  [1/3]  Health Endpoint Benchmarks${RESET}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
bun run "$SCRIPT_DIR/01-health.bench.ts"
echo ""

# ── Step 2: Seed queue, then benchmark ingestion + drain simultaneously ────
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  [2/3]  Complaint Ingestion Benchmark + Drain Monitor${RESET}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "${YELLOW}  Starting ingestion bench and drain monitor in parallel...${RESET}"
echo ""

# Run drain monitor in background, ingestion in foreground
bun run "$SCRIPT_DIR/03-queue-drain.ts" > "$RESULTS_DIR/drain.log" 2>&1 &
DRAIN_PID=$!

bun run "$SCRIPT_DIR/02-ingestion.bench.ts"
INGESTION_STATUS=$?

# Give drain monitor a moment to finish after ingestion stops
sleep 3
kill "$DRAIN_PID" 2>/dev/null || true
wait "$DRAIN_PID" 2>/dev/null || true

# Print drain log after ingestion output
echo ""
echo "  ─── Drain Monitor Output ───────────────────────────────────"
cat "$RESULTS_DIR/drain.log" || true
echo ""

# ── Step 3: Final Summary ──────────────────────────────────────────────────
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  [3/3]  Final Summary${RESET}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

# Pull key numbers from JSON files using bun -e
if [ -f "$RESULTS_DIR/01-health.json" ] && [ -f "$RESULTS_DIR/02-ingestion.json" ]; then
  bun -e "
    const health = JSON.parse(require('fs').readFileSync('$RESULTS_DIR/01-health.json','utf8'));
    const ingestion = JSON.parse(require('fs').readFileSync('$RESULTS_DIR/02-ingestion.json','utf8'));

    const userBe    = health.results.find(r => r.service === 'user-be')    || {};
    const compQueue = health.results.find(r => r.service === 'compQueue') || {};

    console.log('');
    console.log('  ╔══════════════════════════════════════════════════════╗');
    console.log('  ║              BENCHMARK SUMMARY TABLE                 ║');
    console.log('  ╠══════════════════════════════╦═══════════╦═══════════╣');
    console.log('  ║ Metric                       ║  Value    ║  Unit     ║');
    console.log('  ╠══════════════════════════════╬═══════════╬═══════════╣');
    console.log('  ║ API Health Req/sec           ║ ' + String(userBe?.requests?.perSecond ?? 'N/A').padStart(9) + ' ║ req/sec   ║');
    console.log('  ║ API Health p99 latency       ║ ' + String(userBe?.latency?.p99 ?? 'N/A').padStart(9) + ' ║ ms        ║');
    console.log('  ║ compQueue Health Req/sec     ║ ' + String(compQueue?.requests?.perSecond ?? 'N/A').padStart(9) + ' ║ req/sec   ║');
    console.log('  ║ Complaint Ingestion Req/sec  ║ ' + String(ingestion.metrics?.requestsPerSecond ?? 'N/A').padStart(9) + ' ║ req/sec   ║');
    console.log('  ║ Complaint Ingestion p99      ║ ' + String(ingestion.metrics?.latency?.p99 ?? 'N/A').padStart(9) + ' ║ ms        ║');
    console.log('  ║ Ingestion Success Rate       ║ ' + String((ingestion.metrics?.successRate ?? 'N/A') + '%').padStart(9) + ' ║ %         ║');
    console.log('  ╚══════════════════════════════╩═══════════╩═══════════╝');
    console.log('');
  "
else
  echo -e "${YELLOW}  ⚠  Result files missing — some benchmarks may have failed.${RESET}"
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  [4/4]  Generating PPT Charts${RESET}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

if command -v python3 &>/dev/null && python3 -c "import matplotlib" &>/dev/null; then
  python3 "$SCRIPT_DIR/plot_results.py"
else
  echo -e "${YELLOW}  ⚠  python3 or matplotlib not found — skipping chart generation.${RESET}"
  echo -e "     (pip install matplotlib to enable auto-charts)"
fi
echo ""

echo -e "${GREEN}  ✅  All results saved in: bench/results/${RESET}"
echo ""
echo "  Files:"
ls -lh "$RESULTS_DIR/" 2>/dev/null | grep -v "plots" | awk '{print "    " $0}' || true
echo ""
echo "  Plots (bench/results/plots/):"
ls -lh "$RESULTS_DIR/plots/" 2>/dev/null | awk '{print "    " $0}' || true
echo ""
