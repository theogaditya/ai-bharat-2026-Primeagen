# SwarajDesk: Grievance Redressal Platform - Design Document

## System Overview

SwarajDesk is a full-stack, AI-augmented grievance redressal platform designed to streamline civic complaint registration, validation, moderation, and automated routing.

The system integrates:

- **AI-powered image validation and categorization**
- **Multilingual abuse detection**
- **RAG-based voice assistance**
- **Queue-driven backend processing**
- **Scalable microservices deployed across Amazon EKS and EC2 Auto Scaling Groups**

## 1. Architectural Model

The platform follows a hybrid compute architecture:

- **Stateless backend APIs deployed on Amazon EKS**
- **Compute-intensive AI inference services deployed on EC2 Auto Scaling Groups**
- **Secure inter-service communication within a private VPC**


### 1.1 Architecture Context

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SwarajDesk Platform                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐                                                   │
│  │   user-fe    │                                                   │
│  │  (Next.js)   │                                                   │
│  └──────┬───────┘                                                   │
│         │ HTTPS                                                     │
│         ▼                                                           │
│  ┌────────────────────┐                                             │
│  │ Application Load   │                                             │
│  │ Balancer (Public)  │                                             │
│  └─────────┬──────────┘                                             │
│            ▼                                                        │
│  ┌────────────────────────────────────────────┐                     │
│  │              EKS Cluster                   │                     │
│  │                                            │                     │
│  │  ┌──────────────┐   ┌──────────────┐       │                     │
│  │  │   user-be    │   │   admin-be   │       │                     │
│  │  │  (Express)   │   │  (Express)   │       │                     │
│  │  └──────┬───────┘   └──────┬───────┘       │                     │
│  │         │                  │               │                     │
│  │         └──────Internal Service Calls──────┘                     │
│  └─────────┬──────────────────────────────────┘                     │
│            │                                                        │
│            ▼                                                        │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │             AI Inference Layer (EC2 ASGs)                  │     │
│  │                                                            │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │     │
│  │  │ Vision Model │  │ Abuse Model  │  │ Voice Assist │      │     │
│  │  │  ASG (2–10)  │  │  ASG (2–8)   │  │  ASG (2–6)   │      │     │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │     │
│  │        ▲                ▲                ▲                 │     │
│  │        └──────Internal Load Balancer─────┘                 │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Data & Queue Layer                                          │    │
│  │  - PostgreSQL                                               │    │
│  │  - Redis                                                    │    │
│  │  - compQueue (Complaint Queue)                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```


## 2. Component Design

### 2.1 Vision Model (Hybrid VLM + ViT)

#### 2.1.1 Architecture


```
┌───────────────────────────────────────────────────────────── ┐
│                    Vision Model Pipeline                     │
├───────────────────────────────────────────────────────────── ┤
│                                                              │
│  Input: Image (Upload or CDN URL)                            │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────┐                                        │
│  │ Image Processor  │                                        │
│  │ - Normalize      │                                        │
│  │ - Resize         │                                        │
│  │ - Transform      │                                        │
│  └────────┬─────────┘                                        │
│           │                                                  │
│           ├─────────────────┬────────────────┐               │
│           ▼                 ▼                ▼               │
│  ┌────────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  VLM Primary   │  │ViT Guard    │  │ViT Guard    │        │
│  │                │  │(Infra)      │  │(Education)  │        │
│  │ 20 Sectors     │  │Specialized  │  │Specialized  │        │
│  └────────┬───────┘  └──────┬──────┘  └──────┬──────┘        │
│           │                 │                │               │
│           └─────────────────┼────────────────┘               │
│                             ▼                                │
│                    ┌─────────────────┐                       │
│                    │ Decision Engine │                       │
│                    │ - Compare scores│                       │
│                    │ - Apply rules   │                       │
│                    │ - Select source │                       │
│                    └────────┬────────┘                       │
│                             ▼                                │
│  Output: {sector, category, is_valid, confidence, source}    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 2.1.2 Component Details

**Image Processor**
- Accepts multipart/form-data uploads or JSON with image_url
- Downloads images from CDN URLs using requests library
- Normalizes images to RGB format
- Applies torchvision transforms (resize, normalize)
- Validates file size (<10MB) and format (jpg, png, webm)

**VLM Primary Classifier**
- Input: Preprocessed image + structured prompt
- Output: JSON with sector and category predictions
- Confidence: Implicit (1.0 for valid predictions)
- Coverage: All 20 civic sectors

