# SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
# SPDX-License-Identifier: EUPL-1.2
#
# NixOS module for PropertyForSale
#
# Usage as a flake input:
#
#   # In your flake.nix inputs:
#   inputs.propertyforsale.url = "github:timlinux/PropertyForSale";
#
#   # In your NixOS modules:
#   imports = [ propertyforsale.nixosModules.default ];
#
#   # Full stack (nginx + ACME + all services):
#   services.propertyforsale = {
#     enable = true;
#     domain = "homes.example.com";
#     acmeEmail = "admin@example.com";
#     minio.credentialsFile = "/run/secrets/minio-creds";
#   };
#
#   # Backend-only (bring your own web server):
#   services.propertyforsale = {
#     enable = true;
#     nginx.enable = false;
#     minio.credentialsFile = "/run/secrets/minio-creds";
#   };
#   # Then proxy /api/ to 127.0.0.1:8080 yourself
#   # Serve static files from: config.services.propertyforsale.frontend

{ config, pkgs, lib, ... }:

let
  cfg = config.services.propertyforsale;
in
{
  options.services.propertyforsale = {
    enable = lib.mkEnableOption "PropertyForSale property sales platform";

    package = lib.mkOption {
      type = lib.types.package;
      description = "The PropertyForSale backend package (Go binary).";
    };

    frontend = lib.mkOption {
      type = lib.types.package;
      description = ''
        The PropertyForSale frontend package (built static assets).
        When nginx.enable is false, use this package path to serve
        the frontend from your own web server.
      '';
    };

    domain = lib.mkOption {
      type = lib.types.nullOr lib.types.str;
      default = null;
      description = ''
        The public domain name for the site.
        Required when nginx.enable is true.
        Example: "homes.example.com"
      '';
    };

    acmeEmail = lib.mkOption {
      type = lib.types.nullOr lib.types.str;
      default = null;
      description = ''
        Email address for Let's Encrypt ACME certificate registration.
        Required when nginx.enable is true.
      '';
    };

    port = lib.mkOption {
      type = lib.types.port;
      default = 8080;
      description = "Port the backend API listens on.";
    };

    dataDir = lib.mkOption {
      type = lib.types.path;
      default = "/var/lib/propertyforsale";
      description = "Working directory for the PropertyForSale backend service.";
    };

    user = lib.mkOption {
      type = lib.types.str;
      default = "propertyforsale";
      description = "System user for the PropertyForSale service.";
    };

    group = lib.mkOption {
      type = lib.types.str;
      default = "propertyforsale";
      description = "System group for the PropertyForSale service.";
    };

    envFile = lib.mkOption {
      type = lib.types.nullOr lib.types.path;
      default = null;
      description = ''
        Path to an environment file containing secrets (DB_PASSWORD,
        JWT_SECRET, OAUTH credentials, etc). Loaded by the systemd service.
        The file should NOT be world-readable.
      '';
    };

    database = {
      host = lib.mkOption {
        type = lib.types.str;
        default = "localhost";
        description = "PostgreSQL host.";
      };

      port = lib.mkOption {
        type = lib.types.port;
        default = 5432;
        description = "PostgreSQL port.";
      };

      name = lib.mkOption {
        type = lib.types.str;
        default = "propertyforsale";
        description = "PostgreSQL database name.";
      };

      user = lib.mkOption {
        type = lib.types.str;
        default = "propertyforsale";
        description = "PostgreSQL user.";
      };

      passwordFile = lib.mkOption {
        type = lib.types.nullOr lib.types.path;
        default = null;
        description = ''
          Path to a file containing the database password.
          If null, local trust authentication is used.
        '';
      };

      createLocally = lib.mkOption {
        type = lib.types.bool;
        default = true;
        description = ''
          Whether to create and manage the PostgreSQL instance locally.
          Set to false if using an external database server.
        '';
      };
    };

    redis = {
      host = lib.mkOption {
        type = lib.types.str;
        default = "localhost";
        description = "Redis host.";
      };

      port = lib.mkOption {
        type = lib.types.port;
        default = 6379;
        description = "Redis port.";
      };

      createLocally = lib.mkOption {
        type = lib.types.bool;
        default = true;
        description = ''
          Whether to create and manage the Redis instance locally.
          Set to false if using an external Redis server.
        '';
      };
    };

    minio = {
      enable = lib.mkOption {
        type = lib.types.bool;
        default = true;
        description = "Whether to enable MinIO for S3-compatible object storage.";
      };

      port = lib.mkOption {
        type = lib.types.port;
        default = 9000;
        description = "MinIO API port.";
      };

      consolePort = lib.mkOption {
        type = lib.types.port;
        default = 9001;
        description = "MinIO web console port.";
      };

      credentialsFile = lib.mkOption {
        type = lib.types.nullOr lib.types.path;
        default = null;
        description = ''
          Path to a file containing MinIO root credentials.
          The file should contain:
            MINIO_ROOT_USER=username
            MINIO_ROOT_PASSWORD=password
        '';
      };

      dataDir = lib.mkOption {
        type = lib.types.path;
        default = "/var/lib/minio/data";
        description = "Directory for MinIO data storage.";
      };

      bucket = lib.mkOption {
        type = lib.types.str;
        default = "propertyforsale";
        description = "S3 bucket name for media storage.";
      };

      region = lib.mkOption {
        type = lib.types.str;
        default = "eu-west-1";
        description = "S3 region identifier.";
      };
    };

    nginx = {
      enable = lib.mkOption {
        type = lib.types.bool;
        default = true;
        description = ''
          Whether to configure nginx as a reverse proxy with ACME/Let's Encrypt.
          When false, only the backend service and databases are configured.
          You must serve the frontend static files and proxy /api/ yourself.
          Access the built frontend assets via config.services.propertyforsale.frontend.
        '';
      };

      clientMaxBodySize = lib.mkOption {
        type = lib.types.str;
        default = "500M";
        description = "Maximum upload size for nginx client_max_body_size.";
      };
    };

    security = {
      enable = lib.mkOption {
        type = lib.types.bool;
        default = true;
        description = ''
          Whether to apply kernel and network security hardening.
          Includes sysctl tweaks, fail2ban, audit logging, and AppArmor.
          Disable if you manage security hardening separately.
        '';
      };
    };

    backup = {
      enable = lib.mkOption {
        type = lib.types.bool;
        default = true;
        description = "Whether to enable daily PostgreSQL backups.";
      };

      location = lib.mkOption {
        type = lib.types.path;
        default = "/var/backup/postgresql";
        description = "Directory for PostgreSQL backup files.";
      };

      schedule = lib.mkOption {
        type = lib.types.str;
        default = "*-*-* 02:00:00";
        description = "Systemd calendar schedule for backups (daily at 2 AM by default).";
      };
    };
  };

  config = lib.mkIf cfg.enable {

    # -- Assertions -----------------------------------------------------------
    assertions = [
      {
        assertion = cfg.nginx.enable -> cfg.domain != null;
        message = "services.propertyforsale.domain is required when nginx is enabled.";
      }
      {
        assertion = cfg.nginx.enable -> cfg.acmeEmail != null;
        message = "services.propertyforsale.acmeEmail is required when nginx is enabled.";
      }
      {
        assertion = cfg.minio.enable -> cfg.minio.credentialsFile != null;
        message = "services.propertyforsale.minio.credentialsFile is required when minio is enabled.";
      }
    ];

    # -- Users ----------------------------------------------------------------
    users.users.${cfg.user} = {
      isSystemUser = true;
      group = cfg.group;
      home = cfg.dataDir;
      createHome = true;
    };
    users.groups.${cfg.group} = { };

    # -- PostgreSQL -----------------------------------------------------------
    services.postgresql = lib.mkIf cfg.database.createLocally {
      enable = true;
      package = pkgs.postgresql_16;
      enableTCPIP = false;
      authentication = pkgs.lib.mkOverride 10 ''
        local all all trust
        host all all 127.0.0.1/32 md5
      '';
      initialScript = pkgs.writeText "propertyforsale-init.sql" ''
        CREATE USER ${cfg.database.user} WITH PASSWORD 'changeme_on_first_boot';
        CREATE DATABASE ${cfg.database.name} OWNER ${cfg.database.user};
        \c ${cfg.database.name}
        CREATE EXTENSION IF NOT EXISTS postgis;
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        CREATE EXTENSION IF NOT EXISTS pg_trgm;
      '';
      settings = {
        max_connections = 100;
        shared_buffers = "256MB";
        effective_cache_size = "768MB";
        maintenance_work_mem = "64MB";
        checkpoint_completion_target = 0.9;
        wal_buffers = "16MB";
        default_statistics_target = 100;
        random_page_cost = 1.1;
        effective_io_concurrency = 200;
        min_wal_size = "1GB";
        max_wal_size = "4GB";
      };
    };

    # -- Redis ----------------------------------------------------------------
    services.redis.servers.propertyforsale = lib.mkIf cfg.redis.createLocally {
      enable = true;
      port = cfg.redis.port;
      bind = "127.0.0.1";
      settings = {
        maxmemory = "256mb";
        maxmemory-policy = "volatile-lru";
      };
    };

    # -- MinIO ----------------------------------------------------------------
    services.minio = lib.mkIf cfg.minio.enable {
      enable = true;
      rootCredentialsFile = cfg.minio.credentialsFile;
      dataDir = [ cfg.minio.dataDir ];
      region = cfg.minio.region;
    };

    # -- Backend systemd service ----------------------------------------------
    systemd.services.propertyforsale-backend = {
      description = "PropertyForSale Backend API";
      after = [ "network.target" ]
        ++ lib.optional cfg.database.createLocally "postgresql.service"
        ++ lib.optional cfg.redis.createLocally "redis-propertyforsale.service";
      wantedBy = [ "multi-user.target" ];

      environment = {
        ENV = "production";
        PORT = toString cfg.port;
        DB_HOST = cfg.database.host;
        DB_PORT = toString cfg.database.port;
        DB_USER = cfg.database.user;
        DB_NAME = cfg.database.name;
        DB_SSLMODE = "disable";
        REDIS_HOST = cfg.redis.host;
        REDIS_PORT = toString cfg.redis.port;
        S3_ENDPOINT = "localhost:${toString cfg.minio.port}";
        S3_BUCKET = cfg.minio.bucket;
        S3_REGION = cfg.minio.region;
      };

      serviceConfig = {
        Type = "simple";
        User = cfg.user;
        Group = cfg.group;
        WorkingDirectory = cfg.dataDir;
        ExecStart = "${cfg.package}/bin/propertyforsale";
        Restart = "always";
        RestartSec = "5s";

        # Security hardening
        NoNewPrivileges = true;
        PrivateTmp = true;
        ProtectSystem = "strict";
        ProtectHome = true;
        ReadWritePaths = [ cfg.dataDir ];
      } // lib.optionalAttrs (cfg.envFile != null) {
        EnvironmentFile = cfg.envFile;
      };
    };

    # -- Backup ---------------------------------------------------------------
    services.postgresqlBackup = lib.mkIf (cfg.backup.enable && cfg.database.createLocally) {
      enable = true;
      databases = [ cfg.database.name ];
      location = cfg.backup.location;
      startAt = cfg.backup.schedule;
      pgdumpOptions = "--format=custom --compress=9";
    };

    # -- tmpfiles -------------------------------------------------------------
    systemd.tmpfiles.rules = [
      "d ${cfg.dataDir} 0750 ${cfg.user} ${cfg.group} -"
    ] ++ lib.optionals cfg.backup.enable [
      "d ${cfg.backup.location} 0700 postgres postgres -"
    ] ++ lib.optionals cfg.minio.enable [
      "d ${cfg.minio.dataDir} 0750 minio minio -"
    ];

    # -- Nginx + ACME --------------------------------------------------------
    security.acme = lib.mkIf cfg.nginx.enable {
      acceptTerms = true;
      defaults.email = cfg.acmeEmail;
    };

    services.nginx = lib.mkIf cfg.nginx.enable {
      enable = true;

      recommendedGzipSettings = true;
      recommendedOptimisation = true;
      recommendedProxySettings = true;
      recommendedTlsSettings = true;

      commonHttpConfig = ''
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.maplibre.org" always;

        limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
        limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
      '';

      virtualHosts = {
        "${cfg.domain}" = {
          enableACME = true;
          forceSSL = true;
          root = "${cfg.frontend}";

          locations = {
            "/" = {
              tryFiles = "$uri $uri/ /index.html";
              extraConfig = "limit_req zone=general burst=20 nodelay;";
            };

            "/api/" = {
              proxyPass = "http://127.0.0.1:${toString cfg.port}";
              extraConfig = ''
                limit_req zone=api burst=50 nodelay;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                proxy_connect_timeout 60s;
                proxy_send_timeout 60s;
                proxy_read_timeout 60s;
              '';
            };

            "/health" = {
              proxyPass = "http://127.0.0.1:${toString cfg.port}/health";
            };

            "~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$" = {
              root = "${cfg.frontend}";
              extraConfig = ''
                expires 1y;
                add_header Cache-Control "public, immutable";
              '';
            };
          } // lib.optionalAttrs cfg.minio.enable {
            "/media/" = {
              proxyPass = "http://127.0.0.1:${toString cfg.minio.port}/${cfg.minio.bucket}/";
              extraConfig = ''
                proxy_hide_header x-amz-id-2;
                proxy_hide_header x-amz-request-id;
                proxy_hide_header Set-Cookie;
                proxy_ignore_headers "Set-Cookie";
                expires 7d;
                add_header Cache-Control "public";
              '';
            };
          };

          extraConfig = ''
            server_tokens off;
            client_max_body_size ${cfg.nginx.clientMaxBodySize};
            gzip_vary on;
            gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
          '';
        };

        "www.${cfg.domain}" = {
          enableACME = true;
          forceSSL = true;
          globalRedirect = cfg.domain;
        };
      };
    };

    # -- Security hardening ---------------------------------------------------
    boot.kernel.sysctl = lib.mkIf cfg.security.enable {
      "net.ipv4.tcp_syncookies" = 1;
      "net.ipv4.conf.all.accept_redirects" = 0;
      "net.ipv4.conf.default.accept_redirects" = 0;
      "net.ipv6.conf.all.accept_redirects" = 0;
      "net.ipv6.conf.default.accept_redirects" = 0;
      "net.ipv4.conf.all.send_redirects" = 0;
      "net.ipv4.conf.default.send_redirects" = 0;
      "net.ipv4.conf.all.accept_source_route" = 0;
      "net.ipv4.conf.default.accept_source_route" = 0;
      "net.ipv6.conf.all.accept_source_route" = 0;
      "net.ipv6.conf.default.accept_source_route" = 0;
      "net.ipv4.tcp_max_syn_backlog" = 4096;
      "net.ipv4.icmp_echo_ignore_broadcasts" = 1;
      "net.ipv4.conf.all.rp_filter" = 1;
      "net.ipv4.conf.default.rp_filter" = 1;
      "net.ipv4.icmp_ignore_bogus_error_responses" = 1;
      "net.ipv4.tcp_timestamps" = 0;
      "kernel.dmesg_restrict" = 1;
    };

    services.fail2ban = lib.mkIf cfg.security.enable {
      enable = true;
      maxretry = 5;
      bantime = "1h";
      bantime-increment = {
        enable = true;
        maxtime = "168h";
        factor = "4";
      };
      jails = {
        sshd.settings = {
          filter = "sshd";
          action = ''iptables[name=SSH, port=ssh, protocol=tcp]'';
          maxRetry = 3;
          banTime = "1h";
        };
      } // lib.optionalAttrs cfg.nginx.enable {
        nginx-http-auth.settings = {
          filter = "nginx-http-auth";
          action = ''iptables-multiport[name=nginx-http-auth, port="http,https"]'';
          maxRetry = 5;
          banTime = "1h";
        };
        nginx-botsearch.settings = {
          filter = "nginx-botsearch";
          action = ''iptables-multiport[name=nginx-botsearch, port="http,https"]'';
          maxRetry = 2;
          banTime = "1d";
        };
      };
    };

    security.auditd.enable = lib.mkDefault cfg.security.enable;
    security.audit = lib.mkIf cfg.security.enable {
      enable = true;
      rules = [
        "-w /etc/passwd -p wa -k passwd_changes"
        "-w /etc/group -p wa -k group_changes"
        "-w /etc/shadow -p wa -k shadow_changes"
        "-w ${cfg.dataDir} -p wa -k propertyforsale_changes"
      ];
    };

    security.pam.loginLimits = lib.mkIf cfg.security.enable [
      { domain = "*"; item = "maxlogins"; type = "hard"; value = "10"; }
      { domain = "*"; item = "core"; type = "hard"; value = "0"; }
    ];

    security.apparmor.enable = lib.mkDefault cfg.security.enable;
  };
}
