# PropertyForSale - Technical Specification

## 1. Overview

PropertyForSale is a premium property sales web application designed to provide
immersive property viewing experiences through 3D visualization, interactive
maps, and comprehensive analytics.

### 1.1 Vision

Create the most engaging property sales platform that combines cutting-edge
visualization technology with powerful analytics to maximize property exposure
and sales conversion.

### 1.2 Key Stakeholders

- **Property Owners/Agents** - Upload and manage property listings
- **Potential Buyers** - Browse and explore properties
- **Administrators** - Manage users, analytics, and system configuration

---

## 2. Architecture

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Load Balancer (Nginx)                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
              ┌────────────────────────┴────────────────────────┐
              │                                                  │
              ▼                                                  ▼
┌─────────────────────────────┐                   ┌─────────────────────────────┐
│     Frontend (React SPA)    │                   │     Backend API (Go/Gin)    │
│  - Chakra UI                │                   │  - RESTful API              │
│  - MapLibre GL              │◄─────────────────►│  - OAuth2 Auth              │
│  - Three.js                 │                   │  - Business Logic           │
│  - Video.js                 │                   │  - Analytics Processing     │
└─────────────────────────────┘                   └─────────────────────────────┘
                                                              │
              ┌───────────────────┬───────────────────────────┼───────────────┐
              │                   │                           │               │
              ▼                   ▼                           ▼               ▼
┌─────────────────┐   ┌─────────────────┐         ┌─────────────────┐   ┌─────────┐
│   PostgreSQL    │   │     Redis       │         │   MinIO (S3)    │   │ MaxMind │
│   + PostGIS     │   │  (Cache/Queue)  │         │ (Media Storage) │   │  GeoIP  │
└─────────────────┘   └─────────────────┘         └─────────────────┘   └─────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 | UI framework |
| UI Components | Chakra UI v2 | Component library |
| Maps | MapLibre GL JS | Interactive mapping |
| 3D Visualization | Three.js | 3D rendering |
| State Management | TanStack Query + Zustand | Data fetching & state |
| Backend | Go 1.22 + Gin | API server |
| ORM | GORM | Database access |
| Database | PostgreSQL 16 + PostGIS | Primary data store |
| Cache | Redis | Session & cache |
| Storage | MinIO/S3 | Media files |
| Infrastructure | NixOS | Reproducible deployment |

---

## 3. User Stories

### 3.1 Property Browsing (Public)

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-001 | As a visitor, I want to view the landing page with featured properties | Landing page loads with hero section, featured properties, and call-to-action |
| US-001a | As a visitor, I want to view the About page | About page explains the platform, technology, and open source nature |
| US-001b | As a visitor, I want to view the Contact page | Contact page shows contact methods and open source contribution links |
| US-001c | As a visitor, I want to view Privacy Policy | Privacy page explains data handling practices |
| US-001d | As a visitor, I want to view Terms of Service | Terms page explains usage conditions and EUPL-1.2 licensing |
| US-002 | As a visitor, I want to explore properties on an interactive map | Map displays property markers, clicking shows preview, can filter by location |
| US-003 | As a visitor, I want to view detailed property information | Property page shows all media, descriptions, floor plans, and contact options |
| US-004 | As a visitor, I want to navigate property features via the map | Clicking map features navigates to corresponding content sections |
| US-005 | As a visitor, I want to view 360-degree video tours | Video player supports interactive 360 viewing with hotspots |
| US-006 | As a visitor, I want to view floor plans in 2D and 3D | Floor plan viewer supports both modes with room labels |
| US-007 | As a visitor, I want ambient audio when viewing property areas | Audio autoplays (with user permission) when entering content sections |
| US-008 | As a visitor, I want an immersive full-screen property explorer | Full-screen media viewer with auto-hiding UI, swipe/keyboard navigation, ripple transitions between images, quick-jump search panel (/ key), filmstrip thumbnail view (f key), info overlay (i key), and touch gesture support |
| US-009 | As a visitor, I want to navigate between property components in explorer | Tree-style navigation through property → structures → rooms and property → areas with keyboard shortcuts (arrow keys, Shift+Up to go up hierarchy) |

### 3.2 Authentication

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-010 | As a user, I want to sign up/login via social providers | Google, Apple, Microsoft, GitHub, Facebook OAuth2 integration |
| US-011 | As a user, I want my session to persist across visits | JWT tokens with secure refresh mechanism |
| US-012 | As an admin, I want to manage user roles | Role-based access control (admin, agent, viewer) |

