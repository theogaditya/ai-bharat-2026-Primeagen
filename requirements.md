# SwarajDesk - AI-Powered Citizen Grievance Redressal Platform
## Requirements Document

## 1. Executive Summary

SwarajDesk is a comprehensive, AI-powered citizen grievance redressal platform designed to streamline the process of lodging, tracking, and resolving public complaints. The system integrates advanced AI models for automatic complaint categorization, content moderation, and multilingual citizen assistance, while providing separate interfaces for citizens and administrators with real-time updates, intelligent routing, and powerful analytics.

## 2. Problem Statement

Traditional grievance redressal systems face critical challenges:

- **Manual Processing Bottlenecks**: Manual complaint categorization is time-consuming, error-prone, and creates significant delays
- **Citizen Accessibility Barriers**: Complex form-filling processes discourage complaint submission, especially for non-literate or differently-abled citizens
- **Content Moderation Issues**: Abusive or toxic language in complaints creates processing difficulties and delays resolution
- **Language Barriers**: Lack of multilingual support prevents effective citizen engagement across diverse populations
- **Incomplete Submissions**: Absence of real-time guidance leads to incomplete or incorrect complaint submissions
- **Image Interpretation Overhead**: Image-based complaints require manual interpretation and validation
- **Connectivity Challenges**: Rural areas with poor internet connectivity struggle with online complaint submission
- **Transparency Gaps**: Citizens lack visibility into complaint status and resolution progress
- **Assignment Inefficiencies**: Manual complaint routing leads to unbalanced workloads and delayed responses
- **SLA Violations**: Lack of automated escalation mechanisms results in missed deadlines

## 3. Goals and Objectives

### 3.1 Primary Goals

- Automate complaint image analysis and categorization across 20 civic sectors with >90% accuracy
- Detect and sanitize abusive content while preserving complaint intent
- Provide multilingual voice and text-based citizen assistance in English, Hindi, and Hinglish
- Enable automatic form-filling from uploaded images to reduce submission time by 70%
- Support offline-first architecture with seamless synchronization for rural connectivity
- Implement intelligent auto-assignment engine for balanced workload distribution
- Provide real-time complaint tracking with WebSocket-based updates
- Ensure blockchain-backed transparency and audit trails for all AI decisions

### 3.2 Secondary Goals

- Reduce average complaint processing time from 7 days to 2 days
- Improve citizen satisfaction score from 60% to 85%
- Enable accessibility for non-literate citizens through voice interfaces
- Achieve 99.5% system uptime with horizontal scaling
- Support 10,000+ complaints per day with <3 second response times
- Implement gamification to encourage civic participation
- Provide comprehensive analytics dashboards for administrators

### 3.3 Success Metrics

- 90%+ accuracy in AI-powered complaint categorization
- 70% reduction in complaint submission time
- 50% reduction in manual assignment overhead
- 95%+ citizen satisfaction with voice assistance
- 99.5% uptime across all services
- <3 second average API response time
- Zero data loss during offline-to-online sync

## 4. Stakeholders

### 4.1 Primary Stakeholders


- **Citizens**: Urban and rural residents filing civic complaints
- **Agents**: Ground-level workers assigned to resolve complaints
- **Municipal Admins**: City/district-level administrators managing local complaints
- **State Admins**: State-level administrators overseeing regional operations
- **Super Admins**: System-wide administrators with full access

### 4.2 Secondary Stakeholders

- **Government Bodies**: Policy makers and civic authorities
- **System Administrators**: Technical team managing infrastructure
- **Data Analysts**: Teams analyzing complaint trends and patterns

## 5. User Stories

### 5.1 Citizen User Stories

**US-C1: Automatic Complaint Form Filling**
- **As a** citizen
- **I want to** upload an image of a civic issue and have the complaint form automatically filled
- **So that** I can submit complaints quickly without manual data entry
- **Acceptance Criteria**:
  - Image upload triggers AI analysis within 3 seconds
  - Form fields (category, sector, description) are auto-populated
  - User can review and edit auto-filled data before submission
  - System shows confidence score for categorization

**US-C2: Image Validation and Rejection**
- **As a** citizen
- **I want** the system to validate my uploaded image and reject irrelevant images
- **So that** I submit only valid civic issue complaints
- **Acceptance Criteria**:
  - System validates image within 2 seconds of upload
  - Invalid images (personal photos, non-civic content) are rejected with clear reason
  - User receives immediate feedback with validation status
  - System suggests re-upload with guidance

**US-C3: Voice-Based Assistance**
- **As a** citizen who is not comfortable with text
- **I want to** interact with the system using voice in my preferred language
- **So that** I can get help without typing
- **Acceptance Criteria**:
  - Voice button is prominently displayed on all forms
  - System supports English, Hindi, and Hinglish
  - Voice transcription appears in real-time
  - AI responses are played back in audio format
  - Transcription accuracy is >85%

**US-C4: Offline Complaint Submission**
- **As a** citizen in a rural area with poor connectivity
- **I want to** save my complaint offline and have it sync automatically when online
- **So that** I don't lose my complaint data due to network issues
- **Acceptance Criteria**:
  - Complaint is saved to local storage immediately
  - Offline indicator is clearly visible
  - Auto-sync triggers within 30 seconds of reconnection
  - User receives notification of successful sync
  - No data loss during offline-to-online transition

