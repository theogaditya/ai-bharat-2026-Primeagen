/**
 * 03-queue-drain.ts — Monitor Redis queue drain rate via compQueue's status API
 *
 * Polls GET /api/processing/status every 500ms and records (timestamp, queue_length)
 * to bench/results/drain.csv. Stops when queue reaches 0 (or on Ctrl+C).
 *
 * Run WHILE 02-ingestion.bench.ts is active, or after seeding with seed-queue.ts:
 *
 *   # Terminal 1
 *   bun bench/02-ingestion.bench.ts
 *
 *   # Terminal 2 (start once queue starts filling)
 *   bun bench/03-queue-drain.ts
 */

import { mkdirSync, writeFileSync, appendFileSync } from "fs";
import { join } from "path";
import { config } from "./setup";

const RESULTS_DIR = join(import.meta.dir, "results");
const POLL_INTERVAL_MS = 500;

interface QueueStatus {
  isPolling: boolean;
  queues: {
    complaint?: { length: number };
    processed?: { length: number };
  } | null;
}

async function fetchQueueLength(): Promise<number | null> {
  try {
    const res = await fetch(`${config.compQueueUrl}/api/processing/status`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const json = (await res.json()) as QueueStatus;
    const length = json?.queues?.complaint?.length;
    return typeof length === "number" ? length : null;
  } catch {
    return null;
  }
}

async function main() {
  console.log("\n╔═══════════════════════════════════════════════╗");
  console.log("║   SwarajDesk — Queue Drain Monitor (03)      ║");
  console.log("╚═══════════════════════════════════════════════╝");
  console.log("\n  Polling compQueue every 500ms...");
  console.log("  Press Ctrl+C to stop.\n");

  mkdirSync(RESULTS_DIR, { recursive: true });

  const csvPath = join(RESULTS_DIR, "drain.csv");
  // Write CSV header
  writeFileSync(csvPath, "elapsed_ms,queue_length\n");

  const startTime = Date.now();
  let startLength: number | null = null;
  let lastLength: number | null = null;
  let consecutiveZero = 0;
  let samples = 0;

  const interval = setInterval(async () => {
    const length = await fetchQueueLength();
    const elapsed = Date.now() - startTime;

    if (length === null) {
      console.log(`  [${formatMs(elapsed)}]  ⚠  Could not reach compQueue`);
      return;
    }

    if (startLength === null && length > 0) {
      startLength = length;
      console.log(`  [${formatMs(elapsed)}]  Queue start: ${length} items`);
    }

    appendFileSync(csvPath, `${elapsed},${length}\n`);
    samples++;

    const indicator = length === 0 ? "✅ EMPTY" : `${length} items`;
    process.stdout.write(`\r  [${formatMs(elapsed)}]  Queue: ${indicator}   `);

    lastLength = length;

    if (length === 0) {
      consecutiveZero++;
    } else {
      consecutiveZero = 0;
    }

    // Stop after 3 consecutive zero readings (queue is truly drained)
    if (consecutiveZero >= 3) {
      clearInterval(interval);
      printDrainSummary(startTime, startLength, csvPath);
    }
  }, POLL_INTERVAL_MS);

  // Also stop on Ctrl+C
  process.on("SIGINT", () => {
    clearInterval(interval);
    console.log("\n\n  Stopped by user.");
    printDrainSummary(startTime, startLength, csvPath);
  });
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const remaining = ms % 1000;
  return `${String(s).padStart(4, "0")}s ${String(remaining).padStart(3, "0")}ms`;
}

function printDrainSummary(
  startTime: number,
  startLength: number | null,
  csvPath: string
) {
  const elapsed = Date.now() - startTime;
  const elapsedSec = elapsed / 1000;

  console.log("\n\n");
  console.log("═".repeat(50));
  console.log("  QUEUE DRAIN RESULTS");
  console.log("═".repeat(50));

  if (startLength !== null && startLength > 0) {
    const throughput = (startLength / elapsedSec).toFixed(1);
    console.log(`  Initial queue size  ${startLength.toLocaleString()} complaints`);
    console.log(`  Time to drain       ${elapsedSec.toFixed(1)}s`);
    console.log(`  Processing rate     ${throughput} complaints/sec`);
  } else {
    console.log(`  No items were observed in the queue.`);
    console.log(`  Start 02-ingestion.bench.ts first to fill the queue.`);
  }

  console.log(`  CSV saved → ${csvPath}`);
  console.log("═".repeat(50));
  console.log();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
