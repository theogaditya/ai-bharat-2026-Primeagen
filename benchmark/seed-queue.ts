/**
 * seed-queue.ts — Pre-fill the Redis queue with N complaints concurrently
 *
 * Use this to load the queue BEFORE running 03-queue-drain.ts in isolation,
 * so you can measure pure processing throughput without ingestion noise.
 *
 * Run: bun bench/seed-queue.ts
 */

import pLimit from "p-limit";
import {
  config,
  getAuthToken,
  getCategoryId,
  makeComplaintBody,
  checkServices,
} from "./setup";

async function pushOne(
  url: string,
  token: string,
  body: string
): Promise<{ ok: boolean; status: number }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

async function main() {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║   SwarajDesk — Queue Seed Script            ║");
  console.log("╚══════════════════════════════════════════════╝");

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

  const url = `${config.userBeUrl}/api/complaints`;
  const body = JSON.stringify(makeComplaintBody(categoryId, config.subCategory));
  const total = config.seedCount;
  const concurrency = 50; // parallel inflight requests

  console.log(`▶  Seeding ${total.toLocaleString()} complaints into Redis queue`);
  console.log(`   Concurrency: ${concurrency} parallel requests\n`);

  const limit = pLimit(concurrency);
  const startTime = Date.now();

  let success = 0;
  let failure = 0;
  let done = 0;

  const tasks = Array.from({ length: total }, (_, i) =>
    limit(async () => {
      const result = await pushOne(url, token, body);
      done++;
      if (result.ok) {
        success++;
      } else {
        failure++;
        if (failure <= 5) {
          // Only log first few failures to avoid spam
          console.warn(`\n  ✗  Request ${i + 1} failed with status ${result.status}`);
        }
      }

      // Progress indicator every 100 items
      if (done % 100 === 0 || done === total) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = (done / Number(elapsed)).toFixed(0);
        process.stdout.write(
          `\r  Progress: ${done}/${total}  |  ${rate} req/s  |  ✓ ${success}  ✗ ${failure}   `
        );
      }
    })
  );

  await Promise.all(tasks);

  const elapsed = (Date.now() - startTime) / 1000;
  const throughput = (success / elapsed).toFixed(1);

  console.log("\n\n");
  console.log("═".repeat(50));
  console.log("  SEED RESULTS");
  console.log("═".repeat(50));
  console.log(`  Total sent     ${total.toLocaleString()}`);
  console.log(`  Successful     ${success.toLocaleString()}`);
  console.log(`  Failed         ${failure.toLocaleString()}`);
  console.log(`  Time elapsed   ${elapsed.toFixed(1)}s`);
  console.log(`  Ingestion rate ${throughput} complaints/sec`);
  console.log("═".repeat(50));
  console.log(
    `\n  ✅  Queue seeded. Now run: bun bench/03-queue-drain.ts\n`
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