**ViT Guard Models**
- Specialized models for:
  - Infrastructure (potholes, roads, bridges)
  - Education (schools, facilities)
  - Environment (pollution, waste)
- Input: Transformed image tensors
- Output: Class probabilities with softmax
- Threshold: 0.75 confidence for override



#### 2.1.4 Performance Optimizations

- Lazy loading of ViT models (load on first request)
- Image caching for CDN URLs (5-minute TTL)
- Batch processing support for multiple images
- GPU acceleration (optional, falls back to CPU)
- Model quantization for faster inference

### 2.2 Abuse Detector Model

#### 2.2.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Abuse Detection Pipeline                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Input: User complaint text                                 │
│         │                                                    │
│         ▼
│  │ Toxicity Scorer  │                                        │
│  │ Threshold: 0.7   │                                        │
│  └────────┬─────────┘                                        │
│           │                                                  │
│           ├─────────No Abuse──────▶ Return original text    │
│           │                                                  │
│           ▼ Abuse Detected                                   │
│  ┌──────────────────┐                                        │
│  │ LLM Extractor    │                                        │
│  │                  │                                        │
│  │ Extract phrases  │                                        │
│  └────────┬─────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐                                        │
│  │ Span Constructor │                                        │
│  │ - Locate phrases │                                        │
│  │ - Calculate pos  │                                        │
│  │ - Mask text      │                                        │
│  └────────┬─────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  Output: {has_abuse, original_text, clean_text, spans}      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 2.2.2 Component Details

**Text Preprocessor**
- Normalizes Unicode characters
- Removes excessive whitespace
- Preserves original structure for span mapping
- Handles multilingual text (English, Hindi, Hinglish, Odia)

**Toxicity Scorer**
- Threshold: 0.7 (configurable)
- Output: Toxicity score (0.0 - 1.0)
- Languages: Multilingual support

**Span Constructor**
- Locates each phrase in original text using fuzzy matching
- Calculates start and end positions
- Generates masked version with "******"
- Preserves text length and structure
- Handles overlapping spans


#### 2.2.4 Severity Classification

| Severity | Toxicity Score | Examples |
|----------|---------------|----------|
| Low | 0.7 - 0.8 | Mild profanity, frustration |
| Medium | 0.8 - 0.9 | Strong profanity, insults |
| High | 0.9 - 1.0 | Hate speech, threats, slurs |

#### 2.2.5 Abuse Categories

- **Profanity**: Curse words, vulgar language
- **Hate Speech**: Discriminatory language
- **Threats**: Violent or intimidating language
- **Harassment**: Personal attacks
- **Sexual Content**: Inappropriate sexual references

#### 2.2.6 Error Handling

- Empty text → 400 Bad Request
- Text too long (>5000 chars) → 413 Payload Too Large
- JSON parsing error → Retry with simplified prompt

### 2.3 Voice Chat Assistant

#### 2.3.1 Architecture


```
┌─────────────────────────────────────────────────────────────┐
│              Voice Chat Assistant Pipeline                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Input: Audio file (mp3, wav, m4a, webm, ogg)               │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────┐                                        │
│  │ Audio Processor  │                                        │
│  │ - FFmpeg convert │                                        │
│  │ - Normalize      │                                        │
│  │ - Format to WAV  │                                        │
│  └────────┬─────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐                                        │
│  │ Speech-to-Text   │                                        │
│  │ (Multi-language) │                                        │
│  └────────┬─────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐                                        │
│  │ Language Detect  │                                        │
│  │ & Translate      │                                        │
│  │ (to English)     │                                        │
│  └────────┬─────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐                                        │
│  │ Query Embedder   │                                        │
│  └────────┬─────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐                                        │
│  │ Vector Search    │                                        │
│  │ (ChromaDB)       │                                        │
│  │                  │                                        │
│  │ Top-k=3 chunks   │                                        │
│  └────────┬─────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐                                        │
│  │ Context Filter   │                                        │
│  │ - Relevance check│                                        │
│  │ - Escalation     │                                        │
│  └────────┬─────────┘                                        │
│           │                                                  │
│           ├─────Out of Domain──▶ Escalate to support        │
│           │                                                  │
│           ▼ In Domain                                        │
│  ┌──────────────────┐                                        │
│  │ LLM Generator    │                                        │
│  │ RAG-grounded     │                                        │
│  └────────┬─────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐                                        │
│  │ Response Trans   │                                        │
│  │ (to target lang) │                                        │
│  └────────┬─────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐                                        │
│  │ Text-to-Speech   │                                        │
│  └────────┬─────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  Output: Audio file (mp3) + Text response                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```