**US-C5: Real-Time Complaint Tracking**
- **As a** citizen
- **I want to** track my complaint status in real-time
- **So that** I know the progress and estimated resolution time
- **Acceptance Criteria**:
  - Dashboard shows all submitted complaints with status
  - Status updates appear instantly via WebSocket
  - Timeline shows all status changes with timestamps
  - Estimated resolution time is displayed
  - Notifications for major status changes

**US-C6: Content Sanitization**
- **As a** citizen who may use strong language due to frustration
- **I want** the system to clean my complaint text while preserving my intent
- **So that** my complaint is not rejected
- **Acceptance Criteria**:
  - Abusive content is detected and masked automatically
  - Original complaint intent is preserved
  - User is notified of content sanitization
  - Sanitized text is shown for review before submission

### 5.2 Agent User Stories

**US-A1: Automatic Complaint Assignment**
- **As an** agent
- **I want** complaints to be automatically assigned based on my expertise and workload
- **So that** I receive relevant complaints without manual routing
- **Acceptance Criteria**:
  - Complaints matching agent's sector expertise are auto-assigned
  - Workload is balanced across available agents
  - Agent receives notification of new assignment within 10 seconds
  - Assignment considers geographic proximity

**US-A2: Complaint Details with AI Insights**
- **As an** agent
- **I want to** see AI categorization details and confidence scores
- **So that** I can verify accuracy and understand the complaint better
- **Acceptance Criteria**:
  - AI decision metadata is displayed (sector, category, confidence)
  - Flagged abusive content is highlighted with severity
  - Original and sanitized text are both visible
  - Agent can override AI categorization if incorrect

### 5.3 Administrator User Stories

**US-AD1: Multi-Tier Dashboard Access**
- **As an** administrator (Municipal/State/Super)
- **I want** role-based dashboard access with relevant metrics
- **So that** I can monitor complaints within my jurisdiction
- **Acceptance Criteria**:
  - Dashboard shows only complaints within jurisdiction
  - Real-time statistics update automatically
  - Heatmaps show complaint distribution geographically
  - Sector-wise breakdown is available

**US-AD2: Manual Escalation**
- **As an** administrator
- **I want to** manually escalate high-priority complaints
- **So that** critical issues receive immediate attention
- **Acceptance Criteria**:
  - Escalation button is available on complaint details
  - Reason for escalation must be provided
  - Escalation is logged in blockchain
  - Relevant parties are notified immediately

**US-AD3: Analytics and Reporting**
- **As an** administrator
- **I want** comprehensive analytics on complaint trends
- **So that** I can identify systemic issues and allocate resources
- **Acceptance Criteria**:
  - Charts show complaint volume over time
  - Sector-wise distribution is visualized
  - Average resolution time is calculated
  - Agent performance metrics are available
  - Export functionality for reports


## 6. System Architecture Requirements

### 6.1 Frontend Applications

#### 6.1.1 User Frontend (Next.js - Port 3002)


**FR-UF-1: Complaint Registration Interface**
- System MUST provide intuitive complaint registration form
- System MUST support automatic and manual form-filling modes
- System MUST display real-time image validation feedback
- System MUST show form auto-fill progress indicators
- System MUST support drag-and-drop image upload
- System MUST support camera capture on mobile devices
- System MUST display image preview before submission

**FR-UF-2: Voice Interaction**
- System MUST provide voice button for audio recording
- System MUST display voice transcription in real-time
- System MUST play AI-generated voice responses
- System MUST support language selection (English/Hindi/Hinglish)
- System MUST handle audio formats: mp3, wav, m4a, webm, ogg

**FR-UF-3: Offline Support**
- System MUST save incomplete complaints to IndexedDB when offline
- System MUST display offline status indicator
- System MUST show sync progress when connection restored
- System MUST notify users of successful sync completion
- System MUST compress images before offline storage (max 2MB)

**FR-UF-4: Real-Time Updates**
- System MUST connect to WebSocket server (Port 3001) for live updates
- System MUST display complaint status changes in real-time
- System MUST show notifications for agent responses
- System MUST update complaint tracking dashboard automatically

**FR-UF-5: Complaint Tracking Dashboard**
- System MUST provide dashboard showing all user complaints
- System MUST display complaint status with visual indicators
- System MUST show estimated resolution time
- System MUST provide complaint history and timeline
- System MUST support filtering and sorting

**FR-UF-6: Gamification**
- System MUST display earned badges for civic participation
- System MUST show user contribution statistics
- System MUST provide achievement notifications
- System MUST track complaint resolution impact

#### 6.1.2 Admin Frontend (Next.js - Port 3003)

**FR-AF-1: Multi-Tier Dashboard**
- System MUST provide role-based dashboards for:
  - Super Admin (system-wide view)
  - State Admin (state-level view)
  - Municipal Admin (municipal-level view)
  - Agent (assigned complaints view)
- System MUST enforce role-based access control
- System MUST display jurisdiction-specific data only

**FR-AF-2: Complaint Management**
- System MUST display available complaints for assignment
- System MUST show assigned complaints with priority indicators
- System MUST provide filtering by sector, status, priority, location
- System MUST support bulk complaint operations
- System MUST allow manual assignment to agents
- System MUST show agent workload and availability