### 3.3 Property Management (Authenticated)

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-020 | As an agent, I want to create new property listings | Guided wizard for property creation with validation |
| US-021 | As an agent, I want to add structures to a property | Hierarchical structure: Property → Structures |
| US-022 | As an agent, I want to add rooms to structures | Hierarchical structure: Structure → Rooms |
| US-023 | As an agent, I want to add areas (gardens, fields) to properties | Areas with polygon geometry on map |
| US-024 | As an agent, I want to upload media to any entity | Support for images, videos, 360 videos, audio, documents, 3D models |
| US-025 | As an agent, I want to set media autoplay behavior | Configure which media autoplays when section is viewed |
| US-026 | As an agent, I want to upload CAD files for floor plans | CAD to glTF conversion for 2D/3D viewing |
| US-027 | As an agent, I want to star/favorite media items | Toggle star on images to prioritize them in slideshows and explorer views, starred images appear first |
| US-028 | As a visitor, I want starred images to auto-rotate as background | Property pages display starred images in timed slideshow with ripple transition effects |
| US-029 | As an agent, I want video thumbnails generated automatically | When uploading videos, system extracts a frame as JPEG thumbnail and stores video metadata (duration, dimensions) |
| US-030a | As an agent, I want to upload .m4a audio files for ambient soundscapes | Support audio/mp4 and audio/x-m4a MIME types for ambient audio uploads |
| US-030b | As an agent, I want starred audio files to play as looping soundscapes | Only starred audio files play as ambient soundscapes, looping continuously for immersive experience |
| US-031a | As a visitor, I want to preview videos on hover in the media gallery | Hovering over video thumbnails plays the video muted, returning to thumbnail when mouse leaves |
| US-031b | As a visitor, I want to preview audio on hover in the media gallery | Hovering over audio items plays a preview with visual feedback (pulse animation) |
| US-032 | As an agent, I want to create promotional quotes for my property | Add/edit/delete taglines like "Jewel of the Alentejo" via Quotes tab in property editor |
| US-033 | As a visitor, I want to see promotional quotes overlaid on property images | Large italic text quotes cycle every 15 seconds with fade transitions over the background images |
| US-034 | As an agent, I want to associate quotes with specific images | Each quote can optionally link to a media item; when that quote displays, its linked image becomes the background |
| US-035 | As an agent, I want to reassign media to different entities | Edit modal allows changing entity_type and entity_id to move media between property/structure/room/area |
| US-036 | As an agent, I want to tag media as house plans or property maps | Special tags (house_plan, property_map) for categorizing architectural drawings and site maps |
| US-037 | As an agent, I want to create entities from uploaded images | Menu on each image allows creating Structure/Room/Area with the image auto-assigned to the new entity |
| US-038 | As an agent, I want to upload QGIS Qgis2threejs 3D scene exports | Dedicated "3D Map" tab in property editor; upload ZIP file containing QGIS 3D scene; system validates for security (file types, sizes, dangerous patterns); add optional description; preview embedded viewer |
| US-038a | As an agent, I want instructions on creating 3D maps | Collapsible accordion with step-by-step QGIS/Qgis2threejs instructions in the 3D Map tab |
| US-038b | As an agent, I want to manage my 3D map | Edit description, replace existing map, or delete map from the dedicated 3D Map tab |
| US-039 | As a visitor, I want to view interactive 3D terrain maps of properties | Property page shows "3D Map" tab with embedded QGIS scene viewer, fullscreen support, scene controls |
| US-040 | As an agent, I want to drag-and-drop media to associate/disassociate with entities | Two-panel UI in structure/room/area edit: left panel shows unassigned property media, right panel shows entity media; drag between panels to associate/disassociate; visual feedback during drag |

### 3.4 Content Management

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-030 | As an agent, I want to edit content with version history | All changes tracked with author and timestamp |
| US-031 | As an agent, I want to view differences between versions | Side-by-side diff view of content changes |
| US-032 | As an agent, I want to rollback to previous versions | One-click rollback with confirmation |
| US-033 | As an agent, I want to use a visual page builder | Drag-and-drop content blocks |

### 3.5 Analytics

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-040 | As an admin, I want to see visitor locations on a map | GeoIP-resolved visitor locations with heatmap |
| US-041 | As an admin, I want to track page dwell times | Per-page and per-section dwell time analytics |
| US-042 | As an admin, I want to identify exit points | Analysis of where visitors leave the site |
| US-043 | As an admin, I want to run A/B tests | Create variants, track performance, declare winners |
| US-044 | As an admin, I want daily performance reports | Email digest with key metrics |

### 3.6 SEO & Marketing

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-050 | As an admin, I want to manage SEO meta tags | Edit title, description, OG tags per page |
| US-051 | As an admin, I want automatic sitemap generation | XML sitemap updated on content changes |
| US-052 | As an admin, I want Google Ads integration | Conversion tracking and remarketing setup |

