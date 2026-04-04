// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package handler

import (
	"github.com/timlinux/PropertyForSale/backend/internal/service"
)

// Handlers holds all HTTP handler implementations
type Handlers struct {
	Property  *PropertyHandler
	Dwelling  *DwellingHandler
	Room      *RoomHandler
	Area      *AreaHandler
	Media     *MediaHandler
	Auth      *AuthHandler
	Analytics *AnalyticsHandler
	Version   *VersionHandler
}

// NewHandlers creates a new Handlers instance with all implementations
func NewHandlers(services *service.Services) *Handlers {
	return &Handlers{
		Property:  NewPropertyHandler(services.Property, services.Dwelling, services.Area, services.Media),
		Dwelling:  NewDwellingHandler(services.Dwelling, services.Room),
		Room:      NewRoomHandler(services.Room),
		Area:      NewAreaHandler(services.Area),
		Media:     NewMediaHandler(services.Media),
		Auth:      NewAuthHandler(services.Auth),
		Analytics: NewAnalyticsHandler(services.Analytics),
		Version:   NewVersionHandler(services.Content),
	}
}
