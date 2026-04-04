// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package router

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
	"github.com/timlinux/PropertyForSale/backend/internal/config"
	"github.com/timlinux/PropertyForSale/backend/internal/handler"
	"github.com/timlinux/PropertyForSale/backend/internal/middleware"
	"github.com/timlinux/PropertyForSale/backend/internal/repository"
	"github.com/timlinux/PropertyForSale/backend/internal/service"
	"github.com/timlinux/PropertyForSale/backend/pkg/auth"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// New creates and configures the Gin router with all dependencies
func New(cfg *config.Config) (*gin.Engine, func(), error) {
	// Set Gin mode
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize OAuth providers and session store
	auth.InitSession(cfg.Auth.JWTSecret)
	auth.InitProviders(cfg)

	// Initialize database
	db, err := initDatabase(cfg)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to initialize database: %w", err)
	}

	// Initialize Redis
	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.Redis.Addr(),
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	})

	// Test Redis connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Warn().Err(err).Msg("Redis connection failed, continuing without cache")
	}

	// Initialize repositories
	repos := repository.NewRepositories(db)

	// Initialize services
	services := service.NewServices(repos, rdb, cfg)

	// Initialize handlers
	handlers := handler.NewHandlers(services)

	// Create Gin engine
	r := gin.New()

	// Add middleware
	r.Use(gin.Recovery())
	r.Use(middleware.Logger())
	r.Use(middleware.RequestID())
	r.Use(corsMiddleware(cfg))

	// Set trusted proxies
	if len(cfg.Server.TrustedProxies) > 0 {
		r.SetTrustedProxies(cfg.Server.TrustedProxies)
	}

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"version": "0.1.0",
		})
	})

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Auth routes
		authRoutes := v1.Group("/auth")
		{
			authRoutes.GET("/providers", handlers.Auth.GetProviders)
			authRoutes.GET("/:provider", handlers.Auth.InitiateOAuth)
			authRoutes.GET("/:provider/callback", handlers.Auth.OAuthCallback)
			authRoutes.POST("/refresh", handlers.Auth.RefreshToken)
			authRoutes.POST("/logout", handlers.Auth.Logout)
			authRoutes.GET("/me", middleware.RequireAuth(cfg), handlers.Auth.GetCurrentUser)
		}

		// Property routes (public)
		properties := v1.Group("/properties")
		{
			properties.GET("", handlers.Property.List)
			properties.GET("/:slug", handlers.Property.GetBySlug)
			properties.GET("/:id/dwellings", handlers.Property.ListDwellings)
			properties.GET("/:id/areas", handlers.Property.ListAreas)
			properties.GET("/:id/media", handlers.Property.ListMedia)
		}

		// Property routes (authenticated)
		propertiesAuth := v1.Group("/properties")
		propertiesAuth.Use(middleware.RequireAuth(cfg))
		{
			propertiesAuth.POST("", handlers.Property.Create)
			propertiesAuth.PUT("/:id", handlers.Property.Update)
			propertiesAuth.DELETE("/:id", handlers.Property.Delete)
		}

		// Dwelling routes
		dwellings := v1.Group("/dwellings")
		{
			dwellings.GET("/:id", handlers.Dwelling.Get)
			dwellings.GET("/:id/rooms", handlers.Dwelling.ListRooms)
		}
		dwellingsAuth := v1.Group("/dwellings")
		dwellingsAuth.Use(middleware.RequireAuth(cfg))
		{
			dwellingsAuth.POST("", handlers.Dwelling.Create)
			dwellingsAuth.PUT("/:id", handlers.Dwelling.Update)
			dwellingsAuth.DELETE("/:id", handlers.Dwelling.Delete)
		}

		// Room routes
		rooms := v1.Group("/rooms")
		{
			rooms.GET("/:id", handlers.Room.Get)
		}
		roomsAuth := v1.Group("/rooms")
		roomsAuth.Use(middleware.RequireAuth(cfg))
		{
			roomsAuth.POST("", handlers.Room.Create)
			roomsAuth.PUT("/:id", handlers.Room.Update)
			roomsAuth.DELETE("/:id", handlers.Room.Delete)
		}

		// Area routes
		areas := v1.Group("/areas")
		{
			areas.GET("/:id", handlers.Area.Get)
		}
		areasAuth := v1.Group("/areas")
		areasAuth.Use(middleware.RequireAuth(cfg))
		{
			areasAuth.POST("", handlers.Area.Create)
			areasAuth.PUT("/:id", handlers.Area.Update)
			areasAuth.DELETE("/:id", handlers.Area.Delete)
		}

		// Media routes
		media := v1.Group("/media")
		media.Use(middleware.RequireAuth(cfg))
		{
			media.POST("/upload", handlers.Media.Upload)
			media.GET("/:id", handlers.Media.Get)
			media.PUT("/:id", handlers.Media.Update)
			media.DELETE("/:id", handlers.Media.Delete)
		}

		// Analytics routes
		analytics := v1.Group("/analytics")
		{
			analytics.POST("/pageview", handlers.Analytics.RecordPageView)
		}
		analyticsAuth := v1.Group("/analytics")
		analyticsAuth.Use(middleware.RequireAuth(cfg), middleware.RequireRole("admin"))
		{
			analyticsAuth.GET("/dashboard", handlers.Analytics.Dashboard)
			analyticsAuth.GET("/visitors/map", handlers.Analytics.VisitorMap)
			analyticsAuth.GET("/reports/daily", handlers.Analytics.DailyReport)
		}

		// Content versioning routes
		versions := v1.Group("/versions")
		versions.Use(middleware.RequireAuth(cfg))
		{
			versions.GET("/:entity_type/:entity_id", handlers.Version.List)
			versions.GET("/:entity_type/:entity_id/:version", handlers.Version.Get)
			versions.POST("/:entity_type/:entity_id/rollback/:version", handlers.Version.Rollback)
		}
	}

	// Cleanup function
	cleanup := func() {
		sqlDB, _ := db.DB()
		if sqlDB != nil {
			sqlDB.Close()
		}
		rdb.Close()
	}

	return r, cleanup, nil
}

func initDatabase(cfg *config.Config) (*gorm.DB, error) {
	gormLogger := logger.Default
	if cfg.Env == "development" {
		gormLogger = logger.Default.LogMode(logger.Info)
	}

	db, err := gorm.Open(postgres.Open(cfg.DB.DSN()), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	sqlDB.SetMaxOpenConns(cfg.DB.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.DB.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return db, nil
}

func corsMiddleware(cfg *config.Config) gin.HandlerFunc {
	return cors.New(cors.Config{
		AllowOrigins:     cfg.Server.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Request-ID"},
		ExposeHeaders:    []string{"Content-Length", "X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	})
}
