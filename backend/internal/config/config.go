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
	Env    string
	Server ServerConfig
	DB     DatabaseConfig
	Redis  RedisConfig
	Auth   AuthConfig
	S3     S3Config
	GeoIP  GeoIPConfig
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

// DatabaseConfig holds PostgreSQL connection settings
type DatabaseConfig struct {
	Host         string
	Port         int
	User         string
	Password     string
	Database     string
	SSLMode      string
	MaxOpenConns int
	MaxIdleConns int
}

// RedisConfig holds Redis connection settings
type RedisConfig struct {
	Host     string
	Port     int
	Password string
	DB       int
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

// S3Config holds S3-compatible storage settings
type S3Config struct {
	Endpoint        string
	AccessKey       string
	SecretKey       string
	Bucket          string
	Region          string
	UseSSL          bool
	PublicURLPrefix string
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
			AllowedOrigins:  getEnvSlice("CORS_ORIGINS", []string{"http://localhost:5173"}),
			TrustedProxies:  getEnvSlice("TRUSTED_PROXIES", []string{}),
			ReadTimeout:     getEnvInt("READ_TIMEOUT", 15),
			WriteTimeout:    getEnvInt("WRITE_TIMEOUT", 15),
			ShutdownTimeout: getEnvInt("SHUTDOWN_TIMEOUT", 30),
		},
		DB: DatabaseConfig{
			Host:         getEnv("DB_HOST", "localhost"),
			Port:         getEnvInt("DB_PORT", 5432),
			User:         getEnv("DB_USER", "propertyforsale"),
			Password:     getEnv("DB_PASSWORD", "propertyforsale"),
			Database:     getEnv("DB_NAME", "propertyforsale"),
			SSLMode:      getEnv("DB_SSLMODE", "disable"),
			MaxOpenConns: getEnvInt("DB_MAX_OPEN_CONNS", 25),
			MaxIdleConns: getEnvInt("DB_MAX_IDLE_CONNS", 5),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnvInt("REDIS_PORT", 6379),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvInt("REDIS_DB", 0),
		},
		Auth: AuthConfig{
			JWTSecret:          getEnv("JWT_SECRET", "change-me-in-production"),
			JWTExpiry:          getEnvInt("JWT_EXPIRY_MINUTES", 15),
			RefreshTokenExpiry: getEnvInt("REFRESH_TOKEN_EXPIRY_DAYS", 7),
			Providers:          loadOAuthProviders(),
		},
		S3: S3Config{
			Endpoint:        getEnv("S3_ENDPOINT", "localhost:9000"),
			AccessKey:       getEnv("S3_ACCESS_KEY", "minioadmin"),
			SecretKey:       getEnv("S3_SECRET_KEY", "minioadmin"),
			Bucket:          getEnv("S3_BUCKET", "propertyforsale"),
			Region:          getEnv("S3_REGION", "us-east-1"),
			UseSSL:          getEnvBool("S3_USE_SSL", false),
			PublicURLPrefix: getEnv("S3_PUBLIC_URL", "http://localhost:9000/propertyforsale"),
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

// DSN returns the PostgreSQL connection string
func (c *DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		c.Host, c.Port, c.User, c.Password, c.Database, c.SSLMode,
	)
}

// RedisAddr returns the Redis connection address
func (c *RedisConfig) Addr() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
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

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if b, err := strconv.ParseBool(value); err == nil {
			return b
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
