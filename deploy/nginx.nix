# SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
# SPDX-License-Identifier: EUPL-1.2
#
# Nginx configuration with ACME/Let's Encrypt

{ config, pkgs, lib, ... }:

{
  # ACME (Let's Encrypt)
  security.acme = {
    acceptTerms = true;
    defaults.email = "tim@kartoza.com";
  };

  # Nginx
  services.nginx = {
    enable = true;

    recommendedGzipSettings = true;
    recommendedOptimisation = true;
    recommendedProxySettings = true;
    recommendedTlsSettings = true;

    # Security headers
    commonHttpConfig = ''
      # Security headers
      add_header X-Frame-Options "SAMEORIGIN" always;
      add_header X-Content-Type-Options "nosniff" always;
      add_header X-XSS-Protection "1; mode=block" always;
      add_header Referrer-Policy "strict-origin-when-cross-origin" always;

      # Content Security Policy
      add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.maplibre.org" always;

      # Rate limiting
      limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
      limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
    '';

    virtualHosts = {
      "propertyforsale.example.com" = {
        enableACME = true;
        forceSSL = true;

        # Serve frontend static files
        root = "/var/lib/propertyforsale/frontend";

        locations = {
          "/" = {
            tryFiles = "$uri $uri/ /index.html";
            extraConfig = ''
              limit_req zone=general burst=20 nodelay;
            '';
          };

          # API proxy
          "/api/" = {
            proxyPass = "http://127.0.0.1:8080";
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

          # Health check
          "/health" = {
            proxyPass = "http://127.0.0.1:8080/health";
          };

          # Static assets with long cache
          "~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$" = {
            root = "/var/lib/propertyforsale/frontend";
            extraConfig = ''
              expires 1y;
              add_header Cache-Control "public, immutable";
            '';
          };

          # MinIO/S3 media proxy
          "/media/" = {
            proxyPass = "http://127.0.0.1:9000/propertyforsale/";
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

        # Extra configuration
        extraConfig = ''
          # Disable server tokens
          server_tokens off;

          # Client body size limit (for uploads)
          client_max_body_size 500M;

          # Gzip settings
          gzip_vary on;
          gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
        '';
      };

      # Redirect www to non-www
      "www.propertyforsale.example.com" = {
        enableACME = true;
        forceSSL = true;
        globalRedirect = "propertyforsale.example.com";
      };
    };
  };
}
