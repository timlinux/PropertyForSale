# PropertyForSale

A premium property sales web application featuring immersive 3D experiences,
interactive maps, comprehensive analytics, and a hierarchical content management
system.

## Features

- **Immersive 3D Experiences** - Interactive 360-degree videos, 3D floor plans,
  and architectural model viewing
- **Interactive Maps** - MapLibre-powered property exploration with clickable
  features and geospatial data
- **Hierarchical Content Management** - Properties, structures (buildings, barns,
  sheds), rooms, and areas with versioned content
- **Comprehensive Analytics** - Visitor tracking, geo-location, dwell times,
  A/B testing, and performance reports
- **Social Authentication** - Login via Google, Apple, Microsoft, GitHub, and
  Facebook
- **Beautiful Design** - Premium, responsive UI with luxury real estate
  aesthetics
- **SEO Optimized** - Built-in SEO tools and Google Ads integration
- **Media Management** - Photos, videos, 3D videos, audio, documents, and CAD
  models

## Quick Links

- [User Guide](user-guide/getting-started.md) - Learn how to use the platform
- [Admin Guide](admin-guide/setup.md) - Set up and manage your instance
- [Developer Guide](developer-guide/architecture.md) - Understand the codebase
- [API Reference](api/overview.md) - Integrate with the API

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

## Getting Started

```bash
# Clone the repository
git clone https://github.com/timlinux/PropertyForSale.git
cd PropertyForSale

# Enter the development environment
nix develop

# Start all development services
nix run .#dev

# In separate terminals:
cd backend && air          # Backend with hot reload
cd frontend && npm run dev # Frontend dev server
```

## Support

- [Report Issues](https://github.com/timlinux/PropertyForSale/issues)
- [Discussions](https://github.com/timlinux/PropertyForSale/discussions)
- [Sponsor on GitHub](https://github.com/sponsors/timlinux)

---

Made with :heart: by [Kartoza](https://kartoza.com) |
[Donate!](https://github.com/sponsors/timlinux) |
[GitHub](https://github.com/timlinux/PropertyForSale)
