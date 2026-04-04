# PropertyForSale - Package Documentation

This document provides an annotated list of all packages in the software
architecture.

## Backend Packages (Go)

### Core Application

| Package | Path | Purpose |
|---------|------|---------|
| `main` | `backend/cmd/server/` | Application entry point, initializes all components |

### Internal Packages

| Package | Path | Purpose |
|---------|------|---------|
| `config` | `backend/internal/config/` | Configuration management using environment variables and files |
| `router` | `backend/internal/router/` | HTTP route definitions and middleware setup |

### Domain Layer

Business entities with no external dependencies.

| Package | Path | Purpose |
|---------|------|---------|
| `property` | `backend/internal/domain/property/` | Property entity and value objects |
| `dwelling` | `backend/internal/domain/dwelling/` | Dwelling entity (buildings within property) |
| `room` | `backend/internal/domain/room/` | Room entity (spaces within dwelling) |
| `area` | `backend/internal/domain/area/` | Area entity (gardens, fields, outdoor spaces) |
| `media` | `backend/internal/domain/media/` | Media entity (images, videos, audio, documents, 3D models) |
| `user` | `backend/internal/domain/user/` | User entity and authentication data |
| `analytics` | `backend/internal/domain/analytics/` | Analytics entities (page views, sessions, A/B tests) |
| `content` | `backend/internal/domain/content/` | Content versioning entities |

### Repository Layer

Data access implementations.

| Package | Path | Purpose |
|---------|------|---------|
| `repository` | `backend/internal/repository/` | Database access using GORM, implements domain interfaces |

### Service Layer

Business logic orchestration.

| Package | Path | Purpose |
|---------|------|---------|
| `service` | `backend/internal/service/` | Business logic, coordinates repositories and external services |

### Handler Layer

HTTP request/response handling.

| Package | Path | Purpose |
|---------|------|---------|
| `handler` | `backend/internal/handler/` | HTTP handlers for all API endpoints |

### Middleware

Cross-cutting concerns.

| Package | Path | Purpose |
|---------|------|---------|
| `middleware` | `backend/internal/middleware/` | Auth, CORS, rate limiting, logging, analytics tracking |

### Data Transfer Objects

Request/response structures.

| Package | Path | Purpose |
|---------|------|---------|
| `dto` | `backend/internal/dto/` | API request and response structures, validation |

### Public Packages

Reusable utilities.

| Package | Path | Purpose |
|---------|------|---------|
| `auth` | `backend/pkg/auth/` | OAuth2 provider implementations (Google, Apple, etc.) |
| `storage` | `backend/pkg/storage/` | S3-compatible storage abstraction |
| `geoip` | `backend/pkg/geoip/` | MaxMind GeoIP2 integration for visitor location |
| `cadconvert` | `backend/pkg/cadconvert/` | CAD file to glTF conversion utilities |
| `version` | `backend/pkg/version/` | Content versioning utilities |

---

## Frontend Packages (React/TypeScript)

### API Layer

| Package | Path | Purpose |
|---------|------|---------|
| `api` | `frontend/src/api/` | API client with TanStack Query hooks |

### Components

| Package | Path | Purpose |
|---------|------|---------|
| `common` | `frontend/src/components/common/` | Reusable UI components (buttons, inputs, cards) |
| `property` | `frontend/src/components/property/` | Property-specific components (cards, details, wizard) |
| `map` | `frontend/src/components/map/` | MapLibre map components with custom layers |
| `viewer3d` | `frontend/src/components/viewer3d/` | Three.js 3D viewer and floor plan components |
| `media` | `frontend/src/components/media/` | Media gallery, video player, audio player |
| `analytics` | `frontend/src/components/analytics/` | Analytics dashboard and charts |
| `cms` | `frontend/src/components/cms/` | Content management UI, page builder |

### Pages

| Package | Path | Purpose |
|---------|------|---------|
| `pages` | `frontend/src/pages/` | Route-level page components |

### Hooks

| Package | Path | Purpose |
|---------|------|---------|
| `hooks` | `frontend/src/hooks/` | Custom React hooks for common functionality |

### Context

| Package | Path | Purpose |
|---------|------|---------|
| `context` | `frontend/src/context/` | React context providers (auth, theme, etc.) |

### Theme

| Package | Path | Purpose |
|---------|------|---------|
| `theme` | `frontend/src/theme/` | Chakra UI theme customization |

### Utilities

| Package | Path | Purpose |
|---------|------|---------|
| `utils` | `frontend/src/utils/` | Helper functions and utilities |

---

## External Dependencies

### Go Modules

| Module | Version | Purpose |
|--------|---------|---------|
| `github.com/gin-gonic/gin` | v1.9.x | HTTP web framework |
| `gorm.io/gorm` | v1.25.x | ORM for database operations |
| `gorm.io/driver/postgres` | v1.5.x | PostgreSQL driver for GORM |
| `github.com/golang-jwt/jwt/v5` | v5.x | JWT token handling |
| `github.com/markbates/goth` | v1.79.x | OAuth2 social authentication |
| `github.com/minio/minio-go/v7` | v7.x | S3-compatible storage client |
| `github.com/oschwald/geoip2-golang` | v1.9.x | MaxMind GeoIP2 database reader |
| `github.com/golang-migrate/migrate/v4` | v4.x | Database migrations |
| `github.com/go-redis/redis/v9` | v9.x | Redis client |
| `github.com/go-playground/validator/v10` | v10.x | Request validation |

### NPM Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.x | UI framework |
| `@chakra-ui/react` | ^2.x | Component library |
| `@emotion/react` | ^11.x | CSS-in-JS (Chakra dependency) |
| `framer-motion` | ^11.x | Animation library |
| `maplibre-gl` | ^4.x | Map rendering |
| `three` | ^0.162.x | 3D graphics |
| `@react-three/fiber` | ^8.x | React renderer for Three.js |
| `@react-three/drei` | ^9.x | Three.js helpers |
| `video.js` | ^8.x | Video player |
| `@tanstack/react-query` | ^5.x | Server state management |
| `zustand` | ^4.x | Client state management |
| `react-hook-form` | ^7.x | Form handling |
| `zod` | ^3.x | Schema validation |
| `react-router-dom` | ^6.x | Routing |

---

## Database Extensions

| Extension | Purpose |
|-----------|---------|
| `postgis` | Geospatial data types and functions |
| `pg_trgm` | Fuzzy text search |
| `uuid-ossp` | UUID generation |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2026-04-04 | Initial package documentation |
