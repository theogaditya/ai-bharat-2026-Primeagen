#!/usr/bin/env python3
"""
plot_results.py — Generate PPT-ready PNG charts from benchmark results.

Charts are architecturally labelled so judges/reviewers understand
exactly what each number represents.

Usage:
    python3 bench/plot_results.py

Output:
    bench/results/plots/chart_*.png
"""

import json
import csv
import os
import sys
import warnings

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import numpy as np

warnings.filterwarnings("ignore", category=UserWarning, module="matplotlib")

# ────────────────────────────────────────────────────────────────────────────
# Config
# ────────────────────────────────────────────────────────────────────────────
DATA_DIR  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "results")
PLOTS_DIR = os.path.join(DATA_DIR, "plots")

# Dark theme palette
BG       = "#0d0f14"
CARD_BG  = "#1a1d28"
BORDER   = "#252838"
TEXT     = "#e8eaf0"
MUTED    = "#7c7f9e"
ACCENT1  = "#6c63ff"   # purple
ACCENT2  = "#00d2a8"   # teal
ACCENT3  = "#ff6b6b"   # coral
ACCENT4  = "#ffa94d"   # amber

DPI = 200

# Environment label — shown on every chart
ENV_LABEL = "Local · Bun runtime · NeonDB (serverless) · Redis.io · autocannon"

plt.rcParams.update({
    "figure.facecolor":    BG,
    "axes.facecolor":      CARD_BG,
    "axes.edgecolor":      BORDER,
    "axes.labelcolor":     TEXT,
    "text.color":          TEXT,
    "xtick.color":         MUTED,
    "ytick.color":         MUTED,
    "grid.color":          BORDER,
    "grid.alpha":          0.6,
    "font.family":         "sans-serif",
    "font.size":           11,
    "axes.titlesize":      14,
    "axes.titleweight":    "bold",
    "figure.titlesize":    16,
    "figure.titleweight":  "bold",
})


def add_env_footer(fig, extra=""):
    """Add a small environment label at the bottom of every chart."""
    label = ENV_LABEL
    if extra:
        label = f"{extra}  ·  {label}"
    fig.text(0.5, 0.01, label, ha="center", fontsize=7.5, color=MUTED, style="italic")


# ────────────────────────────────────────────────────────────────────────────
# Load data
# ────────────────────────────────────────────────────────────────────────────
def load_json(filename):
    p = os.path.join(DATA_DIR, filename)
    if not os.path.exists(p):
        return None
    with open(p) as f:
        return json.load(f)


def load_drain_csv():
    p = os.path.join(DATA_DIR, "drain.csv")
    if not os.path.exists(p):
        return [], []
    elapsed, length = [], []
    with open(p) as f:
        reader = csv.DictReader(f)
        for row in reader:
            elapsed.append(float(row["elapsed_ms"]) / 1000)
            length.append(int(row["queue_length"]))
    return elapsed, length


health    = load_json("01-health.json")
ingestion = load_json("02-ingestion.json")
drain_elapsed, drain_length = load_drain_csv()

if health is None and ingestion is None:
    print("❌  No result files found in bench/results/. Run benchmarks first.")
    sys.exit(1)


