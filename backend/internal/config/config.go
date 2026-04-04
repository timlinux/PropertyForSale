// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Config holds all application configuration
type Config struct {
	Env     string
	Server  ServerConfig
	DB      DatabaseConfig
	Auth    AuthConfig
	Storage StorageConfig
	GeoIP   GeoIPConfig
}

// ServerConfig holds HTTP server configuration
type ServerConfig struct {
	Port            int
	AllowedOrigins  []string
	TrustedProxies  []string
	ReadTimeout     int
	WriteTimeout    int
	ShutdownTimeout int
}

// DatabaseConfig holds SQLite connection settings
type DatabaseConfig struct {
	Path string // Path to SQLite database file (empty for in-memory)
}

// StorageConfig holds file storage settings
type StorageConfig struct {
	Path string // Path to media storage directory
}

// AuthConfig holds OAuth2 provider settings
type AuthConfig struct {
	JWTSecret          string
	JWTExpiry          int // minutes
	RefreshTokenExpiry int // days
	Providers          map[string]OAuthProvider
}

// OAuthProvider holds OAuth2 provider credentials
type OAuthProvider struct {
	ClientID     string
	ClientSecret string
	CallbackURL  string
}

// GeoIPConfig holds MaxMind GeoIP2 settings
type GeoIPConfig struct {
	DatabasePath string
}

// Load reads configuration from environment variables
func Load() (*Config, error) {
	cfg := &Config{
		Env: getEnv("ENV", "development"),
		Server: ServerConfig{
			Port:            getEnvInt("PORT", 8080),
			AllowedOrigins:  getEnvSlice("CORS_ORIGINS", []string{"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"}),
			TrustedProxies:  getEnvSlice("TRUSTED_PROXIES", []string{}),
			ReadTimeout:     getEnvInt("READ_TIMEOUT", 15),
			WriteTimeout:    getEnvInt("WRITE_TIMEOUT", 15),
			ShutdownTimeout: getEnvInt("SHUTDOWN_TIMEOUT", 30),
		},
		DB: DatabaseConfig{
			Path: getEnv("DB_PATH", "./data/propertyforsale.db"),
		},
		Storage: StorageConfig{
			Path: getEnv("STORAGE_PATH", "./data/media"),
		},
		Auth: AuthConfig{
			JWTSecret:          getEnv("JWT_SECRET", "change-me-in-production"),
			JWTExpiry:          getEnvInt("JWT_EXPIRY_MINUTES", 15),
			RefreshTokenExpiry: getEnvInt("REFRESH_TOKEN_EXPIRY_DAYS", 7),
			Providers:          loadOAuthProviders(),
		},
		GeoIP: GeoIPConfig{
			DatabasePath: getEnv("GEOIP_DB_PATH", "/var/lib/GeoIP/GeoLite2-City.mmdb"),
		},
	}

	if err := cfg.Validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

// Validate checks configuration validity
func (c *Config) Validate() error {
	if c.Auth.JWTSecret == "change-me-in-production" && c.Env == "production" {
		return fmt.Errorf("JWT_SECRET must be set in production")
	}
	return nil
}

func loadOAuthProviders() map[string]OAuthProvider {
	providers := make(map[string]OAuthProvider)

	providerNames := []string{"google", "apple", "microsoft", "github", "facebook"}
	for _, name := range providerNames {
		prefix := fmt.Sprintf("OAUTH_%s", strings.ToUpper(name))
		clientID := getEnv(prefix+"_CLIENT_ID", "")
		clientSecret := getEnv(prefix+"_CLIENT_SECRET", "")

		if clientID != "" && clientSecret != "" {
			providers[name] = OAuthProvider{
				ClientID:     clientID,
				ClientSecret: clientSecret,
				CallbackURL:  getEnv(prefix+"_CALLBACK_URL", fmt.Sprintf("http://localhost:8080/api/v1/auth/%s/callback", name)),
			}
		}
	}

	return providers
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if i, err := strconv.Atoi(value); err == nil {
			return i
		}
	}
	return defaultValue
}

func getEnvSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		return strings.Split(value, ",")
	}
	return defaultValue
}
