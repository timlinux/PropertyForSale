# PropertyForSale

A premium property sales web application featuring immersive 3D experiences,
interactive maps, comprehensive analytics, and a hierarchical content management
system.

[![CI](https://github.com/timlinux/PropertyForSale/actions/workflows/ci.yml/badge.svg)](https://github.com/timlinux/PropertyForSale/actions/workflows/ci.yml)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)
[![Documentation](https://img.shields.io/badge/docs-mkdocs-blue)](https://timlinux.github.io/PropertyForSale)

## Features

- **Immersive 3D Experiences** - Interactive 360-degree videos, 3D floor plans,
  and architectural model viewing
- **Interactive Maps** - MapLibre-powered property exploration with clickable
  features and geospatial data
- **Hierarchical Content Management** - Properties, dwellings, rooms, and areas
  with versioned content
- **Comprehensive Analytics** - Visitor tracking, geo-location, dwell times,
  A/B testing, and performance reports
- **Social Authentication** - Login via Google, Apple, Microsoft, GitHub, and
  Facebook
- **Beautiful Design** - Premium, responsive UI with luxury real estate
  aesthetics
- **SEO Optimized** - Built-in SEO tools and Google Ads integration
- **Media Management** - Photos, videos, 3D videos, audio, documents, and CAD
  models

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Go (Gin + GORM) |
| Frontend | React + Chakra UI |
| Database | PostgreSQL + PostGIS |
| Maps | MapLibre GL JS |
| 3D | Three.js |
| Cache | Redis |
| Storage | S3/MinIO |
| Infrastructure | NixOS + Nix Flakes |

## Quick Start

### Prerequisites

- [Nix](https://nixos.org/download.html) with flakes enabled
- [direnv](https://direnv.net/) (optional but recommended)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/timlinux/PropertyForSale.git
cd PropertyForSale

# Enter the development environment
nix develop

# Or with direnv (automatic)
direnv allow

# Start all development services
nix run .#dev

# In separate terminals:
cd backend && air          # Backend with hot reload
cd frontend && npm run dev # Frontend dev server
```

### Available Commands

```bash
nix run .#dev      # Start all development services
nix run .#build    # Build production binaries
nix run .#test     # Run all tests
nix run .#docs     # Build and serve documentation
nix run .#migrate  # Run database migrations
nix run .#lint     # Run all linters
nix run .#deploy   # Deploy to production
```

## Documentation

- [User Guide](https://timlinux.github.io/PropertyForSale/user-guide/)
- [Admin Guide](https://timlinux.github.io/PropertyForSale/admin-guide/)
- [Developer Guide](https://timlinux.github.io/PropertyForSale/developer-guide/)
- [API Reference](https://timlinux.github.io/PropertyForSale/api/)

## Project Structure

```
PropertyForSale/
├── backend/           # Go API server
├── frontend/          # React SPA
├── deploy/            # NixOS deployment configuration
├── docs/              # MkDocs documentation
├── .github/workflows/ # CI/CD pipelines
└── scripts/           # Development scripts
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes using conventional commits
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the European Union Public Licence (EUPL) v1.2 -
see the [LICENSE](LICENSE) file for details.

## Support

- [Report Issues](https://github.com/timlinux/PropertyForSale/issues)
- [Discussions](https://github.com/timlinux/PropertyForSale/discussions)

---

Made with :heart: by [Kartoza](https://kartoza.com) |
[Donate!](https://github.com/sponsors/timlinux) |
[GitHub](https://github.com/timlinux/PropertyForSale)