**FR-AF-3: Analytics Dashboard**
- System MUST display real-time complaint statistics
- System MUST show heatmaps of complaint locations using Google Maps
- System MUST provide sector-wise complaint distribution charts
- System MUST display resolution time analytics
- System MUST show agent performance metrics
- System MUST support date range filtering
- System MUST provide export functionality (CSV, PDF)


**FR-AF-4: Chat System**
- System MUST provide direct chat with citizens
- System MUST display chat history for each complaint
- System MUST support file attachments in chat
- System MUST show typing indicators and read receipts
- System MUST support real-time message delivery

**FR-AF-5: AI Decision Review**
- System MUST display AI categorization decisions with confidence scores
- System MUST show flagged abusive content with severity levels
- System MUST allow manual override of AI decisions
- System MUST provide feedback mechanism for AI improvements
- System MUST show original and sanitized text side-by-side

**FR-AF-6: Escalation Management**
- System MUST display escalated complaints prominently
- System MUST show SLA deadline warnings with countdown
- System MUST provide escalation history and audit trail
- System MUST allow manual escalation with mandatory reason
- System MUST highlight complaints approaching SLA breach

### 6.2 Backend Services

#### 6.2.1 User Backend (Express.js - Port 3000)

**FR-UB-1: Complaint Submission API**
- System MUST provide REST API for complaint submission
- System MUST validate complaint data before processing
- System MUST integrate with AI models for image validation
- System MUST integrate with abuse detection for text moderation
- System MUST return complaint ID and initial status
- System MUST enqueue complaint to Redis for processing

**FR-UB-2: WebSocket Server (Port 3001)**
- System MUST maintain WebSocket connections for real-time updates
- System MUST broadcast complaint status changes to connected clients
- System MUST handle connection drops and reconnection gracefully
- System MUST authenticate WebSocket connections using JWT
- System MUST support room-based messaging (per user/complaint)

**FR-UB-3: Offline Sync Ingestion**
- System MUST accept batch complaint submissions from offline clients
- System MUST process each offline complaint through AI pipeline
- System MUST return mapping of temporary IDs to permanent IDs
- System MUST handle duplicate detection via image hashing
- System MUST support conflict resolution with server timestamp priority

**FR-UB-4: User Authentication**
- System MUST implement JWT-based authentication
- System MUST support user registration with email/phone verification
- System MUST provide password reset functionality
- System MUST implement session management with Redis
- System MUST support OAuth integration (Google, Facebook)

**FR-UB-5: Complaint Tracking API**
- System MUST provide API to fetch user's complaint history
- System MUST return complaint status and timeline
- System MUST provide estimated resolution time based on SLA
- System MUST support pagination for large result sets
- System MUST cache frequently accessed data in Redis

#### 6.2.2 Admin Backend (Express.js - Port 3002)

**FR-AB-1: Assignment APIs**
- System MUST provide API for manual complaint assignment
- System MUST support bulk assignment operations
- System MUST validate agent availability before assignment
- System MUST update Redis queue on assignment
- System MUST prevent double assignment using distributed locks
- System MUST log all assignment decisions


**FR-AB-2: Escalation APIs**
- System MUST provide API for manual escalation
- System MUST log escalation reasons and actors
- System MUST trigger blockchain recording on escalation
- System MUST notify relevant administrators via email and WebSocket
- System MUST update escalation level in PostgreSQL
- System MUST prevent duplicate escalations

**FR-AB-3: Dashboard Metrics API**
- System MUST provide aggregated complaint statistics
- System MUST return sector-wise distribution data
- System MUST calculate average resolution times
- System MUST provide agent performance metrics
- System MUST cache metrics with 5-minute TTL in Redis
- System MUST support real-time metric updates

**FR-AB-4: Admin Authentication**
- System MUST implement role-based access control (RBAC)
- System MUST support multi-tier admin hierarchy
- System MUST validate permissions for each API call
- System MUST log all admin actions for audit
- System MUST support jurisdiction-based data filtering

**FR-AB-5: Chat API**
- System MUST provide API for admin-citizen chat
- System MUST store chat messages in PostgreSQL
- System MUST allow file attachments (images, documents)
- System MUST support message read receipts

#### 6.2.3 Complaint Queue Service (Express.js - Port 3005)

**FR-CQ-1: Asynchronous Processing**
- System MUST process complaints asynchronously using Redis queue
- System MUST handle AI model integration (Vision, Abuse, Vertex AI)
- System MUST update PostgreSQL with processing results
- System MUST handle processing failures with exponential backoff retry
- System MUST support priority-based queue processing

**FR-CQ-2: Database Updates**
- System MUST update complaint status in PostgreSQL atomically
- System MUST store AI decision metadata (sector, category, confidence)
- System MUST record abuse detection results
- System MUST maintain complaint processing history
- System MUST implement transaction rollback on failures

**FR-CQ-3: Redis Queue Management**
- System MUST enqueue complaints for processing
- System MUST dequeue complaints based on priority (high/medium/low)
- System MUST handle queue overflow gracefully
- System MUST provide queue monitoring metrics
- System MUST implement dead letter queue for failed processing

**FR-CQ-4: Auto-Assignment Engine**
- System MUST automatically assign complaints to agents based on:
  - Sector/category expertise matching
  - Current workload (number of active complaints)
  - Geographic location proximity