**System Prompt Template**
```
You are a helpful assistant for SwarajDesk, a citizen grievance platform.

Rules:
1. Answer ONLY using the provided context
2. If context is insufficient, say "I need to escalate this to support"
3. Be concise and helpful
4. Provide step-by-step instructions when applicable
5. Never make up information

Context:
{retrieved_context}

User Query:
{user_query}

Response:
```

#### 2.3.4 Knowledge Base Categories

- Complaint Registration
- Status Tracking
- Account Management
- Password Reset
- Document Upload
- Payment Issues
- General Policies
- FAQ

#### 2.3.5 Error Handling

- Invalid audio format → 400 Bad Request
- Audio too large (>10MB) → 413 Payload Too Large
- ChromaDB connection error → Escalate to support

## 3. Integration Design

### 3.1 Complaint Registration Flow

```
┌─────────────────────────────────────────────────────────────┐
│           Automatic Complaint Registration Flow             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User uploads image                                      │
│         │                                                   │
│         ▼                                                   │
│  2. Vision Model validates & categorizes                    │
│         │                                                   │
│         ├─────Invalid──────▶ Reject & request new image     │
│         │                                                   │
│         ▼ Valid                                             │
│  3. Image sent to Vertex AI for standardization             │
│         │                                                   │
│         ▼                                                   │
│  4. Auto-fill AI generates form data                        │
│         │                                                   │
│         ▼                                                   │
│  5. Form submitted to user-be                               │
│         │                                                   │
│         ▼                                                   │
│  6. Complaint queued in compQueue                           │
│         │                                                   │
│         ▼                                                   │
│  7. PostgreSQL & Redis updated                              │
│         │                                                   │
│         ▼                                                   │
│  8. Auto-assign engine routes to agent                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│            Manual Complaint Registration Flow               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User uploads image                                      │
│         │                                                   │
│         ▼                                                   │
│  2. Vision Model validates & categorizes                    │
│         │                                                   │
│         ├─────Invalid──────▶ Reject & request new image     │
│         │                                                   │
│         ▼ Valid                                             │
│  3. User fills form manually                                │
│         │                                                   │
│         ▼                                                   │
│  4. Abuse Detector scans text                               │
│         │                                                   │
│         ├─────Has Abuse────▶ Sanitize & flag                │
│         │                                                   │
│         ▼                                                   │
│  5. Image sent to Vertex AI for standardization             │
│         │                                                   │
│         ▼                                                   │
│  6. Form submitted to user-be                               │
│         │                                                   │
│         ▼                                                   │
│  7. Complaint queued in compQueue                           │
│         │                                                   │
│         ▼                                                   │
│  8. PostgreSQL & Redis updated                              │
│         │                                                   │
│         ▼                                                   │
│  9. Auto-assign engine routes to agent                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Voice Assistance Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Voice Assistance Integration                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Trigger Points:                                            │
│  - Before complaint filing (guidance)                       │
│  - During tracking queries                                  │
│  - During voice complaint submission                        │
│                                                             │
│  Flow:                                                      │
│  1. User clicks voice button in user-fe                     │
│  2. Frontend records audio                                  │
│  3. Audio sent to Voice Assistant API                       │
│  4. STT → Embed → ChromaDB → LLM → TTS                      │
│  5. Audio response played in frontend                       │
│  6. Text response displayed as fallback                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Offline-First Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Offline Sync Mechanism                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Online Mode:                                               │
│  - Direct API calls to AI models                            │
│  - Real-time validation and processing                      │
│                                                             │
│  Offline Mode:                                              │
│  1. Complaint saved to IndexedDB with temp ID               │
│  2. Image stored as base64 in local storage                 │
│  3. Background worker monitors connectivity                 │
│  4. On reconnect:                                           │
│     a. POST batch sync to user-be                           │
│     b. Server processes through AI pipeline                 │
│     c. Returns permanent IDs                                │
│     d. Local mapping updated                                │
│     e. User notified of sync completion                     │
│                                                             │
│  Conflict Resolution:                                       │
│  - Server timestamp wins                                    │
│  - Duplicate detection via image hash                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Blockchain Integration

```
┌─────────────────────────────────────────────────────────────┐
│           Blockchain Recording for AI Decisions             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Event: Complaint status change                             │
│         │                                                   │
│         ▼                                                   │
│  Payload:                                                   │
│  {                                                          │
│    "complaintId": "uuid-12345",                             │
│    "previousStatus": "REGISTERED",                          │
│    "actorId": "agent-uuid",                                 │
│    "aiDecisions": {                                         │
│      "visionModel": {                                       │
│        "category": "potholes",                              │
│      },                                                     │
│      "abuseDetector": {                                     │
│        "hasAbuse": false,                                   │
│      }                                                      │
│    }                                                        │
│  }                                                          │
│         │                                                   │
│         ▼                                                   │
│  Hash stored via Solidity Ethereum blockchain framework     |
|  smart contract                                             │
│  Images and documents stored on IPFS cloud storage          │
│  Immutable audit trail for transparency                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```


## 4. Deployment Architecture

### 4.1 Infrastructure

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AWS INFRASTRUCTURE ARCHITECTURE                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Infrastructure as Code (Terraform)                                 │
│  - VPC, Subnets (Public/Private)                                    │
│  - Security Groups                                                  │
│  - EKS Cluster                                                      │
│  - EC2 Auto Scaling Groups                                          │
│  - IAM Roles                                                        │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                        Amazon VPC                            │   │
│  │                                                              │   │
│  │  ┌───────────────────────────────┐                           │   │
│  │  │           EKS Cluster         │                           │   │
│  │  │                               │                           │   │
│  │  │  ┌──────────────┐  ┌────────┐ │                           │   │
│  │  │  │ user-be Pod  │  │ admin  │ │                           │   │
│  │  │  │ (Express)    │  │ -be Pod│ │                           │   │
│  │  │  └──────┬───────┘  └────┬───┘ │                           │   │
│  │  │         │               │     │                           │   │
│  │  │         └───────Internal Service Calls──────┐             │   │
│  │  │                                             ▼             │   │
│  │  │                                   Kubernetes Service      │   │
│  │  │                                   (ClusterIP)             │   │
│  │  └───────────────────────────────────────────────────────────┘   │
│  │                                                              │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │              EC2 Auto Scaling Groups                   │  │   │
│  │  │                                                        │  │   │
│  │  │  ┌──────────────┐   ┌──────────────┐   ┌────────────┐  │  │   │
│  │  │  │ Vision Model │   │ Abuse Model  │   │ Voice Model│  │  │   │
│  │  │  │ EC2 (GPU opt)│   │ EC2 t3/t4g   │   │ EC2 c6i    │  │  │   │
│  │  │  │ ASG 2–10     │   │ ASG 2–8      │   │ ASG 2–6    │  │  │   │
│  │  │  └──────┬───────┘   └──────┬───────┘   └────┬───────┘  │  │   │
│  │  │         │                  │                │          │  │   │
│  │  │         └─────Behind Internal ALB───────────┘          │  │   │
│  │  │                (AI Inference Load Balancer)            │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  │                                                              │   │
│  │  Communication Flow:                                         │   │
│  │  user-be/admin-be (EKS) → Internal ALB → AI EC2 Instances    │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Supporting AWS Services:                                           │
│                                                                     │
│  - Amazon ECR (Docker images for EKS backends)                      │
│  - Amazon S3 (Model weights, audio temp files)                      │
│  - Amazon Secrets Manager (API keys, DB creds)                      │
│  - Amazon CloudWatch (Logs, metrics, scaling alarms)                │
│                                                                     │
│  Optional External Storage:                                         │
│  - IPFS (Complaint images & documents)                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Auto-Scaling Configuration

**Vision Model**
- Min instances: 2
- Max instances: 10
- Scale up: CPU > 70% for 2 minutes
- Scale down: CPU < 30% for 5 minutes
- Target tracking: 60% CPU utilization

**Abuse Detector**
- Min instances: 2
- Max instances: 8
- Scale up: CPU > 60% for 2 minutes
- Scale down: CPU < 25% for 5 minutes
- Target tracking: 50% CPU utilization

**Voice Assistant**
- Min instances: 2
- Max instances: 6
- Scale up: CPU > 75% for 2 minutes
- Scale down: CPU < 35% for 5 minutes
- Target tracking: 65% CPU utilization



## 5. Security Considerations

### 5.1 Input Validation

- Image size limits: 10MB max
- Audio size limits: 10MB max
- Text length limits: 5000 characters max
- File type validation (whitelist)
- Content-Type verification
- Rate limiting per IP


### 5.2 Model Security

- Model weights stored in private S3 buckets
- Access control via IAM roles
- Model versioning and rollback capability
- Regular security audits

### 5.3 IPFS Cloud Storage

- Complaint images and documents stored on IPFS
- Content-addressed storage for immutability
- Distributed storage across IPFS nodes
- CID (Content Identifier) stored in PostgreSQL
- Gateway access for file retrieval
