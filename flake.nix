{
  description = "PropertyForSale - Premium property sales web application";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    pre-commit-hooks = {
      url = "github:cachix/pre-commit-hooks.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    nixos-anywhere = {
      url = "github:nix-community/nixos-anywhere";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, flake-utils, pre-commit-hooks, nixos-anywhere }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };

        # PostgreSQL with PostGIS
        postgresWithPostGIS = pkgs.postgresql_16.withPackages (ps: [
          ps.postgis
        ]);

        # Pre-commit hooks configuration
        pre-commit-check = pre-commit-hooks.lib.${system}.run {
          src = ./.;
          hooks = {
            # Go hooks
            gofmt.enable = true;
            golangci-lint = {
              enable = true;
              entry = "${pkgs.golangci-lint}/bin/golangci-lint run";
              files = "\\.go$";
              pass_filenames = false;
            };
            gotest = {
              enable = true;
              entry = "go test ./...";
              files = "\\.go$";
              pass_filenames = false;
            };

            # Frontend hooks
            prettier = {
              enable = true;
              types_or = [ "javascript" "typescript" "css" "json" "markdown" ];
            };
            eslint = {
              enable = true;
              entry = "npm run lint --prefix frontend";
              files = "\\.(js|jsx|ts|tsx)$";
              pass_filenames = false;
            };

            # General hooks
            nixpkgs-fmt.enable = true;
            shellcheck.enable = true;
            markdownlint.enable = true;
            typos.enable = true;

            # Commit message linting
            commitizen.enable = true;

            # Security checks
            detect-private-key = {
              enable = true;
              entry = "${pkgs.python312Packages.pre-commit-hooks}/bin/detect-private-key";
            };
            check-added-large-files = {
              enable = true;
              entry = "${pkgs.python312Packages.pre-commit-hooks}/bin/check-added-large-files --maxkb=1000";
            };

            # License compliance
            check-license = {
              enable = true;
              name = "check-license";
              entry = "${pkgs.writeShellScript "check-license" ''
                #!/usr/bin/env bash
                if [ ! -f LICENSE ]; then
                  echo "LICENSE file is missing"
                  exit 1
                fi
                if ! grep -q "EUPL" LICENSE; then
                  echo "License must be EUPL-1.2"
                  exit 1
                fi
              ''}";
              files = "^LICENSE$";
              pass_filenames = false;
            };
          };
        };

        # Go build
        goBuild = pkgs.buildGoModule {
          pname = "propertyforsale";
          version = "0.1.0";
          src = ./backend;
          vendorHash = "sha256-iOsC6/vIVSldgRT9JkvhTpfGf1z80XCSauPRgAXL/O4=";
          subPackages = [ "cmd/server" ];
        };

        # =======================================================================
        # Script wrappers - thin wrappers that set env vars and call scripts
        # =======================================================================
        scriptsDir = ./scripts;

        # Simple scripts (no Nix paths needed)
        wrapSimpleScript = name: pkgs.writeShellScriptBin name ''
          exec ${scriptsDir}/${name}.sh "$@"
        '';

        # Scripts needing PostgreSQL paths
        wrapPostgresScript = name: pkgs.writeShellScriptBin name ''
          export POSTGRES_BIN_DIR="${postgresWithPostGIS}/bin"
          exec ${scriptsDir}/${name}.sh "$@"
        '';

        # Define all scripts
        pgStartScript = wrapPostgresScript "pfs-pg-start";
        pgStopScript = wrapPostgresScript "pfs-pg-stop";
        psqlScript = wrapPostgresScript "pfs-psql";
        migrateScript = wrapPostgresScript "pfs-migrate";
        redisStartScript = wrapSimpleScript "pfs-redis-start";
        redisStopScript = wrapSimpleScript "pfs-redis-stop";
        minioStartScript = wrapSimpleScript "pfs-minio-start";
        minioStopScript = wrapSimpleScript "pfs-minio-stop";
        backendScript = wrapSimpleScript "pfs-backend";
        frontendScript = wrapSimpleScript "pfs-frontend";
        devStartScript = wrapSimpleScript "pfs-dev-start";
        devStopScript = wrapSimpleScript "pfs-dev-stop";
        statusScript = wrapSimpleScript "pfs-status";

      in
      {
        # Development shell
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Go development
            go
            gopls
            golangci-lint
            gotools
            go-migrate
            sqlc
            air # Live reload for Go

            # Node.js/Frontend development
            nodejs_22
            typescript
            typescript-language-server
            prettierd
            eslint

            # Database
            postgresWithPostGIS

            # Redis
            redis

            # MinIO for S3 compatible storage
            minio
            minio-client

            # Documentation
            python312Packages.mkdocs-material
            python312Packages.mkdocs
            python312Packages.pymdown-extensions

            # Pre-commit
            pre-commit
            commitizen

            # General tools
            git
            gh
            jq
            yq
            curl
            httpie
            watchexec

            # Linting and formatting
            nixpkgs-fmt
            shellcheck
            markdownlint-cli
            typos

            # GeoIP tools
            libmaxminddb

            # CAD/3D conversion tools
            openscad
            assimp

            # Video/Image processing for thumbnails
            ffmpeg
          ] ++ [
            # Scripts
            pgStartScript
            pgStopScript
            psqlScript
            migrateScript
            redisStartScript
            redisStopScript
            minioStartScript
            minioStopScript
            backendScript
            frontendScript
            devStartScript
            devStopScript
            statusScript
          ];

          shellHook = ''
            ${pre-commit-check.shellHook}

            # Set up environment variables
            export GOPATH="$PWD/.go"
            export PATH="$GOPATH/bin:$PATH"
            export PGHOST="$PWD/.pgdata"
            export PGPORT=5432
            export DB_NAME="propertyforsale"
            export REDIS_PORT=6379
            export MINIO_PORT=9000
            export MINIO_CONSOLE_PORT=9001
            export MINIO_ROOT_USER="minioadmin"
            export MINIO_ROOT_PASSWORD="minioadmin"

            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "🏠 PropertyForSale Development Environment"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "  pfs-status        📊 Check service status"
            echo "  pfs-dev-start     🚀 Start all services (PG, Redis, MinIO)"
            echo "  pfs-dev-stop      🛑 Stop all services"
            echo ""
            echo "  pfs-backend       🔧 Run Go backend (port 8080)"
            echo "  pfs-frontend      🎨 Run frontend dev server (port 5173)"
            echo ""
            echo "  pfs-pg-start      Start PostgreSQL"
            echo "  pfs-pg-stop       Stop PostgreSQL"
            echo "  pfs-psql          Connect to database"
            echo "  pfs-migrate       Run migrations"
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "Made with 💗 by Kartoza | https://kartoza.com"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          '';
        };

        # Packages
        packages = {
          default = goBuild;
          backend = goBuild;
          postgres = postgresWithPostGIS;
        };

        # Apps
        apps = {
          pg-start = { type = "app"; program = "${pgStartScript}/bin/pfs-pg-start"; };
          pg-stop = { type = "app"; program = "${pgStopScript}/bin/pfs-pg-stop"; };
          psql = { type = "app"; program = "${psqlScript}/bin/pfs-psql"; };
          migrate = { type = "app"; program = "${migrateScript}/bin/pfs-migrate"; };
          redis-start = { type = "app"; program = "${redisStartScript}/bin/pfs-redis-start"; };
          redis-stop = { type = "app"; program = "${redisStopScript}/bin/pfs-redis-stop"; };
          minio-start = { type = "app"; program = "${minioStartScript}/bin/pfs-minio-start"; };
          minio-stop = { type = "app"; program = "${minioStopScript}/bin/pfs-minio-stop"; };
          backend = { type = "app"; program = "${backendScript}/bin/pfs-backend"; };
          frontend = { type = "app"; program = "${frontendScript}/bin/pfs-frontend"; };
          dev-start = { type = "app"; program = "${devStartScript}/bin/pfs-dev-start"; };
          dev-stop = { type = "app"; program = "${devStopScript}/bin/pfs-dev-stop"; };
          status = { type = "app"; program = "${statusScript}/bin/pfs-status"; };

          # Build production binaries
          build = {
            type = "app";
            program = toString (pkgs.writeShellScript "build" ''
              #!/usr/bin/env bash
              set -e

              echo "Building PropertyForSale..."

              # Build backend
              echo "Building backend..."
              cd backend
              CGO_ENABLED=0 go build -ldflags="-s -w" -o ../bin/propertyforsale ./cmd/server
              cd ..

              # Build frontend
              echo "Building frontend..."
              cd frontend
              npm ci
              npm run build
              cd ..

              echo ""
              echo "Build complete!"
              echo "  Backend: bin/propertyforsale"
              echo "  Frontend: frontend/dist/"
            '');
          };

          # Run all tests
          test = {
            type = "app";
            program = toString (pkgs.writeShellScript "test" ''
              #!/usr/bin/env bash
              set -e

              echo "Running PropertyForSale tests..."

              # Backend tests
              echo "Running backend tests..."
              cd backend
              go test -v -race -coverprofile=coverage.out ./...
              go tool cover -html=coverage.out -o coverage.html
              cd ..

              # Frontend tests
              echo "Running frontend tests..."
              cd frontend
              npm test -- --coverage
              cd ..

              echo ""
              echo "All tests passed!"
            '');
          };

          # Build and serve documentation
          docs = {
            type = "app";
            program = toString (pkgs.writeShellScript "docs" ''
              #!/usr/bin/env bash
              set -e

              cd docs
              mkdocs serve -a localhost:8000
            '');
          };

          # Run all linters
          lint = {
            type = "app";
            program = toString (pkgs.writeShellScript "lint" ''
              #!/usr/bin/env bash
              set -e

              echo "Running linters..."

              # Go linting
              echo "Linting Go code..."
              cd backend
              golangci-lint run ./...
              cd ..

              # Frontend linting
              echo "Linting frontend code..."
              cd frontend
              npm run lint
              cd ..

              # Nix formatting
              echo "Checking Nix formatting..."
              nixpkgs-fmt --check *.nix deploy/*.nix 2>/dev/null || true

              # Markdown linting
              echo "Linting Markdown..."
              markdownlint '**/*.md' --ignore node_modules --ignore .go || true

              echo ""
              echo "Linting complete!"
            '');
          };

          # Deploy to production
          deploy = {
            type = "app";
            program = toString (pkgs.writeShellScript "deploy" ''
              #!/usr/bin/env bash
              set -e

              TARGET="''${1:-}"

              if [ -z "$TARGET" ]; then
                echo "Usage: nix run .#deploy -- <server-ip-or-hostname>"
                exit 1
              fi

              echo "Deploying PropertyForSale to $TARGET..."

              nixos-anywhere --flake .#propertyforsale-server "$TARGET"

              echo ""
              echo "Deployment complete!"
            '');
          };
        };

        # Pre-commit checks
        checks = {
          pre-commit-check = pre-commit-check;
        };
      }
    ) // {
      # NixOS module for deployment
      nixosConfigurations.propertyforsale-server = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ./deploy/configuration.nix
        ];
      };

      # NixOS module that can be imported
      nixosModules.default = { config, lib, pkgs, ... }: {
        imports = [
          ./deploy/services.nix
        ];
      };
    };
}