- System MUST balance load across available agents
- System MUST respect agent capacity limits (max 10 active complaints)
- System MUST log assignment decisions with reasoning
- System MUST use round-robin within matched agents

**FR-CQ-5: SLA Monitoring**
- System MUST track complaint age against SLA deadlines
- System MUST calculate time remaining for each complaint
- System MUST flag complaints approaching SLA breach (80% elapsed)
- System MUST trigger escalation for SLA violations

**FR-CQ-6: Escalation Triggers**
- System MUST run scheduled jobs every 5 minutes to scan complaints
- System MUST escalate complaints when:
  - Current time > SLA deadline
  - No agent action for 24 hours (high priority) / 48 hours (medium/low)
  - Citizen manually requests escalation
  - High severity complaints not assigned within 1 hour
- System MUST log escalation events with timestamp and reason
- System MUST write escalation to blockchain for audit trail
- System MUST notify administrators via email

#### 6.2.4 Self Service (AI Gateway - Express.js - Port 3030)

**FR-SS-1: AI Model Orchestration**
- System MUST route requests to appropriate AI models
- System MUST handle Vision Model integration for image classification
- System MUST handle Abuse Detector integration for text moderation
- System MUST handle Voice Assistant integration for chat
- System MUST implement circuit breaker pattern for model failures
- System MUST provide unified error handling

**FR-SS-2: Image Analysis Pipeline**
- System MUST accept image uploads and CDN URLs
- System MUST call Vision Model for classification
- System MUST call Vertex AI for standardization
- System MUST generate auto-fill data from image analysis
- System MUST return structured response with confidence scores

### 6.3 Database Layer

#### 6.3.1 PostgreSQL Database (Port 5432)

**FR-DB-1: Complaint Schema**
- System MUST store complaint data with fields:
  - id (UUID primary key)
  - title (VARCHAR 200)
  - description (TEXT)
  - category (VARCHAR 100)
  - sector (VARCHAR 100)
  - status (ENUM: REGISTERED, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED)
  - location (POINT - lat/lng)
  - address (TEXT)
  - image_url (VARCHAR 500)
  - assigned_agent_id (foreign key to admins table)
  - escalation_level (INTEGER 0-3)

**FR-DB-3: User Schema**
- System MUST store user data:
  - id (UUID primary key)
  - email (VARCHAR 255 unique)
  - phone (VARCHAR 15 unique)
  - name (VARCHAR 200)
  - password_hash (VARCHAR 255)
  - location (POINT)
  - badges (JSONB array)
  - created_at, last_login (TIMESTAMP)

**FR-DB-4: Admin Schema**
- System MUST store admin data:
  - id (UUID primary key)
  - email (VARCHAR 255 unique)
  - name (VARCHAR 200)
  - role (ENUM: SUPER_ADMIN, STATE_ADMIN, MUNICIPAL_ADMIN, AGENT)
  - status (ENUM: ACTIVE, INACTIVE)
  - current_workload (INTEGER default 0)

**FR-DB-5: Chat Schema**
- System MUST store chat messages:
  - id (UUID primary key)
  - complaint_id (foreign key)
  - sender_id (UUID)
  - sender_type (ENUM: USER, ADMIN)
  - message (TEXT)
  - timestamp (TIMESTAMP)

### 6.4 Caching Layer

#### 6.4.1 Redis (Port 6379)

**FR-RC-1: Complaint Queue**
- System MUST use Redis lists for complaint processing queue
- System MUST support priority queues:
  - `queue:high` for high priority complaints
  - `queue:medium` for medium priority complaints
  - `queue:low` for low priority complaints
- System MUST implement queue persistence (AOF + RDB)
- System MUST handle queue operations atomically using MULTI/EXEC

**FR-RC-2: Session Caching**
- System MUST cache user sessions with key pattern: `session:{user_id}`
- System MUST implement session expiration (24 hours)
- System MUST support session invalidation on logout
- System MUST handle distributed sessions across multiple instances
- System MUST store JWT tokens and user metadata

**FR-RC-3: API Response Caching**
- System MUST cache frequently accessed data:
  - Complaint statistics: `stats:complaints` (5-minute TTL)
  - Sector/category lists: `config:sectors` (1-hour TTL)
  - User badges: `user:{id}:badges` (10-minute TTL)
  - Dashboard metrics: `metrics:admin:{id}` (5-minute TTL)
- System MUST invalidate cache on data updates
- System MUST implement cache warming for critical data on startup

**FR-RC-5: Real-Time Data (Pub/Sub)**
- System MUST use Redis Pub/Sub for WebSocket message broadcasting
- System MUST publish complaint status changes to channels:
  - `complaint:{id}:updates` for specific complaint updates
  - `user:{id}:notifications` for user notifications
  - `admin:{id}:notifications` for admin notifications
- System MUST subscribe to relevant channels per connection
- System MUST handle message delivery failures with retry

### 6.5 Auto-Escalation Engine

**FR-AE-1: Scheduled Scanning**
- System MUST run escalation checks every 5 minutes using cron job
- System MUST scan all active complaints (status: REGISTERED, ASSIGNED, IN_PROGRESS)
- System MUST calculate time elapsed since last status update
- System MUST identify complaints exceeding SLA thresholds
- System MUST process escalations in batches of 100 complaints
- System MUST log scan execution time and complaints processed

