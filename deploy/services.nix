# SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
# SPDX-License-Identifier: EUPL-1.2
#
# PropertyForSale services configuration

{ config, pkgs, lib, ... }:

{
  # PostgreSQL with PostGIS
  services.postgresql = {
    enable = true;
    package = pkgs.postgresql_16;
    enableTCPIP = false;
    authentication = pkgs.lib.mkOverride 10 ''
      local all all trust
      host all all 127.0.0.1/32 md5
    '';
    initialScript = pkgs.writeText "init.sql" ''
      CREATE USER propertyforsale WITH PASSWORD 'changeme';
      CREATE DATABASE propertyforsale OWNER propertyforsale;
      \c propertyforsale
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

  # Redis
  services.redis.servers.propertyforsale = {
    enable = true;
    port = 6379;
    bind = "127.0.0.1";
    settings = {
      maxmemory = "256mb";
      maxmemory-policy = "volatile-lru";
    };
  };

  # MinIO for S3-compatible storage
  services.minio = {
    enable = true;
    rootCredentialsFile = "/var/lib/minio/credentials";
    dataDir = [ "/var/lib/minio/data" ];
    region = "eu-west-1";
  };

  # PropertyForSale backend service
  systemd.services.propertyforsale-backend = {
    description = "PropertyForSale Backend API";
    after = [ "network.target" "postgresql.service" "redis-propertyforsale.service" ];
    wantedBy = [ "multi-user.target" ];

    environment = {
      ENV = "production";
      PORT = "8080";
      DB_HOST = "localhost";
      DB_PORT = "5432";
      DB_USER = "propertyforsale";
      DB_NAME = "propertyforsale";
      DB_SSLMODE = "disable";
      REDIS_HOST = "localhost";
      REDIS_PORT = "6379";
      S3_ENDPOINT = "localhost:9000";
      S3_BUCKET = "propertyforsale";
      S3_REGION = "eu-west-1";
    };

    serviceConfig = {
      Type = "simple";
      User = "propertyforsale";
      Group = "propertyforsale";
      WorkingDirectory = "/var/lib/propertyforsale";
      ExecStart = "/var/lib/propertyforsale/bin/propertyforsale";
      Restart = "always";
      RestartSec = "5s";

      # Security hardening
      NoNewPrivileges = true;
      PrivateTmp = true;
      ProtectSystem = "strict";
      ProtectHome = true;
      ReadWritePaths = [ "/var/lib/propertyforsale" ];

      # Secrets from environment file
      EnvironmentFile = "/var/lib/propertyforsale/.env";
    };
  };

  # Backup service
  services.postgresqlBackup = {
    enable = true;
    databases = [ "propertyforsale" ];
    location = "/var/backup/postgresql";
    startAt = "*-*-* 02:00:00"; # Daily at 2 AM
    pgdumpOptions = "--format=custom --compress=9";
  };

  # Create backup directory
  systemd.tmpfiles.rules = [
    "d /var/backup/postgresql 0700 postgres postgres -"
    "d /var/lib/propertyforsale 0750 propertyforsale propertyforsale -"
    "d /var/lib/minio 0750 minio minio -"
    "d /var/lib/minio/data 0750 minio minio -"
  ];
}
