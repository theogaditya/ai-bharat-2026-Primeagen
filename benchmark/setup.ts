/**
 * setup.ts — Shared configuration and auth helpers for benchmark scripts
 *
 * Reads from .env in the bench/ directory.
 */

import { readFileSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// Load .env from bench/ directory
// ---------------------------------------------------------------------------
function loadEnv() {
  try {
    const envPath = join(import.meta.dir, ".env");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env missing — rely on process.env being pre-set
  }
}

loadEnv();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
export const config = {
  userBeUrl: process.env.USER_BE_URL ?? "http://localhost:3000",
  compQueueUrl: process.env.COMP_QUEUE_URL ?? "http://localhost:3005",
  selfUrl: process.env.SELF_URL ?? "http://localhost:3030",

  benchEmail: process.env.BENCH_USER_EMAIL ?? "",
  benchPassword: process.env.BENCH_USER_PASSWORD ?? "",

  categoryId: process.env.BENCH_CATEGORY_ID ?? "",
  subCategory: process.env.BENCH_SUB_CATEGORY ?? "Pothole",

  ingestionConnections: Number(process.env.INGESTION_CONNECTIONS ?? 200),
  ingestionDuration: Number(process.env.INGESTION_DURATION ?? 30),
  seedCount: Number(process.env.SEED_COUNT ?? 1000),
};

// ---------------------------------------------------------------------------
// Auth — obtain JWT from user-be
// ---------------------------------------------------------------------------
export async function getAuthToken(): Promise<string> {
  if (!config.benchEmail || !config.benchPassword) {
    throw new Error(
      "BENCH_USER_EMAIL and BENCH_USER_PASSWORD must be set in bench/.env"
    );
  }

  const res = await fetch(`${config.userBeUrl}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: config.benchEmail,
      password: config.benchPassword,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { data?: { token?: string } };
  const token = json?.data?.token;
  if (!token) {
    throw new Error(
      `Login succeeded but no token in response: ${JSON.stringify(json)}`
    );
  }

  return token;
}

// ---------------------------------------------------------------------------
// Category — fetch first category from DB via API if not configured
// ---------------------------------------------------------------------------
export async function getCategoryId(): Promise<string> {
  if (
    config.categoryId &&
    config.categoryId !== "00000000-0000-0000-0000-000000000000"
  ) {
    return config.categoryId;
  }

  console.log(
    "  ⚠  BENCH_CATEGORY_ID not set. Fetching from /api/categories..."
  );
  const res = await fetch(`${config.userBeUrl}/api/categories`);
  if (!res.ok) throw new Error(`Could not fetch categories: ${res.status}`);

  const json = (await res.json()) as Array<{ id: string }> | { data?: Array<{ id: string }> };
  const list = Array.isArray(json) ? json : (json as { data?: Array<{ id: string }> }).data;
  if (!list || list.length === 0) {
    throw new Error(
      "No categories found in DB. Seed your DB or set BENCH_CATEGORY_ID in bench/.env"
    );
  }

  console.log(`  ✓  Using categoryId: ${list[0]!.id}`);
  return list[0]!.id;
}

// ---------------------------------------------------------------------------
// Complaint body factory
// ---------------------------------------------------------------------------
export function makeComplaintBody(categoryId: string, subCategory: string) {
  return {
    categoryId,
    subCategory,
    description: "Benchmark test complaint — road infrastructure issue reported",
    urgency: "LOW",
    assignedDepartment: "INFRASTRUCTURE",
    isPublic: true,
    location: {
      pin: "751001",
      district: "Khordha",
      city: "Bhubaneswar",
      locality: "Unit 4",
      street: "MG Road",
      latitude: 20.2961,
      longitude: 85.8245,
    },
  };
}

// ---------------------------------------------------------------------------
// Service reachability check
// ---------------------------------------------------------------------------
export async function checkServices() {
  const services = [
    { name: "user-be    ", url: `${config.userBeUrl}/api/health` },
    { name: "compQueue  ", url: `${config.compQueueUrl}/health` },
    { name: "self       ", url: `${config.selfUrl}/health` },
  ];

  console.log("\n🔍  Checking service reachability...\n");

  let allOk = true;
  for (const svc of services) {
    try {
      const res = await fetch(svc.url, { signal: AbortSignal.timeout(10000) });
      const status = res.ok ? "✅  OK " : `⚠   ${res.status}`;
      console.log(`   ${svc.name}  ${status}  (${svc.url})`);
      if (!res.ok) allOk = false;
    } catch (err) {
      console.log(`   ${svc.name}  ❌  UNREACHABLE  (${svc.url})`);
      allOk = false;
    }
  }

  console.log();
  return allOk;
}