**FR-AE-2: SLA Thresholds**
- System MUST define SLA deadlines by priority:
  - High priority: 24 hours from creation
  - Medium priority: 72 hours from creation
  - Low priority: 168 hours (7 days) from creation
- System MUST calculate deadline from complaint creation timestamp
- System MUST account for business hours (optional configuration)
- System MUST adjust deadlines for weekends and holidays

**FR-AE-3: Escalation Levels**
- System MUST implement multi-level escalation:
  - Level 0: Initial assignment to agent (immediate)
  - Level 1: Escalate to Municipal Admin (SLA 50% elapsed)
  - Level 2: Escalate to State Admin (SLA 80% elapsed)
  - Level 3: Escalate to Super Admin (SLA 100% elapsed)
- System MUST prevent duplicate escalations using distributed locks
- System MUST track current escalation level in database
- System MUST allow manual escalation to skip levels

**FR-AE-5: Notification System**
- System MUST send email notifications for escalations
- System MUST send in-app notifications via WebSocket
- System MUST support SMS notifications (optional, for critical escalations)
- System MUST batch notifications to avoid email flooding

**FR-AE-6: Audit Logging**
- System MUST log all escalation decisions to audit_trail table
- System MUST record escalation criteria met (SLA percentage, time elapsed)
- System MUST store escalation actor (system/manual with admin ID)
- System MUST maintain escalation history per complaint
- System MUST provide API to retrieve escalation history
- System MUST support escalation analytics and reporting

### 6.6 Offline Complaint Registration

**FR-OR-1: Local Storage (IndexedDB)**
- System MUST save incomplete complaints to IndexedDB
- System MUST generate temporary complaint IDs (format: `temp-{uuid}`)
- System MUST store image data as base64 in IndexedDB
- System MUST preserve all form state (title, description, location, etc.)
- System MUST implement IndexedDB schema versioning
- System MUST handle storage quota exceeded errors gracefully

**FR-OR-2: Connectivity Detection**
- System MUST detect network connectivity changes using:
  - Navigator.onLine API
  - Periodic ping to health check endpoint
  - Service Worker fetch event monitoring
- System MUST display offline indicator in UI (banner or icon)
- System MUST use Service Worker for offline detection
- System MUST implement exponential backoff for reconnection attempts (1s, 2s, 4s, 8s, max 30s)


**FR-OR-3: Background Sync Worker**
- System MUST implement background worker for sync monitoring
- System MUST check connectivity every 30 seconds when offline
- System MUST trigger sync automatically within 30 seconds of reconnection
- System MUST handle partial sync failures (some complaints succeed, others fail)
- System MUST retry failed syncs with exponential backoff
- System MUST use Service Worker Background Sync API when available

**FR-OR-4: Batch Sync API**
- System MUST provide endpoint: `POST /api/complaints/batch-sync`
- System MUST accept array of offline complaints in request body
- System MUST process each complaint through full AI pipeline:
  1. Vision Model for image validation and categorization
  2. Abuse Detector for text moderation
  3. Vertex AI for standardization
  4. PostgreSQL insertion

- System MUST handle duplicate detection via image perceptual hashing
- System MUST process batch atomically (all or nothing per complaint)

**FR-OR-5: Conflict Resolution**
- System MUST detect conflicts when same complaint submitted multiple times
- System MUST use server timestamp as source of truth for conflict resolution
- System MUST merge complaint data when possible (combine descriptions)
- System MUST notify user of conflicts requiring manual resolution
- System MUST provide conflict resolution UI showing both versions
- System MUST log all conflict resolutions for audit

**FR-OR-8: Image Handling**
- System MUST compress images before storing offline (max 2MB per image)
- System MUST use client-side image compression (JPEG quality 80%)
- System MUST upload images to S3/CDN during sync
- System MUST update complaint with CDN URLs after upload
- System MUST handle image upload failures with retry (max 3 attempts)
- System MUST support multiple images per complaint (max 5 images)

**FR-OR-9: Offline Validation**
- System MUST perform client-side validation offline:
  - Required fields: title, description, location
  - Image format: jpg, png, webm only
  - Image size: max 10MB before compression
  - Description length: min 20 characters, max 1000 characters
- System MUST validate required fields before saving to IndexedDB
- System MUST show validation errors immediately
- System MUST prevent submission of invalid complaints

## 7. AI Models Requirements

### 7.1 Vision Model (Hybrid VLM + ViT)

**FR-VM-1: Image Classification**
- System MUST classify uploaded images into one of 20 predefined civic sectors
- System MUST provide sector, category, and validity status
- System MUST support both direct image uploads and CDN image URLs
- System MUST return confidence scores for predictions
- System MUST process images within 3 seconds


**FR-VM-2: Multi-Sector Support**
- System MUST support 20 civic sectors including:
  - Infrastructure (roads, bridges, potholes)
  - Education (schools, facilities)
  - Environment (pollution, waste)
  - Healthcare (hospitals, sanitation)
  - Safety (street lights, security)
  - Transportation (traffic, public transport)
  - Sanitation (garbage, drainage)
  - Water Supply, Electricity, Public Services, etc.

**FR-VM-3: Hybrid Validation**
- System MUST use VLM for primary classification
- System MUST use ViT for validation in critical sectors:
  - Infrastructure
  - Education
  - Environment
- System MUST override VLM predictions when ViT confidence > 0.75
- System MUST indicate prediction source in response

