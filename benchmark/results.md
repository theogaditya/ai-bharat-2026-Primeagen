# 1. System Architecture Overview Diagram

### What the image represents

This diagram illustrates the **high-level architecture of the SwarajDesk platform**, showing how frontend applications, backend microservices, AI services, and data infrastructure interact to process citizen complaints.

### Components typically visible in the image

**Client Layer**

* Citizen portal (Next.js)
* Admin dashboard (Next.js)

These interfaces allow users to submit complaints, upload media, and track complaint status.

**Edge Gateway**

* NGINX reverse proxy running inside the EC2 instance
* Handles TLS termination, routing, and rate limiting

All incoming requests first pass through this gateway before reaching backend services.

**Backend Service Layer**
Multiple backend services running on Bun/Node:

* `user-be` → handles citizen complaint submission APIs
* `admin-be` → admin dashboard APIs and complaint management
* `compQueue` → asynchronous complaint processing worker
* `self` → internal AI integration and GPT services

These services operate independently to prevent resource contention.

**AI Microservices**
Dedicated FastAPI inference services responsible for:

* vision validation
* abuse detection
* complaint categorization
* voice assistant

Separating these workloads prevents heavy inference tasks from slowing core API requests.

**Data Layer**

Persistence and messaging components include:

* PostgreSQL (primary structured database)
* Redis (queue + cache layer)
* S3 / object storage for media assets

The architecture follows an **asynchronous queue-driven processing model** where complaints are first queued before heavy processing occurs. 

---

# 2. Complaint Ingestion Throughput Graph

### What the graph measures

This plot shows **how many complaint requests per second the backend can ingest** under increasing user load.

The x-axis usually represents:

```
Concurrent Users or Request Rate
```

The y-axis represents:

```
Complaints processed per second (throughput)
```

### What the graph demonstrates

The purpose of this graph is to show that:

* the backend API layer scales efficiently
* queue-based ingestion prevents database overload
* complaint submissions remain responsive under high load

When a complaint is submitted:

```
User request
   ↓
user-be API
   ↓
Redis Queue
   ↓
compQueue worker
   ↓
PostgreSQL persistence
```

Because the queue buffers incoming traffic, the ingestion throughput can scale without directly stressing the database layer.

### Typical interpretation

If the graph plateaus gradually instead of collapsing:

* it indicates stable ingestion capacity
* queue buffering prevents service crashes

---

# 3. Latency Percentiles Graph (P50 / P95 / P99)

### What the graph measures

This graph measures **API response latency under load**.

Latency percentiles are used instead of averages to capture worst-case scenarios.

Typical metrics:

| Metric | Meaning                             |
| ------ | ----------------------------------- |
| P50    | median response time                |
| P95    | latency experienced by 95% of users |
| P99    | worst-case latency                  |

### What the graph demonstrates

The graph shows how API response time increases as concurrent traffic increases.

This test is important because the architecture separates:

* synchronous operations
* asynchronous processing

The backend returns a response **immediately after pushing the complaint to Redis**, not after full AI processing.

Therefore latency remains relatively low even under heavy traffic.

Typical explanation:

> Even under high concurrency, API latency remains stable because the complaint processing pipeline operates asynchronously through Redis queues rather than synchronous database writes.

---

# 4. Complaint Processing Pipeline Graph

### What the image represents

This diagram visualizes the **internal processing pipeline of a complaint** after submission.

Typical stages shown:

```
Complaint Submission
        ↓
Image Validation (Vision Model)
        ↓
Text Moderation (Abuse Detection)
        ↓
AI Categorization
        ↓
Queue Worker Processing
        ↓
Database Persistence
        ↓
Agent Assignment
```

### What the diagram demonstrates

The purpose of this visualization is to show that:

* AI validation does not block the user request
* tasks are distributed across independent services
* processing stages are modular and horizontally scalable

This design enables the platform to handle burst traffic such as civic emergencies or infrastructure failures.

---

# 5. Health vs Throughput Graph

### What the graph measures

This graph correlates **system throughput with system health metrics**, typically:

* CPU usage
* memory utilization
* queue length
* request throughput

### What the graph demonstrates

The graph demonstrates that the platform remains stable even as load increases.

Expected behavior:

* throughput increases with load
* CPU usage increases gradually
* queue length may grow but remains bounded

This indicates the architecture can absorb traffic spikes without immediate service degradation.

---

# 6. Ingestion Latency Graph

### What the graph measures

This graph specifically measures the **latency of complaint ingestion** — the time taken from:

```
HTTP request received
        ↓
Complaint pushed to Redis queue
        ↓
API response returned
```

This excludes:

* AI processing
* database persistence
* downstream worker execution

### What the graph demonstrates

It proves that the platform provides **fast user feedback even during heavy load**.

Typical result:

```
< 200 ms latency at moderate load
< 400 ms latency at high load
```

This is possible because the architecture prioritizes **queue-first ingestion instead of synchronous processing**.

---

# 7. KPI Summary Chart

### What the chart represents

This image summarizes **key performance metrics collected during benchmarking**.

Typical metrics shown:

| KPI                   | Meaning                       |
| --------------------- | ----------------------------- |
| Avg API Latency       | average request response time |
| P95 Latency           | worst-case user experience    |
| Max Throughput        | requests handled per second   |
| Error Rate            | percentage of failed requests |
| Queue Processing Rate | worker throughput             |

### What the chart demonstrates

This figure provides a **high-level performance snapshot** of the backend system during stress testing.

It allows evaluators to quickly understand:

* how stable the system is
* whether the architecture can handle civic workloads
* whether latency and error rates remain within acceptable limits

---

# How to Use These Descriptions in Your Report

When writing captions, you can use a format like:

**Figure X: Complaint Ingestion Throughput**

> This graph illustrates the maximum complaint ingestion throughput achieved by the SwarajDesk backend under increasing concurrent user load. The results demonstrate the effectiveness of the Redis-based asynchronous queue architecture, which decouples request ingestion from downstream processing tasks such as AI inference and database persistence.