---

## 4. Data Model

### 4.1 Entity Relationship Diagram

```
                              ┌─────────────┐
                              │    User     │
                              ├─────────────┤
                              │ id          │
                              │ email       │
                              │ name        │
                              │ role        │
                              │ provider    │
                              │ provider_id │
                              │ avatar_url  │
                              │ created_at  │
                              │ updated_at  │
                              └──────┬──────┘
                                     │ owns
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 Property                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ id, owner_id, name, slug, description, price_min, price_max, currency       │
│ location (PostGIS POINT), address_line1, address_line2, city, state         │
│ postal_code, country, status (draft|published|archived), metadata (JSONB)   │
│ created_at, updated_at, published_at                                        │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ 1:N
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│      Structure      │  │        Area         │  │       Media         │
├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤
│ id                  │  │ id                  │  │ id                  │
│ property_id (FK)    │  │ property_id (FK)    │  │ entity_type         │
│ name                │  │ name                │  │ entity_id           │
│ type (house|barn..) │  │ type (garden|field) │  │ type (image|video..)│
│ description         │  │ description         │  │ url                 │
│ floor_count         │  │ geometry (POLYGON)  │  │ thumbnail_url       │
│ year_built          │  │ size_sqm            │  │ metadata (JSONB)    │
│ geometry (POLYGON)  │  │ sort_order          │  │ autoplay            │
│ sort_order          │  │ created_at          │  │ sort_order          │
│ created_at          │  │ updated_at          │  │ created_at          │
│ updated_at          │  └─────────────────────┘  │ updated_at          │
└──────────┬──────────┘                           └─────────────────────┘
           │ 1:N
           ▼
┌─────────────────────┐
│        Room         │
├─────────────────────┤
│ id                  │
│ structure_id (FK)   │
│ name                │
│ type (bedroom|..)   │
│ description         │
│ size_sqm            │
│ floor_start         │
│ floor_end           │
│ geometry (POLYGON)  │
│ sort_order          │
│ created_at          │
│ updated_at          │
└─────────────────────┘
```

### 4.2 Property Quotes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PropertyQuote                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ id, property_id (FK), text, media_id (FK → Media, optional), sort_order     │
│ created_at, updated_at                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

- Quotes are promotional taglines displayed over property images
- Optional `media_id` links a quote to a specific image; when the quote displays, that image becomes the background
- Sorted by sort_order then created_at for display order

### 4.4 Content Versioning

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ContentVersion                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ id, entity_type, entity_id, version_number, data (JSONB), diff (JSONB)      │
│ author_id (FK → User), created_at, is_published, publish_note               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.5 Analytics

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PageView                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ id, session_id, property_id, page_path, dwell_time_ms, scroll_depth         │
│ ip_address, geo_location (PostGIS POINT), country, region, city             │
│ referrer, user_agent, device_type, ab_variant_id, created_at                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                               ABTest                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ id, name, description, entity_type, entity_id, variants (JSONB)             │
│ traffic_split, start_date, end_date, status, winner_variant_id              │
│ created_by (FK → User), created_at, updated_at                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. API Specification

### 5.1 API Versioning

All endpoints prefixed with `/api/v1/`

### 5.2 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/auth/{provider}` | Initiate OAuth2 flow |
| GET | `/api/v1/auth/{provider}/callback` | OAuth2 callback |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Invalidate session |
| GET | `/api/v1/auth/me` | Get current user |

### 5.3 Property Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/properties` | List properties (paginated, filterable) |
| GET | `/api/v1/properties/{slug}` | Get property by slug |
| POST | `/api/v1/properties` | Create property |
| PUT | `/api/v1/properties/{id}` | Update property |
| DELETE | `/api/v1/properties/{id}` | Delete property |
| GET | `/api/v1/properties/{id}/structures` | List structures |
| GET | `/api/v1/properties/{id}/areas` | List areas |
| GET | `/api/v1/properties/{id}/media` | List media |

### 5.4 Structure Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/structures/{id}` | Get structure |
| POST | `/api/v1/structures` | Create structure |
| PUT | `/api/v1/structures/{id}` | Update structure |
| DELETE | `/api/v1/structures/{id}` | Delete structure |
| GET | `/api/v1/structures/{id}/rooms` | List rooms |

### 5.5 Media Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/media/upload` | Upload media file |
| POST | `/api/v1/media/upload-scene` | Upload QGIS 3D scene (ZIP) |
| GET | `/api/v1/media/{id}` | Get media metadata |
| PUT | `/api/v1/media/{id}` | Update media metadata |
| DELETE | `/api/v1/media/{id}` | Delete media |