**FR-VM-4: Image Rejection**
- System MUST reject images not related to civic issues
- System MUST provide clear rejection reasons
- System MUST return `is_valid: false` for invalid images
- System MUST suggest corrective actions to user

### 7.2 Abuse Detection Model

**FR-AD-1: Multilingual Abuse Detection**
- System MUST detect abusive content in English, Hindi, Hinglish, and Odia
- System MUST identify toxic expressions at phrase level
- System MUST preserve non-abusive content unchanged
- System MUST process text within 2 seconds

**FR-AD-2: Content Sanitization**
- System MUST mask abusive phrases with "******"
- System MUST maintain original text structure and length
- System MUST preserve semantic intent of complaint
- System MUST provide both original and sanitized text

**FR-AD-3: Severity Classification**
- System MUST classify abuse severity: LOW, MEDIUM, HIGH
- System MUST provide confidence scores for each flagged span
- System MUST categorize abuse types: profanity, hate speech, threats, harassment


### 7.3 Voice Chat Assistant (RAG-Based)

**FR-VA-1: Multilingual Voice Support**
- System MUST support voice input in English, Hindi, and Hinglish
- System MUST accept audio formats: mp3, wav, m4a, webm, ogg
- System MUST convert speech to text 
- System MUST achieve >85% transcription accuracy

**FR-VA-2: Text-to-Speech Output**
- System MUST generate voice responses in user's preferred language
- System MUST return audio files in mp3 format
- System MUST support natural speech speed

**FR-VA-3: RAG Pipeline**
- System MUST retrieve relevant context from ChromaDB vector store
- System MUST answer ONLY from verified knowledge base
- System MUST retrieve top-3 relevant chunks

**FR-VA-4: Query Handling**
- System MUST handle queries about:
  - Complaint registration process
  - Status tracking
  - Password reset
  - Account management
  - General SwarajDesk policies

## 8. Integration Requirements

**FR-INT-1: API Endpoints**
- Vision Model MUST expose:
  - `POST /predict` (file upload)
  - `POST /predict-from-url` (CDN URL)
  - `GET /` (health check)
- Abuse Detector MUST expose:
  - `POST /api/v1/moderate`
- Voice Assistant MUST expose:
  - `POST /chat_swaraj` (text chat)
  - `POST /voice-chat` (voice interaction)

**FR-INT-3: Error Handling**
- All services MUST return structured error responses
- All services MUST log errors with context
- All services MUST handle network failures gracefully
- All services MUST implement circuit breaker pattern

## 9. Non-Functional Requirements

### 9.1 Performance

**NFR-P1: Throughput**
- Vision Model: ≥100 requests/minute
- Abuse Detector: ≥200 requests/minute
- Voice Assistant: ≥50 concurrent sessions
- User Backend: ≥500 requests/minute
- Admin Backend: ≥300 requests/minute

**NFR-P2: Latency**
- 95th percentile response time: <5 seconds
- Average response time: <3 seconds
- Database query time: <100ms for indexed queries
- Redis operations: <10ms

**NFR-P3: Accuracy**
- Vision Model classification: >90% accuracy
- Abuse Detector precision: >95%
- Voice Assistant STT: >85% accuracy
- Auto-assignment matching: >85% relevance

### 9.2 Scalability

**NFR-S1: Horizontal Scaling**
- All services MUST support stateless deployment
- All services MUST be containerizable using Docker
- All services MUST support load balancing
- System MUST handle 10x traffic spike within 5 minutes

**NFR-S2: Resource Efficiency**
- Vision Model: <4GB RAM per instance
- Abuse Detector: <2GB RAM per instance
- Voice Assistant: <3GB RAM per instance
- Backend services: <1GB RAM per instance

**NFR-S3: Data Volume**
- System MUST handle 10,000+ complaints per day
- System MUST support 100,000+ registered users
- System MUST store 1M+ complaints with <1s query time
- System MUST handle 1TB+ image storage

### 9.3 Reliability

**NFR-R1: Availability**
- System uptime: 99.5% (max 3.65 hours downtime/month)
- All services MUST implement health check endpoints
- All services MUST support graceful degradation
- System MUST recover from failures within 5 minutes

**NFR-R2: Fault Tolerance**
- All services MUST handle invalid inputs without crashing
- All services MUST implement retry logic (exponential backoff)
- All services MUST log all errors with context
- System MUST support automatic failover for databases

**NFR-R3: Data Integrity**
- Zero data loss during offline-to-online sync
- All database operations MUST be ACID compliant
- All critical operations MUST use transactions
- System MUST maintain data consistency across services

### 9.4 Security

**NFR-SEC1: Authentication & Authorization**
- All APIs MUST require JWT authentication
- All admin actions MUST enforce RBAC
- JWT tokens MUST expire after 24 hours
- System MUST support token refresh mechanism
- System MUST implement rate limiting per user

**NFR-SEC2: Data Privacy**
- AI models MUST NOT store user images permanently
- AI models MUST NOT log sensitive user data
- All logs MUST be sanitized to remove PII
- System MUST comply with GDPR and data protection regulations
- System MUST support user data deletion requests

**NFR-SEC3: API Security**
- All APIs MUST implement CORS policies
- All APIs MUST validate input data
- All APIs MUST use environment variables for secrets
- All APIs MUST use HTTPS only (TLS 1.2+)
- System MUST implement SQL injection prevention

