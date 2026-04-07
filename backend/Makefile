# SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
# SPDX-License-Identifier: EUPL-1.2

.PHONY: build run run-dev clean test

# Binary name
BINARY=server

# Build directory
BUILD_DIR=../bin

# Build the server binary
build:
	@echo "Building $(BINARY)..."
	@mkdir -p $(BUILD_DIR)
	go build -o $(BUILD_DIR)/$(BINARY) ./cmd/server

# Run the server in production mode
run: build
	@echo "Starting server..."
	$(BUILD_DIR)/$(BINARY)

# Run the server in development mode with dev logins enabled
run-dev: build
	@echo "Starting server in development mode (dev logins enabled)..."
	$(BUILD_DIR)/$(BINARY) --dev

# Clean build artifacts
clean:
	@echo "Cleaning..."
	rm -rf $(BUILD_DIR)
	rm -f ./server_test

# Run tests
test:
	go test -v ./...

# Run tests with coverage
test-coverage:
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Format code
fmt:
	go fmt ./...

# Lint code
lint:
	golangci-lint run

# Help
help:
	@echo "Available targets:"
	@echo "  build         - Build the server binary"
	@echo "  run           - Build and run the server"
	@echo "  run-dev       - Build and run the server with dev logins enabled"
	@echo "  clean         - Remove build artifacts"
	@echo "  test          - Run tests"
	@echo "  test-coverage - Run tests with coverage report"
	@echo "  fmt           - Format Go code"
	@echo "  lint          - Run linter"