# ────────────────────────────────────────────────────────────────────────────
# Chart 1: Service Health Throughput (clearly labelled as health-check only)
# ────────────────────────────────────────────────────────────────────────────
def plot_health_throughput():
    if not health:
        return

    services = []
    values   = []
    colors   = []
    sublabels = []

    for r in health["results"]:
        name = r["service"]
        services.append(name)
        values.append(r["requests"]["perSecond"])

        if name == "user-be":
            colors.append(ACCENT1)
            sublabels.append("/api/health\n(hits NeonDB)")
        elif name == "compQueue":
            colors.append(ACCENT2)
            sublabels.append("/health\n(in-memory)")
        else:
            colors.append(ACCENT4)
            sublabels.append("/health\n(in-memory)")

    fig, ax = plt.subplots(figsize=(8, 5))

    bars = ax.bar(services, values, color=colors, edgecolor=colors,
                  linewidth=1.5, width=0.5, zorder=3)

    # Value labels
    for bar, val in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + max(values)*0.02,
                f"{val:,}", ha="center", va="bottom", fontsize=12,
                fontweight="bold", color=TEXT)

    # Sublabels under service names
    ax.set_xticks(range(len(services)))
    ax.set_xticklabels([f"{s}\n{sl}" for s, sl in zip(services, sublabels)],
                       fontsize=9, linespacing=1.4)

    ax.set_ylabel("Requests / sec", fontsize=12)
    ax.set_title("Service Health-Check Throughput", pad=20)
    ax.text(0.5, 1.02, "Baseline capacity of each service endpoint (GET health routes only)",
            transform=ax.transAxes, ha="center", fontsize=9, color=MUTED)

    ax.yaxis.set_major_formatter(ticker.FuncFormatter(lambda x, _: f"{int(x):,}"))
    ax.grid(axis="y", alpha=0.4)
    ax.set_axisbelow(True)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    # Annotation: explain user-be slowness
    user_be_r = next((r for r in health["results"] if r["service"] == "user-be"), None)
    if user_be_r:
        ax.annotate(
            "← NeonDB serverless\n   cold-start latency",
            xy=(0, user_be_r["requests"]["perSecond"]),
            xytext=(0.8, user_be_r["requests"]["perSecond"] * 8),
            fontsize=8, color=ACCENT3, fontweight="bold",
            arrowprops=dict(arrowstyle="->", color=ACCENT3, lw=1.2),
        )

    add_env_footer(fig, "100 concurrent connections · 20s duration")
    fig.tight_layout(rect=[0, 0.04, 1, 1])
    out = os.path.join(PLOTS_DIR, "chart_health_throughput.png")
    fig.savefig(out, dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    print(f"  ✅  {out}")


# ────────────────────────────────────────────────────────────────────────────
# Chart 2: Latency percentiles — separated into two panels
# ────────────────────────────────────────────────────────────────────────────
def plot_latency_percentiles():
    if not health:
        return

    results = health["results"]

    # Split: user-be (DB-connected) vs lightweight services
    heavy = [r for r in results if r["service"] == "user-be"]
    light = [r for r in results if r["service"] != "user-be"]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5),
                                    gridspec_kw={"width_ratios": [1, 1.3]})

    # ── Left panel: user-be (high latency, DB-bound) ──
    if heavy:
        r = heavy[0]
        labels = ["p50", "p90", "p99", "Max"]
        vals = [r["latency"]["p50"], r["latency"]["p90"],
                r["latency"]["p99"], r["latency"]["max"]]
        bar_colors = [ACCENT2, ACCENT4, ACCENT3, ACCENT1]

        bars = ax1.barh(labels[::-1], vals[::-1], color=bar_colors[::-1],
                        edgecolor=bar_colors[::-1], height=0.5, zorder=3)
        for bar, val in zip(bars, vals[::-1]):
            ax1.text(bar.get_width() + max(vals)*0.03, bar.get_y()+bar.get_height()/2,
                     f"{val} ms", ha="left", va="center", fontsize=11,
                     fontweight="bold", color=TEXT)

        ax1.set_title("user-be  (API Layer)", pad=14)
        ax1.text(0.5, 1.01,
                 "DB-connected · NeonDB serverless cold-start",
                 transform=ax1.transAxes, ha="center", fontsize=8, color=MUTED)
        ax1.set_xlabel("Latency (ms)")
        ax1.set_xlim(0, max(vals) * 1.3)
        ax1.grid(axis="x", alpha=0.4)
        ax1.set_axisbelow(True)
        ax1.spines["top"].set_visible(False)
        ax1.spines["right"].set_visible(False)

    # ── Right panel: compQueue + self (low latency, in-memory) ──
    svc_names = [r["service"] for r in light]
    x = np.arange(len(svc_names))
    width = 0.22

    p50 = [r["latency"]["p50"] for r in light]
    p90 = [r["latency"]["p90"] for r in light]
    p99 = [r["latency"]["p99"] for r in light]

    ax2.bar(x - width, p50, width, label="p50", color=ACCENT2, alpha=0.85, zorder=3)
    ax2.bar(x,         p90, width, label="p90", color=ACCENT4, alpha=0.85, zorder=3)
    ax2.bar(x + width, p99, width, label="p99", color=ACCENT3, alpha=0.85, zorder=3)

    ax2.set_title("Queue & Service Layer", pad=14)
    ax2.text(0.5, 1.01,
             "In-memory health routes · no DB/external calls",
             transform=ax2.transAxes, ha="center", fontsize=8, color=MUTED)
    ax2.set_ylabel("Latency (ms)")
    ax2.set_xticks(x)
    ax2.set_xticklabels(svc_names)
    ax2.legend(loc="upper right", framealpha=0.3, edgecolor=BORDER)
    ax2.grid(axis="y", alpha=0.4)
    ax2.set_axisbelow(True)
    ax2.spines["top"].set_visible(False)
    ax2.spines["right"].set_visible(False)

    fig.suptitle("Latency Percentiles by Architecture Layer", fontsize=15, fontweight="bold", y=1.02)
    add_env_footer(fig, "100 concurrent connections · 20s duration")
    fig.tight_layout(rect=[0, 0.04, 1, 0.98])
    out = os.path.join(PLOTS_DIR, "chart_latency_percentiles.png")
    fig.savefig(out, dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    print(f"  ✅  {out}")


# ────────────────────────────────────────────────────────────────────────────
# Chart 3: Complaint Ingestion — labelled as full-pipeline workload
# ────────────────────────────────────────────────────────────────────────────
def plot_ingestion():
    if not ingestion:
        return

    m = ingestion["metrics"]
    lat = m["latency"]
    conns = ingestion["config"]["connections"]
    dur   = ingestion["config"]["duration"]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5),
                                    gridspec_kw={"width_ratios": [1.2, 1]})

    # ── Left: latency breakdown as horizontal bars ──
    labels = ["Avg", "p50", "p90", "p99", "Max"]
    vals = [lat["average"], lat["p50"], lat["p90"], lat["p99"], lat["max"]]
    bar_colors = [ACCENT2, ACCENT2, ACCENT4, ACCENT3, ACCENT1]

    bars = ax1.barh(labels[::-1], vals[::-1], color=bar_colors[::-1],
                    edgecolor=bar_colors[::-1], height=0.5, zorder=3)
    for bar, val in zip(bars, vals[::-1]):
        ax1.text(bar.get_width() + max(vals)*0.02, bar.get_y()+bar.get_height()/2,
                 f"{val} ms", ha="left", va="center", fontsize=11,
                 fontweight="bold", color=TEXT)

    ax1.set_xlabel("Latency (ms)")
    ax1.set_title("Complaint Ingestion Latency", pad=14)
    ax1.text(0.5, 1.01,
             "Full pipeline: auth → validate → Redis push → DB write → response",
             transform=ax1.transAxes, ha="center", fontsize=8, color=MUTED)
    ax1.set_xlim(0, max(vals) * 1.25)
    ax1.grid(axis="x", alpha=0.4)
    ax1.set_axisbelow(True)
    ax1.spines["top"].set_visible(False)
    ax1.spines["right"].set_visible(False)

    # ── Right: KPI cards as text ──
    ax2.axis("off")
    ax2.set_title("Ingestion Summary", pad=14)

    kpis = [
        ("Throughput",    f"{m['requestsPerSecond']} req/sec", ACCENT1),
        ("Total Requests", f"{m['totalRequests']:,}",          ACCENT2),
        ("Success Rate",  f"{m['successRate']}%",              ACCENT2 if m["successRate"] >= 99 else ACCENT3),
        ("Errors",        f"{m['errors']:,}",                  ACCENT2 if m["errors"] == 0 else ACCENT3),
        ("Timeouts",      f"{m['timeouts']:,}",                ACCENT2 if m["timeouts"] == 0 else ACCENT3),
    ]

    for i, (label, value, color) in enumerate(kpis):
        y = 0.88 - i * 0.18
        ax2.text(0.1, y, label, transform=ax2.transAxes,
                 fontsize=10, color=MUTED, fontweight="bold")
        ax2.text(0.85, y, value, transform=ax2.transAxes,
                 fontsize=14, color=color, fontweight="bold", ha="right")
        # separator line
        if i < len(kpis) - 1:
            ax2.axhline(y=y - 0.06, xmin=0.08, xmax=0.92, color=BORDER,
                        linewidth=0.8)

    add_env_footer(fig, f"{conns} concurrent connections · {dur}s duration · POST /api/complaints")
    fig.tight_layout(rect=[0, 0.04, 1, 1])
    out = os.path.join(PLOTS_DIR, "chart_ingestion.png")
    fig.savefig(out, dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    print(f"  ✅  {out}")


# ────────────────────────────────────────────────────────────────────────────
# Chart 4: Queue drain over time
# ────────────────────────────────────────────────────────────────────────────
def plot_drain():
    if len(drain_elapsed) < 2:
        return

    fig, ax = plt.subplots(figsize=(9, 4.5))

    ax.fill_between(drain_elapsed, drain_length, alpha=0.15, color=ACCENT1, zorder=2)
    ax.plot(drain_elapsed, drain_length, color=ACCENT1, linewidth=2.5, zorder=3)

    ax.set_xlabel("Time (seconds)", fontsize=12)
    ax.set_ylabel("Queue Length", fontsize=12)
    ax.set_title("Redis Queue Drain Over Time", pad=20)
    ax.text(0.5, 1.02,
            "Queue worker processing rate — complaints dequeued from Redis",
            transform=ax.transAxes, ha="center", fontsize=9, color=MUTED)

    ax.grid(axis="y", alpha=0.4)
    ax.set_axisbelow(True)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    # Annotate start
    if drain_length[0] > 0:
        ax.annotate(f"Start: {drain_length[0]:,}",
                    xy=(drain_elapsed[0], drain_length[0]),
                    xytext=(drain_elapsed[0] + max(drain_elapsed)*0.1, drain_length[0] * 0.85),
                    fontsize=10, color=ACCENT4, fontweight="bold",
                    arrowprops=dict(arrowstyle="->", color=ACCENT4, lw=1.5))

    # Compute and show drain rate
    if drain_length[0] > drain_length[-1] and drain_elapsed[-1] > 0:
        rate = (drain_length[0] - drain_length[-1]) / drain_elapsed[-1]
        ax.text(0.98, 0.95, f"Drain rate: {rate:.1f} complaints/sec",
                transform=ax.transAxes, ha="right", va="top",
                fontsize=11, fontweight="bold", color=ACCENT2,
                bbox=dict(boxstyle="round,pad=0.4", facecolor=CARD_BG, edgecolor=ACCENT2, alpha=0.9))

    add_env_footer(fig, "Redis-backed worker pipeline")
    fig.tight_layout(rect=[0, 0.04, 1, 1])
    out = os.path.join(PLOTS_DIR, "chart_queue_drain.png")
    fig.savefig(out, dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    print(f"  ✅  {out}")


# ────────────────────────────────────────────────────────────────────────────
# Chart 5: Architecture-aware KPI Summary Card (hero slide)
# ────────────────────────────────────────────────────────────────────────────
def plot_kpi_summary():
    from matplotlib.patches import FancyBboxPatch, Rectangle

    # Build metrics grouped by architectural layer
    metrics = []

    if health:
        user_be = next((r for r in health["results"] if r["service"] == "user-be"), None)
        comp_q  = next((r for r in health["results"] if r["service"] == "compQueue"), None)
        if user_be:
            metrics.append(("API Layer\nThroughput",     f"{user_be['requests']['perSecond']:,}",  "req/sec",  ACCENT1, "user-be · DB-bound"))
            metrics.append(("API Layer\np99 Latency",    f"{user_be['latency']['p99']}",           "ms",       ACCENT4, "NeonDB serverless"))
        if comp_q:
            metrics.append(("Queue Layer\nThroughput",   f"{comp_q['requests']['perSecond']:,}",   "req/sec",  ACCENT2, "Redis-backed workers"))

    if ingestion:
        metrics.append(("Complaint\nIngestion",  f"{ingestion['metrics']['requestsPerSecond']:,}", "req/sec", ACCENT3, "full pipeline"))
        metrics.append(("Ingestion\nSuccess",    f"{ingestion['metrics']['successRate']}%",        "",        ACCENT2, ""))

    if not metrics:
        return

    n = len(metrics)
    fig, ax = plt.subplots(figsize=(max(10, n * 2.2), 4))
    ax.axis("off")

    fig.suptitle("SwarajDesk — Backend Performance Summary", fontsize=16,
                 fontweight="bold", y=0.97)

    card_w = 0.85 / n
    padding = (1 - card_w * n) / 2

    for i, (label, value, unit, color, note) in enumerate(metrics):
        cx = padding + (i + 0.5) * card_w

        # Card background
        rect = FancyBboxPatch(
            (cx - card_w*0.45, 0.08), card_w*0.9, 0.82,
            boxstyle="round,pad=0.02",
            facecolor=CARD_BG, edgecolor=BORDER, linewidth=1.5,
            transform=ax.transAxes, zorder=1
        )
        ax.add_patch(rect)

        # Top accent bar
        accent = Rectangle(
            (cx - card_w*0.45, 0.86), card_w*0.9, 0.04,
            facecolor=color, transform=ax.transAxes, zorder=2, clip_on=False
        )
        ax.add_patch(accent)

        # Value
        ax.text(cx, 0.55, value, transform=ax.transAxes,
                ha="center", va="center", fontsize=24, fontweight="bold",
                color=color, zorder=3)

        # Label (top)
        ax.text(cx, 0.80, label, transform=ax.transAxes,
                ha="center", va="center", fontsize=8.5, color=MUTED,
                fontweight="bold", linespacing=1.3, zorder=3)

        # Unit
        if unit:
            ax.text(cx, 0.35, unit, transform=ax.transAxes,
                    ha="center", va="center", fontsize=10, color=MUTED, zorder=3)

        # Note (architectural context)
        if note:
            ax.text(cx, 0.18, note, transform=ax.transAxes,
                    ha="center", va="center", fontsize=7, color=MUTED,
                    style="italic", zorder=3)

    add_env_footer(fig)
    fig.tight_layout(rect=[0, 0.04, 1, 0.93])
    out = os.path.join(PLOTS_DIR, "chart_kpi_summary.png")
    fig.savefig(out, dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    print(f"  ✅  {out}")


# ────────────────────────────────────────────────────────────────────────────
# Chart 6: Architecture Diagram (text-based for PPT context slide)
# ────────────────────────────────────────────────────────────────────────────
def plot_architecture_context():
    """A visual slide explaining the test setup and what each benchmark measures."""
    fig, ax = plt.subplots(figsize=(11, 5.5))
    ax.axis("off")

    fig.suptitle("Benchmark Architecture & Test Design", fontsize=16,
                 fontweight="bold", y=0.97)

    layers = [
        {
            "title": "① API Layer  (user-be)",
            "tests": "Health check, Complaint POST",
            "stack": "Bun → Hono → PostgreSQL (NeonDB)",
            "note":  "Latency dominated by serverless DB cold-start",
            "color": ACCENT1, "y": 0.78,
        },
        {
            "title": "② Queue Layer  (compQueue)",
            "tests": "Health check, Queue drain monitor",
            "stack": "Bun → Redis.io (BullMQ)",
            "note":  "Pure in-memory queue ops — sub-10ms latency",
            "color": ACCENT2, "y": 0.48,
        },
        {
            "title": "③ Service Layer  (self)",
            "tests": "Health check",
            "stack": "Bun → internal routes",
            "note":  "Lightweight proxy — no external calls on /health",
            "color": ACCENT4, "y": 0.18,
        },
    ]

    for layer in layers:
        y = layer["y"]
        # Accent bar
        ax.axhline(y=y + 0.12, xmin=0.05, xmax=0.95, color=layer["color"],
                   linewidth=2)

        ax.text(0.08, y + 0.08, layer["title"], transform=ax.transAxes,
                fontsize=12, fontweight="bold", color=layer["color"])
        ax.text(0.08, y + 0.01, f"Stack:  {layer['stack']}", transform=ax.transAxes,
                fontsize=9, color=TEXT)
        ax.text(0.08, y - 0.06, f"Tests:  {layer['tests']}", transform=ax.transAxes,
                fontsize=9, color=MUTED)
        ax.text(0.60, y + 0.01, layer["note"], transform=ax.transAxes,
                fontsize=9, color=MUTED, style="italic")

    add_env_footer(fig)
    fig.tight_layout(rect=[0, 0.04, 1, 0.93])
    out = os.path.join(PLOTS_DIR, "chart_architecture.png")
    fig.savefig(out, dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    print(f"  ✅  {out}")


# ────────────────────────────────────────────────────────────────────────────
# Main
# ────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n╔══════════════════════════════════════════════════╗")
    print("║   SwarajDesk — Generating PPT Charts            ║")
    print("╚══════════════════════════════════════════════════╝\n")

    os.makedirs(PLOTS_DIR, exist_ok=True)

    plot_architecture_context()
    plot_health_throughput()
    plot_latency_percentiles()
    plot_ingestion()
    plot_drain()
    plot_kpi_summary()

    print(f"\n  📁  All charts saved to: {PLOTS_DIR}/")
    print("  📎  Drop these PNGs directly into your PPT slides.\n")
    print("  Recommended slide order:")
    print("    1. chart_architecture.png    — what we tested")
    print("    2. chart_health_throughput.png — service baseline")
    print("    3. chart_latency_percentiles.png — latency by layer")
    print("    4. chart_ingestion.png       — real workload")
    print("    5. chart_queue_drain.png     — queue processing")
    print("    6. chart_kpi_summary.png     — hero summary\n")