**NFR-SEC4: Blockchain Security**
- All escalation events MUST be recorded on blockchain
- Blockchain hashes MUST be immutable
- System MUST use Solidity Ethereum blockchain framework for blockchain
- System MUST use IPFS cloud storage for decentralized file storage
- Smart contracts MUST be audited for vulnerabilities

### 9.5 Maintainability

**NFR-M1: Code Quality**
- All code MUST follow modular architecture
- All code MUST include comprehensive documentation
- All Python code MUST use type hints
- All JavaScript/TypeScript code MUST use TypeScript
- Code coverage MUST be >80%

**NFR-M2: Monitoring & Observability**
- All services MUST expose metrics endpoints (Prometheus format)
- All services MUST log request/response metadata

**NFR-M3: Deployment**
- All services MUST be deployable on AWS EC2
- All services MUST support deployment on Ubuntu 22.04
- All services MUST include deployment documentation
- System MUST support automated rollback on failures

### 9.6 Usability

**NFR-U1: User Interface**
- UI MUST be responsive (mobile, tablet, desktop)
- UI MUST support accessibility standards (WCAG 2.1 Level AA)
- UI MUST support RTL languages (future)
- UI MUST load within 3 seconds on 3G connection
- UI MUST work offline with Service Worker

**NFR-U2: Internationalization**
- System MUST support English, Hindi, Hinglish
- System MUST support future language additions
- All UI text MUST be externalized (i18n)
- Date/time formats MUST respect user locale


## 10. Acceptance Criteria

### 10.1 Vision Model

- AC-VM-1: Successfully classifies pothole images as "Infrastructure > potholes" with >90% accuracy
- AC-VM-2: Rejects non-civic images (personal photos, animals) with `is_valid: false`
- AC-VM-3: Provides confidence scores >0.85 for valid classifications
- AC-VM-4: Handles both file uploads and CDN URLs correctly
- AC-VM-5: Returns responses in <3 seconds for 95% of requests
- AC-VM-6: ViT override works correctly for Infrastructure sector

### 10.2 Abuse Detector

- AC-AD-1: Detects and masks profanity in English, Hindi, and Hinglish
- AC-AD-2: Preserves non-abusive content unchanged
- AC-AD-3: Provides accurate span information (start, end positions within ±2 characters)
- AC-AD-4: Classifies severity correctly (low/medium/high) with >90% accuracy
- AC-AD-5: Returns responses in <2 seconds for 95% of requests
- AC-AD-6: False positive rate <5%

### 10.3 Voice Assistant

- AC-VA-1: Transcribes voice queries accurately (>85%) in English, Hindi, Hinglish
- AC-VA-2: Generates voice responses in requested language
- AC-VA-3: Answers queries using only verified knowledge base (zero hallucinations)
- AC-VA-4: Escalates out-of-domain queries with appropriate URLs
- AC-VA-5: Handles all supported audio formats (mp3, wav, m4a, webm, ogg)
- AC-VA-6: Returns responses in <5 seconds for 90% of requests

### 10.4 Offline Complaint Registration

- AC-OR-1: Complaints saved offline are synced successfully with 100% data integrity
- AC-OR-2: Offline indicator appears within 1 second of connectivity loss
- AC-OR-3: Sync triggers automatically within 30 seconds of reconnection
- AC-OR-4: Batch sync processes 10 complaints in <30 seconds
- AC-OR-5: Duplicate detection prevents duplicate submissions
- AC-OR-6: User receives clear notification of sync status

### 10.5 Auto-Escalation Engine

- AC-AE-1: Escalation triggers correctly at 50%, 80%, 100% SLA thresholds
- AC-AE-2: Notifications sent to all relevant parties within 1 minute
- AC-AE-3: Blockchain records created for all escalations
- AC-AE-4: No duplicate escalations occur
- AC-AE-5: Escalation scan completes in <30 seconds for 1000 complaints
- AC-AE-6: Manual escalation overrides automatic escalation correctly

### 10.6 Auto-Assignment Engine

- AC-AA-1: Complaints assigned to agents with matching sector expertise
- AC-AA-2: Workload balanced across agents (variance <20%)
- AC-AA-3: Geographic proximity considered in assignment
- AC-AA-4: Agent capacity limits respected (max 20 active complaints)
- AC-AA-5: Assignment completes within 10 seconds of complaint registration
- AC-AA-6: Assignment decisions logged with reasoning

### 10.7 Real-Time Updates

- AC-RT-1: WebSocket connections established within 2 seconds
- AC-RT-2: Status updates appear in UI within 1 second of change
- AC-RT-3: Reconnection handled gracefully with no message loss
- AC-RT-4: Notifications delivered to correct users only
- AC-RT-5: Chat messages delivered in real-time (<1 second latency)

### 10.8 Integration

- AC-INT-1: All services expose documented REST APIs with OpenAPI spec
- AC-INT-2: All services return structured JSON responses
- AC-INT-3: All services implement health check endpoints
- AC-INT-4: All services handle errors gracefully with appropriate HTTP status codes
- AC-INT-5: Circuit breaker prevents cascade failures

## 11. Constraints

### 11.1 Technical Constraints

