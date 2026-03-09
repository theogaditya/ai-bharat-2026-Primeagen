/**
 * 02-ingestion.bench.ts — Benchmark complaint submission endpoint
 *
 * Tests: POST /api/complaints (auth-gated, pushes to Redis queue)
 *
 * This is the most important benchmark — it measures real workload ingestion
 * throughput including JWT auth verification and Redis push.
 *
 * Run: bun bench/02-ingestion.bench.ts
 */

import autocannon from "autocannon";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import {
  checkServices,
  config,
  getAuthToken,
  getCategoryId,
  makeComplaintBody,
} from "./setup";

const RESULTS_DIR = join(import.meta.dir, "results");

async function main() {
  console.log("\n╔═══════════════════════════════════════════════╗");
  console.log("║   SwarajDesk — Ingestion Benchmark (02)      ║");
  console.log("╚═══════════════════════════════════════════════╝");

  await checkServices();

  // --- Auth ---
  console.log("🔐  Obtaining auth token...");
  let token: string;
  try {
    token = await getAuthToken();
    console.log("   ✓  Token obtained\n");
  } catch (err) {
    console.error(`   ✗  Auth failed: ${err}`);
    process.exit(1);
  }

  // --- Category ---
  let categoryId: string;
  try {
    categoryId = await getCategoryId();
  } catch (err) {
    console.error(`   ✗  Category fetch failed: ${err}`);
    process.exit(1);
  }

  const body = JSON.stringify(makeComplaintBody(categoryId, config.subCategory));
  const url = `${config.userBeUrl}/api/complaints`;

  console.log(`▶  Benchmarking complaint ingestion`);
  console.log(`   POST ${url}`);
  console.log(
    `   ${config.ingestionConnections} connections × ${config.ingestionDuration}s\n`
  );

  mkdirSync(RESULTS_DIR, { recursive: true });

  const result = await new Promise<autocannon.Result>((resolve, reject) => {
    const instance = autocannon(
      {
        url,
        connections: config.ingestionConnections,
        duration: config.ingestionDuration,
        pipelining: 1,
        timeout: 15,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      },
      (err, res) => {
        if (err) return reject(err);
        resolve(res);
      }
    );

    autocannon.track(instance, { renderProgressBar: true });
  });

  // --- Summary ---
  const successRate =
    result.requests.total > 0
      ? (
          ((result.requests.total - result.errors) / result.requests.total) *
          100
        ).toFixed(2)
      : "0.00";

  console.log("\n");
  console.log("═".repeat(60));
  console.log("  INGESTION BENCHMARK RESULTS");
  console.log("═".repeat(60));
  console.log(`  Endpoint       POST /api/complaints`);
  console.log(
    `  Connections    ${config.ingestionConnections}  ×  ${config.ingestionDuration}s`
  );
  console.log(`  Total requests ${result.requests.total.toLocaleString()}`);
  console.log(`  Req/sec        ${Math.round(result.requests.average).toLocaleString()}`);
  console.log("─".repeat(60));
  console.log(`  Latency avg    ${Math.round(result.latency.average)} ms`);
  console.log(`  Latency p50    ${result.latency.p50} ms`);
  console.log(`  Latency p90    ${result.latency.p90} ms`);
  console.log(`  Latency p99    ${result.latency.p99} ms`);
  console.log(`  Latency max    ${result.latency.max} ms`);
  console.log("─".repeat(60));
  console.log(`  Errors         ${result.errors}  (${successRate}% success rate)`);
  console.log(`  Timeouts       ${result.timeouts}`);
  console.log("═".repeat(60));

  if (result.errors > result.requests.total * 0.05) {
    console.log(
      "\n  ⚠  Error rate > 5%. Check: token expiry, missing categoryId, or service overload."
    );
  }

  console.log();

  const output = {
    timestamp: new Date().toISOString(),
    config: {
      connections: config.ingestionConnections,
      duration: config.ingestionDuration,
      url,
    },
    metrics: {
      totalRequests: result.requests.total,
      requestsPerSecond: Math.round(result.requests.average),
      latency: {
        average: Math.round(result.latency.average),
        p50: result.latency.p50,
        p90: result.latency.p90,
        p99: result.latency.p99,
        max: result.latency.max,
      },
      errors: result.errors,
      timeouts: result.timeouts,
      successRate: Number(successRate),
    },
  };

  const outPath = join(RESULTS_DIR, "02-ingestion.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`✅  Results saved → ${outPath}\n`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
