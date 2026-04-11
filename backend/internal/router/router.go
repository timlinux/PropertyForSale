// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package router

import (
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/timlinux/PropertyForSale/backend/internal/config"
	"github.com/timlinux/PropertyForSale/backend/internal/handler"
	"github.com/timlinux/PropertyForSale/backend/internal/middleware"
	"github.com/timlinux/PropertyForSale/backend/internal/repository"
	"github.com/timlinux/PropertyForSale/backend/internal/service"
	"github.com/timlinux/PropertyForSale/backend/pkg/auth"
	"github.com/timlinux/PropertyForSale/backend/pkg/database"
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

	// Initialize SQLite database
	dbCfg := &database.Config{
		Path:  cfg.DB.Path,
		Debug: cfg.Env == "development",
	}
	db, err := database.Init(dbCfg)
	if err != nil {
		return nil, nil, err
	}

	// Initialize repositories
	repos := repository.NewRepositories(db)

	// Initialize services (nil for Redis - we're not using it)
	services := service.NewServices(repos, nil, cfg)

	// Initialize handlers
	isDev := cfg.Env == "development"
	handlers := handler.NewHandlers(services, repos, cfg, isDev)

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
			"status":   "healthy",
			"version":  "0.1.0",
			"database": "sqlite",
		})
	})

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Auth routes
		authRoutes := v1.Group("/auth")
		{
			authRoutes.GET("/providers", handlers.Auth.GetProviders)
			authRoutes.POST("/refresh", handlers.Auth.RefreshToken)
			authRoutes.POST("/logout", handlers.Auth.Logout)
			// Dev-only login endpoint (only works in development mode)
			authRoutes.POST("/dev-login", handlers.Auth.DevLogin)
			authRoutes.GET("/me", middleware.RequireAuth(cfg), handlers.Auth.GetCurrentUser)
			// OAuth provider routes (must be last due to wildcard)
			authRoutes.GET("/:provider", handlers.Auth.InitiateOAuth)
			authRoutes.GET("/:provider/callback", handlers.Auth.OAuthCallback)
		}

		// Property routes (public)
		properties := v1.Group("/properties")
		{
			properties.GET("", handlers.Property.List)
			properties.GET("/:slug", handlers.Property.GetBySlug)
			properties.GET("/:slug/structures", handlers.Property.ListStructures)
			properties.GET("/:slug/areas", handlers.Property.ListAreas)
			properties.GET("/:slug/media", handlers.Property.ListMedia)
			properties.GET("/:slug/quotes", handlers.Property.ListQuotes)
		}

		// Property routes (authenticated)
		propertiesAuth := v1.Group("/properties")
		propertiesAuth.Use(middleware.RequireAuth(cfg))
		{
			propertiesAuth.POST("", handlers.Property.Create)
			propertiesAuth.PUT("/:slug", handlers.Property.Update)
			propertiesAuth.DELETE("/:slug", handlers.Property.Delete)
		}

		// Structure routes
		structures := v1.Group("/structures")
		{
			structures.GET("/:id", handlers.Structure.Get)
			structures.GET("/:id/rooms", handlers.Structure.ListRooms)
		}
		structuresAuth := v1.Group("/structures")
		structuresAuth.Use(middleware.RequireAuth(cfg))
		{
			structuresAuth.POST("", handlers.Structure.Create)
			structuresAuth.PUT("/:id", handlers.Structure.Update)
			structuresAuth.DELETE("/:id", handlers.Structure.Delete)
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
			media.POST("/:id/star", handlers.Media.ToggleStar)
		}

		// Quote routes (authenticated)
		quotes := v1.Group("/quotes")
		quotes.Use(middleware.RequireAuth(cfg))
		{
			quotes.POST("", handlers.Quote.Create)
			quotes.GET("/:id", handlers.Quote.Get)
			quotes.PUT("/:id", handlers.Quote.Update)
			quotes.DELETE("/:id", handlers.Quote.Delete)
		}

		// Serve media files
		v1.Static("/media/files", cfg.Storage.Path)

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

		// A/B Testing routes (public - variant assignment)
		abTests := v1.Group("/ab-tests")
		{
			abTests.POST("/:id/assign", handlers.ABTest.AssignVariant)
		}

		// A/B Testing routes (authenticated - management)
		abTestsAuth := v1.Group("/ab-tests")
		abTestsAuth.Use(middleware.RequireAuth(cfg), middleware.RequireRole("admin"))
		{
			abTestsAuth.GET("", handlers.ABTest.ListABTests)
			abTestsAuth.POST("", handlers.ABTest.CreateABTest)
			abTestsAuth.GET("/:id", handlers.ABTest.GetABTest)
			abTestsAuth.PUT("/:id", handlers.ABTest.UpdateABTest)
			abTestsAuth.DELETE("/:id", handlers.ABTest.DeleteABTest)
			abTestsAuth.POST("/:id/variants", handlers.ABTest.CreateVariant)
			abTestsAuth.GET("/:id/results", handlers.ABTest.GetResults)
		}

		// SEO routes
		seo := v1.Group("/seo")
		{
			seo.GET("/property/:slug", handlers.SEO.GetPropertyMeta)
		}

		// CMS Page routes (public)
		pages := v1.Group("/pages")
		{
			pages.GET("/public/:slug", handlers.Page.GetPublicPage)
		}

		// CMS Page routes (authenticated)
		pagesAuth := v1.Group("/pages")
		pagesAuth.Use(middleware.RequireAuth(cfg), middleware.RequireRole("admin"))
		{
			pagesAuth.GET("", handlers.Page.ListPages)
			pagesAuth.POST("", handlers.Page.CreatePage)
			pagesAuth.GET("/:id", handlers.Page.GetPage)
			pagesAuth.PUT("/:id", handlers.Page.UpdatePage)
			pagesAuth.DELETE("/:id", handlers.Page.DeletePage)
			pagesAuth.POST("/:id/publish", handlers.Page.PublishPage)
			pagesAuth.POST("/:id/unpublish", handlers.Page.UnpublishPage)

			// Block routes
			pagesAuth.POST("/:id/blocks", handlers.Page.CreateBlock)
			pagesAuth.PUT("/:id/blocks/:blockId", handlers.Page.UpdateBlock)
			pagesAuth.DELETE("/:id/blocks/:blockId", handlers.Page.DeleteBlock)
			pagesAuth.POST("/:id/blocks/reorder", handlers.Page.ReorderBlocks)

			// Version routes
			pagesAuth.GET("/:id/versions", handlers.Page.ListVersions)
			pagesAuth.GET("/:id/versions/:version", handlers.Page.GetVersion)
			pagesAuth.POST("/:id/versions/:version/rollback", handlers.Page.RollbackToVersion)
		}

		// Block template routes
		blockTemplates := v1.Group("/block-templates")
		blockTemplates.Use(middleware.RequireAuth(cfg), middleware.RequireRole("admin"))
		{
			blockTemplates.GET("", handlers.Page.ListBlockTemplates)
			blockTemplates.POST("", handlers.Page.CreateBlockTemplate)
			blockTemplates.DELETE("/:id", handlers.Page.DeleteBlockTemplate)
		}
	}

	// Root-level SEO routes (sitemap.xml, robots.txt)
	r.GET("/sitemap.xml", handlers.SEO.Sitemap)
	r.GET("/robots.txt", handlers.SEO.RobotsTxt)

	// Cleanup function
	cleanup := func() {
		sqlDB, _ := db.DB()
		if sqlDB != nil {
			sqlDB.Close()
		}
	}

	return r, cleanup, nil
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