- AI models MUST use Python 3.10+
- Backend services MUST use Node.js 18+ with Express.js
- Frontend applications MUST use Next.js 14+ with React 18+
- Database MUST use PostgreSQL 15+
- Cache MUST use Redis 7+
- Voice Assistant MUST use ChromaDB for vector storage

### 11.2 Resource Constraints

- AI models MUST run on standard EC2 instances (no GPU required)
- System MUST use open-source libraries where possible
- System MUST minimize external API dependencies

### 11.4 Operational Constraints

- System MUST support 24/7 operation
- Maintenance windows MUST be <2 hours/month
- System MUST support zero-downtime deployments
- Backup MUST be performed daily with 30-day retention

## 12. Dependencies

### 12.1 External Services

- **Google Speech-to-Text API**: Voice transcription
- **Google Text-to-Speech (gTTS)**: Voice synthesis
- **Google Maps API**: Location services and heatmaps
- **AWS S3**: Image storage and CDN
- **AWS Secrets Manager**: Secret management
- **GCP Vertex AI**: Complaint standardization
- **FFmpeg**: Audio processing
- **Solidity Ethereum blockchain framework**: Blockchain for audit trails
- **IPFS**: Decentralized cloud storage for images and documents

### 12.2 Internal Services

- **user-be**: Complaint submission and tracking APIs
- **admin-be**: Admin management and assignment APIs
- **compQueue**: Asynchronous complaint processing
- **self**: AI model orchestration gateway
- **Vision Model**: Image classification
- **Abuse Detector**: Text moderation
- **Voice Assistant**: RAG-based chat

### 12.3 Infrastructure

- **AWS EC2**: Compute instances
- **AWS S3**: Object storage
- **AWS CloudFront**: CDN
- **AWS Secrets Manager**: Secret management
- **AWS CloudWatch**: Monitoring and logging
- **PostgreSQL**: Primary database
- **Redis**: Caching and queue management

## 14. Future Enhancements

### 14.1 Short-term (3-6 months)

- Advanced analytics with ML-based trend prediction
- Integration with existing government systems (e-governance portals)
- SMS-based complaint submission for feature phones
- Automated complaint summarization for admins

### 14.2 Medium-term (6-12 months)

- Real-time model retraining pipeline based on feedback
- Multi-modal complaint submission (image + voice + text simultaneously)
- Advanced duplicate detection using image embeddings
- Sentiment analysis for complaint prioritization
- Predictive analytics for complaint resolution time
- Integration with IoT sensors for proactive issue detection
- Citizen feedback and rating system

### 14.3 Long-term (12+ months)

- Federated learning for privacy-preserving model updates
- Custom ViT models for all 20 sectors
- AI-powered complaint routing optimization
- Automated complaint resolution for simple issues
- Integration with smart city infrastructure
- Blockchain-based citizen identity verification
- Advanced NLP for complaint intent classification
- AR-based complaint submission (point camera, auto-submit)

## 15. Glossary

- **SLA**: Service Level Agreement - Maximum time allowed for complaint resolution
- **VLM**: Vision-Language Model - AI model that processes both images and text
- **ViT**: Vision Transformer - Deep learning model for image classification
- **RAG**: Retrieval-Augmented Generation - AI technique combining retrieval and generation
- **STT**: Speech-to-Text - Converting audio to text
- **TTS**: Text-to-Speech - Converting text to audio
- **JWT**: JSON Web Token - Authentication token format
- **RBAC**: Role-Based Access Control - Permission system based on user roles
- **CDN**: Content Delivery Network - Distributed network for fast content delivery
- **IndexedDB**: Browser-based database for offline storage
- **WebSocket**: Protocol for real-time bidirectional communication
- **Redis**: In-memory data store for caching and queuing
- **PostgreSQL**: Relational database management system
- **Prisma**: ORM (Object-Relational Mapping) for database access
- **Next.js**: React framework for server-side rendering
- **Express.js**: Node.js web application framework
- **FastAPI**: Python web framework for building APIs
- **Groq**: AI inference platform
- **Solidity Ethereum blockchain framework**: Decentralized blockchain framework
- **IPFS**: InterPlanetary File System for distributed cloud storage

## 16. Appendix

### 16.1 System Ports

| Service | Port | Protocol |
|---------|------|----------|
| User Frontend | 3002 | HTTP/HTTPS |
| Admin Frontend | 3003 | HTTP/HTTPS |
| User Backend | 3000 | HTTP/HTTPS |
| User Backend WebSocket | 3001 | WebSocket |
| Admin Backend | 3002 | HTTP/HTTPS |
| Complaint Queue | 3005 | HTTP/HTTPS |
| Self (AI Gateway) | 3030 | HTTP/HTTPS |
| Vision Model | 8000 | HTTP/HTTPS |
| Abuse Detector | 8001 | HTTP/HTTPS |
| Voice Assistant | 8002 | HTTP/HTTPS |
| PostgreSQL | 5432 | TCP |
| Redis | 6379 | TCP |

### 16.3 Database Schema Summary

**Tables**:
- users (citizen accounts)
- admins (admin accounts)
- complaints (complaint data)
- chat_messages (admin-citizen chat)
- audit_trail (status change history)
- escalations (escalation events)
- assignments (complaint assignments)
- badges (gamification badges)

**Indexes**:
- complaints: (user_id, status, sector, created_at, location)
- chat_messages: (complaint_id, timestamp)
- audit_trail: (complaint_id, timestamp)

---

