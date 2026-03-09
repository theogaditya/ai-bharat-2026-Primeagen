/**
 * 01-health.bench.ts — Benchmark health endpoints on all three services
 *
 * Tests:
 *   - user-be   GET /api/health      (hits Postgres + Redis, real I/O)
 *   - compQueue GET /health          (lightweight)
 *   - self      GET /health          (AI orchestrator, no AI invoked)
 *
 * Run: bun bench/01-health.bench.ts
 */

import autocannon from "autocannon";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { checkServices, config } from "./setup";

const RESULTS_DIR = join(import.meta.dir, "results");

interface BenchResult {
  service: string;
  url: string;
  connections: number;
  duration: number;
  requests: {
    total: number;
    perSecond: number;
  };
  latency: {
    p50: number;
    p90: number;
    p99: number;
    average: number;
    max: number;
  };
  errors: number;
  timeouts: number;
  throughput: {
    average: number; // bytes/sec
  };
}

async function runHealthBench(
  name: string,
  url: string
): Promise<BenchResult> {
  return new Promise((resolve, reject) => {
    console.log(`\n▶  Benchmarking ${name}: ${url}`);
    console.log(`   100 connections × 20 seconds\n`);

    const instance = autocannon(
      {
        url,
        connections: 100,
        duration: 20,
        pipelining: 1,
        timeout: 10,
      },
      (err, result) => {
        if (err) return reject(err);

        const bench: BenchResult = {
          service: name,
          url,
          connections: 100,
          duration: 20,
          requests: {
            total: result.requests.total,
            perSecond: Math.round(result.requests.average),
          },
          latency: {
            p50: result.latency.p50,
            p90: result.latency.p90,
            p99: result.latency.p99,
            average: Math.round(result.latency.average),
            max: result.latency.max,
          },
          errors: result.errors,
          timeouts: result.timeouts,
          throughput: {
            average: Math.round(result.throughput.average),
          },
        };

        resolve(bench);
      }
    );

    autocannon.track(instance, { renderProgressBar: true });
  });
}

function printSummaryTable(results: BenchResult[]) {
  console.log("\n");
  console.log("═".repeat(88));
  console.log("  HEALTH BENCHMARK RESULTS");
  console.log("═".repeat(88));
  console.log(
    `  ${"Service".padEnd(14)} ${"Req/sec".padStart(9)} ${"p50 (ms)".padStart(10)} ${"p90 (ms)".padStart(10)} ${"p99 (ms)".padStart(10)} ${"Avg (ms)".padStart(10)} ${"Errors".padStart(8)}`
  );
  console.log("─".repeat(88));
  for (const r of results) {
    const errorFlag = r.errors > 0 ? " ⚠" : "";
    console.log(
      `  ${r.service.padEnd(14)} ${String(r.requests.perSecond).padStart(9)} ${String(r.latency.p50).padStart(10)} ${String(r.latency.p90).padStart(10)} ${String(r.latency.p99).padStart(10)} ${String(r.latency.average).padStart(10)} ${String(r.errors).padStart(8)}${errorFlag}`
    );
  }
  console.log("═".repeat(88));
  console.log();
}

async function main() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║   SwarajDesk — Health Benchmark (01)    ║");
  console.log("╚══════════════════════════════════════════╝");

  const allOk = await checkServices();
  if (!allOk) {
    console.warn(
      "⚠  Some services are unreachable. Results may be incomplete.\n"
    );
  }

  mkdirSync(RESULTS_DIR, { recursive: true });

  const endpoints = [
    { name: "user-be", url: `${config.userBeUrl}/api/health` },
    { name: "compQueue", url: `${config.compQueueUrl}/health` },
    { name: "self", url: `${config.selfUrl}/health` },
  ];

  const results: BenchResult[] = [];

  for (const ep of endpoints) {
    try {
      const r = await runHealthBench(ep.name, ep.url);
      results.push(r);
    } catch (err) {
      console.error(`  ✗  ${ep.name} bench failed: ${err}`);
    }
  }

  printSummaryTable(results);

  const outPath = join(RESULTS_DIR, "01-health.json");
  writeFileSync(outPath, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
  console.log(`✅  Results saved → ${outPath}\n`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
