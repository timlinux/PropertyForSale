// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package handler

import (
	"github.com/timlinux/PropertyForSale/backend/internal/config"
	"github.com/timlinux/PropertyForSale/backend/internal/repository"
	"github.com/timlinux/PropertyForSale/backend/internal/service"
)

// Handlers holds all HTTP handler implementations
type Handlers struct {
	Property  *PropertyHandler
	Structure *StructureHandler
	Room      *RoomHandler
	Area      *AreaHandler
	Media     *MediaHandler
	Auth      *AuthHandler
	Analytics *AnalyticsHandler
	Version   *VersionHandler
	ABTest    *ABTestHandler
	SEO       *SEOHandler
	Page      *PageHandler
	Quote     *QuoteHandler
}

// NewHandlers creates a new Handlers instance with all implementations
func NewHandlers(services *service.Services, repos *repository.Repositories, cfg *config.Config, isDev bool) *Handlers {
	return &Handlers{
		Property:  NewPropertyHandler(services.Property, services.Structure, services.Room, services.Area, services.Media, services.Quote),
		Structure: NewStructureHandler(services.Structure, services.Room),
		Room:      NewRoomHandler(services.Room),
		Area:      NewAreaHandler(services.Area),
		Media:     NewMediaHandler(services.Media),
		Auth:      NewAuthHandler(services.Auth, isDev),
		Analytics: NewAnalyticsHandler(services.Analytics),
		Version:   NewVersionHandler(services.Content),
		ABTest:    NewABTestHandler(repos.Analytics),
		SEO:       NewSEOHandler(repos.Property, cfg),
		Page:      NewPageHandler(repos.Page),
		Quote:     NewQuoteHandler(services.Quote),
	}
}
