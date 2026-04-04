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
          vendorHash = null; # Will be set once go.sum exists
          subPackages = [ "cmd/server" ];
        };

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
            postgresql_16
            postgresqlPackages.postgis

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
          ];

          shellHook = ''
            ${pre-commit-check.shellHook}

            echo ""
            echo "PropertyForSale Development Environment"
            echo "========================================"
            echo ""
            echo "Available commands:"
            echo "  nix run .#dev       - Start all development services"
            echo "  nix run .#build     - Build production binaries"
            echo "  nix run .#test      - Run all tests"
            echo "  nix run .#docs      - Build and serve documentation"
            echo "  nix run .#migrate   - Run database migrations"
            echo "  nix run .#lint      - Run all linters"
            echo ""
            echo "Manual commands:"
            echo "  cd backend && air   - Start backend with hot reload"
            echo "  cd frontend && npm run dev - Start frontend dev server"
            echo ""

            # Set up environment variables
            export GOPATH="$PWD/.go"
            export PATH="$GOPATH/bin:$PATH"
            export DATABASE_URL="postgres://propertyforsale:propertyforsale@localhost:5432/propertyforsale?sslmode=disable"
            export REDIS_URL="redis://localhost:6379"
            export MINIO_ENDPOINT="localhost:9000"
            export MINIO_ACCESS_KEY="minioadmin"
            export MINIO_SECRET_KEY="minioadmin"
          '';
        };

        # Packages
        packages = {
          default = goBuild;
          backend = goBuild;
        };

        # Apps
        apps = {
          # Start all development services
          dev = {
            type = "app";
            program = toString (pkgs.writeShellScript "dev" ''
              #!/usr/bin/env bash
              set -e

              echo "Starting PropertyForSale development environment..."

              # Create data directories
              mkdir -p .data/postgres .data/redis .data/minio

              # Start PostgreSQL
              if ! pg_isready -h localhost -p 5432 2>/dev/null; then
                echo "Starting PostgreSQL..."
                pg_ctl -D .data/postgres -l .data/postgres.log -o "-p 5432" start 2>/dev/null || {
                  initdb -D .data/postgres
                  pg_ctl -D .data/postgres -l .data/postgres.log -o "-p 5432" start
                  createdb -h localhost -p 5432 propertyforsale 2>/dev/null || true
                  psql -h localhost -p 5432 -d propertyforsale -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>/dev/null || true
                }
              fi

              # Start Redis
              if ! redis-cli ping 2>/dev/null; then
                echo "Starting Redis..."
                redis-server --daemonize yes --dir .data/redis
              fi

              # Start MinIO
              if ! curl -s http://localhost:9000/minio/health/live 2>/dev/null; then
                echo "Starting MinIO..."
                minio server .data/minio --console-address ":9001" &
                sleep 2
              fi

              echo ""
              echo "Services started:"
              echo "  PostgreSQL: localhost:5432"
              echo "  Redis: localhost:6379"
              echo "  MinIO: localhost:9000 (Console: localhost:9001)"
              echo ""
              echo "Run 'cd backend && air' for backend hot reload"
              echo "Run 'cd frontend && npm run dev' for frontend"
            '');
          };

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

          # Run database migrations
          migrate = {
            type = "app";
            program = toString (pkgs.writeShellScript "migrate" ''
              #!/usr/bin/env bash
              set -e

              DATABASE_URL="''${DATABASE_URL:-postgres://propertyforsale:propertyforsale@localhost:5432/propertyforsale?sslmode=disable}"

              case "''${1:-up}" in
                up)
                  echo "Running migrations up..."
                  migrate -path backend/migrations -database "$DATABASE_URL" up
                  ;;
                down)
                  echo "Running migrations down..."
                  migrate -path backend/migrations -database "$DATABASE_URL" down 1
                  ;;
                create)
                  echo "Creating migration: $2"
                  migrate create -ext sql -dir backend/migrations -seq "$2"
                  ;;
                *)
                  echo "Usage: nix run .#migrate [up|down|create <name>]"
                  exit 1
                  ;;
              esac
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