### 5.6 Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/analytics/pageview` | Record page view |
| GET | `/api/v1/analytics/dashboard` | Get dashboard data |
| GET | `/api/v1/analytics/visitors/map` | Get visitor locations |
| GET | `/api/v1/analytics/reports/daily` | Get daily report |

---

## 6. Business Rules

### 6.1 Property Rules

- BR-001: Property slug must be unique and URL-safe
- BR-002: Property must have at least one image before publishing
- BR-003: Price range must be positive (price_min ≤ price_max)
- BR-004: Only owner or admin can modify property
- BR-005: Archived properties are hidden from public views

### 6.2 Media Rules

- BR-010: Images must be resized to max 4096px on longest edge
- BR-011: Videos must be transcoded to web-compatible formats
- BR-012: 3D models must be converted to glTF format
- BR-013: Maximum file size: images 10MB, videos 500MB, models 100MB
- BR-014: Autoplay audio requires user interaction first
- BR-015: QGIS 3D scenes must be uploaded as ZIP files containing valid Qgis2threejs exports (index.html, data/ or threejs/ directory)

### 6.3 Analytics Rules

- BR-020: IP addresses are anonymized after GeoIP resolution
- BR-021: Session timeout is 30 minutes of inactivity
- BR-022: A/B test variants are assigned deterministically per session
- BR-023: Analytics data retained for 24 months

---

## 7. Non-Functional Requirements

### 7.1 Performance

- Page load time < 3 seconds on 3G connection
- API response time < 200ms for reads, < 500ms for writes
- Support for 1000 concurrent users
- 3D model loading < 5 seconds for 10MB models

### 7.2 Security

- HTTPS everywhere with TLS 1.3
- OWASP Top 10 compliance
- Rate limiting: 100 requests/minute for unauthenticated
- CSRF protection on all mutations
- Content Security Policy headers
- ZIP file upload security:
  - Maximum upload size: 50MB
  - Maximum extracted size: 100MB
  - Maximum file count: 500 files
  - Maximum individual file size: 20MB
  - Maximum path depth: 10 directories
  - File extension whitelist (HTML, JS, CSS, images, fonts, 3D models only)
  - Symlink rejection
  - Dangerous JavaScript pattern scanning (cookie access, localStorage, parent frame access, external scripts)
  - Safe pattern allowlist for legitimate Qgis2threejs code (THREE., Q3D., Qgis2threejs)

### 7.3 Availability

- 99.9% uptime SLA
- Automated backups every 6 hours
- Recovery time objective (RTO): 4 hours
- Recovery point objective (RPO): 6 hours

### 7.4 Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios ≥ 4.5:1

---

## 8. Deployment

### 8.1 Infrastructure

- **Provider**: Hetzner Cloud
- **OS**: NixOS with declarative configuration
- **Web Server**: Nginx with automatic SSL (Let's Encrypt)
- **Database**: PostgreSQL 16 with daily backups
- **Object Storage**: MinIO (self-hosted) or Hetzner Object Storage

### 8.2 CI/CD Pipeline

1. Push to feature branch → Run tests and linters
2. Pull request → Build preview deployment
3. Merge to main → Deploy to staging
4. Tag release → Deploy to production

---

## 9. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1.0 | 2026-04-04 | System | Initial specification |
| 0.2.0 | 2026-04-07 | System | Added immersive PropertyExplorer with auto-hiding UI, touch gestures, ripple transitions, quick-jump search, filmstrip view; Added media starring feature with slideshow functionality; Made explorer the primary entry point from property cards |
| 0.3.0 | 2026-04-11 | System | Added quote-media association allowing quotes to link to specific images; when a quote with an associated image displays, that image becomes the background |
| 0.4.0 | 2026-04-11 | System | Added Contact, About, Privacy, and Terms pages; Added media reassignment to move media between entities; Added special media tags (house_plan, property_map) for architectural drawings; Added "Create from Media" feature to create Structure/Room/Area directly from uploaded images |
| 0.5.0 | 2026-04-11 | System | Added QGIS Qgis2threejs 3D scene integration; Upload ZIP exports as scene3d media type; QGISSceneViewer component with fullscreen support; 3D Map tab on property page |
| 0.6.0 | 2026-04-11 | System | Refactored 3D Map to dedicated admin tab (separate from Media); Added comprehensive ZIP security sanitization (size limits, extension whitelist, dangerous pattern scanning); Added description field for maps; Added step-by-step QGIS instructions in collapsible accordion; Removed ZIP upload from general Media tab |
| 0.7.0 | 2026-04-11 | System | Added two-panel drag-and-drop media management for structures, rooms, and areas; MediaAssociationPanel component with left panel (property media) and right panel (entity media); drag between panels to associate/disassociate media; expandable media sections in StructureItem, room rows, and area cards |
