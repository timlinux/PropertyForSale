# NixOS Deployment

This guide covers deploying PropertyForSale on NixOS using the official NixOS module
provided by the project's flake. The module supports two deployment modes and manages
all required services declaratively.

## Introduction

The `nixosModules.default` module provides a fully declarative way to deploy
PropertyForSale on NixOS. It configures:

- The Go backend API as a systemd service
- PostgreSQL 16 with PostGIS, uuid-ossp, and pg_trgm extensions
- Redis (isolated named instance for PropertyForSale)
- MinIO for S3-compatible media storage
- nginx with ACME/Let's Encrypt TLS (optional)
- Daily PostgreSQL backups via `postgresqlBackup`
- Kernel and network security hardening, fail2ban, auditd, AppArmor (optional)

### Two Deployment Modes

| Mode | When to use |
|------|-------------|
| **Full Stack** | You want the module to manage nginx, ACME certs, and all services. Set `domain` and `acmeEmail`. |
| **Backend-Only** | You already run nginx (or another web server) and only want the backend + databases. Set `nginx.enable = false`. |

---

## Quick Start

Add PropertyForSale as a flake input and import its NixOS module:

```nix
# flake.nix
{
  description = "My NixOS configuration";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    propertyforsale = {
      url = "github:timlinux/PropertyForSale";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, propertyforsale, ... }: {
    nixosConfigurations.myhost = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        propertyforsale.nixosModules.default
        ./configuration.nix
      ];
      specialArgs = { inherit propertyforsale; };
    };
  };
}
```

The module is consumed via `propertyforsale.nixosModules.default`. The `package`
and `frontend` options are set automatically when the module is imported from the
flake (they default to the flake's own build outputs).

---

## Full Stack Configuration

Use this when you want the module to manage nginx with automatic TLS certificates.
Both `domain` and `acmeEmail` are required when `nginx.enable = true` (the default).

```nix
# configuration.nix
{ config, pkgs, ... }:

{
  services.propertyforsale = {
    enable     = true;
    domain     = "homes.example.com";
    acmeEmail  = "admin@example.com";

    # Secrets
    envFile = "/run/secrets/propertyforsale-env";

    minio.credentialsFile = "/run/secrets/minio-creds";

    # Optional overrides (defaults shown)
    port    = 8080;
    dataDir = "/var/lib/propertyforsale";

    database = {
      createLocally = true;   # manage PostgreSQL locally
      name          = "propertyforsale";
      user          = "propertyforsale";
    };

    redis.createLocally = true;

    nginx.clientMaxBodySize = "500M";

    backup = {
      enable   = true;
      location = "/var/backup/postgresql";
      schedule = "*-*-* 02:00:00";   # daily at 02:00
    };

    security.enable = true;   # kernel hardening, fail2ban, auditd, AppArmor
  };

  # Allow HTTP/HTTPS through the firewall
  networking.firewall.allowedTCPPorts = [ 80 443 ];
}
```

With this configuration nginx will:

- Serve the React frontend from `/`
- Proxy `/api/` to the backend on `http://127.0.0.1:8080`
- Proxy `/media/` to MinIO (when `minio.enable = true`)
- Redirect `www.homes.example.com` to `homes.example.com`
- Issue and auto-renew a Let's Encrypt certificate
- Apply rate limiting, security headers, and gzip compression

---

## Backend-Only Configuration

Use this when you already manage nginx (or Caddy, Traefik, etc.) and only want
PropertyForSale to deploy the backend service and its databases.

```nix
# configuration.nix
{ config, pkgs, ... }:

{
  services.propertyforsale = {
    enable = true;

    nginx.enable = false;   # do not touch nginx

    envFile              = "/run/secrets/propertyforsale-env";
    minio.credentialsFile = "/run/secrets/minio-creds";
  };

  # Wire the frontend and API into your own nginx config:
  services.nginx.virtualHosts."homes.example.com" = {
    enableACME = true;
    forceSSL   = true;

    # Serve the built frontend static assets
    root = "${config.services.propertyforsale.frontend}";

    locations = {
      "/" = {
        tryFiles = "$uri $uri/ /index.html";
      };

      "/api/" = {
        proxyPass = "http://127.0.0.1:${
          toString config.services.propertyforsale.port
        }";
        extraConfig = ''
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection "upgrade";
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
        '';
      };

      "/media/" = {
        proxyPass = "http://127.0.0.1:${
          toString config.services.propertyforsale.minio.port
        }/${config.services.propertyforsale.minio.bucket}/";
      };
    };
  };
}
```

Key points:

- `config.services.propertyforsale.frontend` is the Nix store path to the built
  React assets. Pass it as the nginx `root`.
- `config.services.propertyforsale.port` (default `8080`) is the backend API port.
- `config.services.propertyforsale.minio.port` (default `9000`) is the MinIO API port.

---

## Secrets Setup

### Environment file (`envFile`)

The backend reads secrets from an environment file loaded by its systemd unit.
Create the file with at least these variables:

```bash
# /run/secrets/propertyforsale-env
# NOT world-readable — chmod 600, owned by root or the service user

DB_PASSWORD=your-strong-database-password
JWT_SECRET=your-256-bit-hex-secret

# OAuth (optional)
OAUTH_CLIENT_ID=...
OAUTH_CLIENT_SECRET=...

# S3 / MinIO access keys
S3_ACCESS_KEY=your-minio-root-user
S3_SECRET_KEY=your-minio-root-password
```

### MinIO credentials file (`minio.credentialsFile`)

```bash
# /run/secrets/minio-creds
# chmod 600

MINIO_ROOT_USER=your-minio-root-user
MINIO_ROOT_PASSWORD=your-minio-root-password
```

### Recommended: sops-nix or agenix

For production deployments, manage secrets declaratively with
[sops-nix](https://github.com/Mic92/sops-nix) or
[agenix](https://github.com/ryantm/agenix) rather than placing raw files on disk.

**sops-nix example:**

```nix
sops.secrets."propertyforsale-env" = {
  owner = config.services.propertyforsale.user;
};
sops.secrets."minio-creds" = {
  owner = "minio";
};

services.propertyforsale = {
  envFile              = config.sops.secrets."propertyforsale-env".path;
  minio.credentialsFile = config.sops.secrets."minio-creds".path;
};
```

**agenix example:**

```nix
age.secrets."propertyforsale-env".file = ./secrets/propertyforsale-env.age;
age.secrets."minio-creds".file         = ./secrets/minio-creds.age;

services.propertyforsale = {
  envFile              = config.age.secrets."propertyforsale-env".path;
  minio.credentialsFile = config.age.secrets."minio-creds".path;
};
```

---

## Deploy Commands

### nixos-rebuild

Apply the configuration on the target host directly:

```bash
# On the target host
sudo nixos-rebuild switch --flake .#myhost

# From a remote machine (push the closure, switch remotely)
nixos-rebuild switch --flake .#myhost --target-host root@homes.example.com
```

### nixos-anywhere

For initial provisioning of a bare machine (installs NixOS from scratch):

```bash
nix run github:nix-community/nixos-anywhere -- \
  --flake .#myhost \
  root@<ip-address>
```

### Built-in deploy helper

The flake exposes a convenience deploy script:

```bash
nix run .#deploy
```

See `flake.nix` for how this is configured and any additional environment
variables it accepts (e.g. `TARGET_HOST`, `FLAKE_ATTR`).

### Checking service health

```bash
# Backend service status
systemctl status propertyforsale-backend

# Live logs
journalctl -u propertyforsale-backend -f

# Health endpoint (from the host)
curl http://127.0.0.1:8080/health
```

---

## Configuration Reference

All options live under `services.propertyforsale`.

### Core options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enable` | `bool` | `false` | Enable the PropertyForSale service |
| `package` | `package` | flake default | The backend Go binary package |
| `frontend` | `package` | flake default | Built React static assets package |
| `domain` | `null \| str` | `null` | Public domain name. Required when `nginx.enable = true` |
| `acmeEmail` | `null \| str` | `null` | Let's Encrypt registration email. Required when `nginx.enable = true` |
| `port` | `port` | `8080` | Port the backend API listens on |
| `dataDir` | `path` | `/var/lib/propertyforsale` | Working directory for the backend service |
| `user` | `str` | `propertyforsale` | System user for the service |
| `group` | `str` | `propertyforsale` | System group for the service |
| `envFile` | `null \| path` | `null` | Path to environment file containing secrets |

### Database options (`database.*`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `database.host` | `str` | `localhost` | PostgreSQL host |
| `database.port` | `port` | `5432` | PostgreSQL port |
| `database.name` | `str` | `propertyforsale` | Database name |
| `database.user` | `str` | `propertyforsale` | Database user |
| `database.passwordFile` | `null \| path` | `null` | File containing the DB password. `null` = local trust auth |
| `database.createLocally` | `bool` | `true` | Create and manage PostgreSQL locally |

### Redis options (`redis.*`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `redis.host` | `str` | `localhost` | Redis host |
| `redis.port` | `port` | `6379` | Redis port |
| `redis.createLocally` | `bool` | `true` | Create and manage Redis locally |

### MinIO options (`minio.*`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `minio.enable` | `bool` | `true` | Enable MinIO object storage |
| `minio.port` | `port` | `9000` | MinIO API port |
| `minio.consolePort` | `port` | `9001` | MinIO web console port |
| `minio.credentialsFile` | `null \| path` | `null` | File with `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`. Required when `minio.enable = true` |
| `minio.dataDir` | `path` | `/var/lib/minio/data` | Directory for MinIO data |
| `minio.bucket` | `str` | `propertyforsale` | S3 bucket name for media |
| `minio.region` | `str` | `eu-west-1` | S3 region identifier |

### Nginx options (`nginx.*`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `nginx.enable` | `bool` | `true` | Configure nginx with ACME/TLS. When `false`, only backend + databases are configured |
| `nginx.clientMaxBodySize` | `str` | `500M` | nginx `client_max_body_size` value |

### Security options (`security.*`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `security.enable` | `bool` | `true` | Apply kernel sysctl hardening, fail2ban, auditd, and AppArmor |

### Backup options (`backup.*`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `backup.enable` | `bool` | `true` | Enable daily PostgreSQL backups |
| `backup.location` | `path` | `/var/backup/postgresql` | Directory for backup files |
| `backup.schedule` | `str` | `*-*-* 02:00:00` | Systemd calendar schedule (daily at 02:00 by default) |

---

## Architecture Diagram

```
                         Internet
                            │
                     ┌──────▼──────┐
                     │    nginx    │  :443 (TLS/ACME)
                     │ rate limit  │
                     │  sec hdrs   │
                     └──┬──┬──┬───┘
                        │  │  │
          ┌─────────────┘  │  └──────────────┐
          │                │                 │
    ┌─────▼──────┐  ┌──────▼──────┐  ┌───────▼──────┐
    │  /         │  │   /api/     │  │   /media/    │
    │  frontend  │  │  (proxy)    │  │   (proxy)    │
    │  (static)  │  └──────┬──────┘  └───────┬──────┘
    └────────────┘         │                 │
                    ┌──────▼──────┐  ┌───────▼──────┐
                    │  backend   │  │    MinIO     │
                    │  :8080     │  │    :9000     │
                    └──┬────┬────┘  └──────────────┘
                       │    │
            ┌──────────┘    └──────────┐
            │                         │
    ┌───────▼──────┐         ┌─────────▼──────┐
    │  PostgreSQL  │         │     Redis      │
    │  :5432       │         │     :6379      │
    │  + PostGIS   │         │  (cache/sess)  │
    └──────────────┘         └────────────────┘
```

All inter-service traffic is local (127.0.0.1). Only nginx is exposed to the
network on ports 80 and 443.

---

## Using with an Existing nginx

If your NixOS configuration already declares `services.nginx` with other virtual
hosts, PropertyForSale integrates cleanly. Set `nginx.enable = false` to prevent
the module from touching nginx, then add the virtual host yourself:

```nix
{ config, pkgs, ... }:

{
  # Existing nginx config untouched — module won't interfere
  services.propertyforsale = {
    enable       = true;
    nginx.enable = false;
    envFile              = "/run/secrets/propertyforsale-env";
    minio.credentialsFile = "/run/secrets/minio-creds";
  };

  # Your existing hosts remain intact; add one more:
  services.nginx.virtualHosts."homes.example.com" = {
    enableACME = true;
    forceSSL   = true;
    root       = "${config.services.propertyforsale.frontend}";

    extraConfig = ''
      client_max_body_size 500M;
      server_tokens off;
    '';

    locations."/" = {
      tryFiles = "$uri $uri/ /index.html";
    };

    locations."/api/" = {
      proxyPass = "http://127.0.0.1:${
        toString config.services.propertyforsale.port
      }";
    };

    locations."/media/" = {
      proxyPass = "http://127.0.0.1:${
        toString config.services.propertyforsale.minio.port
      }/${config.services.propertyforsale.minio.bucket}/";
    };
  };
}
```

---

## External Database

To use an existing PostgreSQL server instead of a local one, set
`database.createLocally = false` and point the module at the remote host:

```nix
services.propertyforsale = {
  enable = true;
  domain = "homes.example.com";
  acmeEmail = "admin@example.com";

  minio.credentialsFile = "/run/secrets/minio-creds";

  # Use external PostgreSQL
  database = {
    createLocally = false;
    host          = "db.internal.example.com";
    port          = 5432;
    name          = "propertyforsale";
    user          = "propertyforsale";
    passwordFile  = "/run/secrets/db-password";
  };

  # Optionally use external Redis too
  redis = {
    createLocally = false;
    host          = "redis.internal.example.com";
    port          = 6379;
  };

  # Supply DB_PASSWORD via envFile or database.passwordFile
  envFile = "/run/secrets/propertyforsale-env";
};
```

!!! note
    When `database.createLocally = false`, the module will not create a local
    PostgreSQL instance, and `backup.enable` will have no effect (backups are
    only created for locally managed databases). Manage your external database
    backups separately.

    You must create the database, user, and required extensions
    (`postgis`, `uuid-ossp`, `pg_trgm`) on the external server before the
    first deployment.

---

## Standalone Deployment (nix run)

The flake provides a deploy app for quick deployments without a full NixOS
configuration repository:

```bash
# From the PropertyForSale source tree
nix run .#deploy
```

You can also use `nixos-anywhere` for zero-touch provisioning of a fresh machine:

```bash
# Install NixOS and PropertyForSale from scratch
nix run github:nix-community/nixos-anywhere -- \
  --flake github:timlinux/PropertyForSale#myhost \
  root@<target-ip>
```

For iterative updates after the initial install:

```bash
# Push closure and switch (no SSH key required if using nixos-rebuild)
nixos-rebuild switch \
  --flake github:timlinux/PropertyForSale#myhost \
  --target-host deploy@homes.example.com \
  --use-remote-sudo
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Assertion error: `domain is required` | `nginx.enable = true` but `domain` not set | Set `services.propertyforsale.domain` |
| Assertion error: `acmeEmail is required` | nginx enabled but no email | Set `services.propertyforsale.acmeEmail` |
| Assertion error: `credentialsFile is required` | MinIO enabled but no creds file | Set `services.propertyforsale.minio.credentialsFile` |
| Backend fails to start | Missing DB password | Check `envFile` contains `DB_PASSWORD` |
| 413 Request Entity Too Large | Upload exceeds nginx limit | Increase `nginx.clientMaxBodySize` |
| MinIO bucket not found | Bucket not created after first boot | Run `mc mb myminio/propertyforsale` manually once |

---

Made with :heart: by [Kartoza](https://kartoza.com) | [Donate!](https://github.com/sponsors/timlinux) | [GitHub](https://github.com/timlinux/PropertyForSale)
