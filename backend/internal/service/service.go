// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package service

import (
	"github.com/redis/go-redis/v9"
	"github.com/timlinux/PropertyForSale/backend/internal/config"
	"github.com/timlinux/PropertyForSale/backend/internal/repository"
)

// Services holds all service implementations
type Services struct {
	Property  *PropertyService
	Dwelling  *DwellingService
	Room      *RoomService
	Area      *AreaService
	Media     *MediaService
	Auth      *AuthService
	Analytics *AnalyticsService
	Content   *ContentService
}

// NewServices creates a new Services instance with all implementations
func NewServices(repos *repository.Repositories, rdb *redis.Client, cfg *config.Config) *Services {
	return &Services{
		Property:  NewPropertyService(repos.Property, repos.Content),
		Dwelling:  NewDwellingService(repos.Dwelling, repos.Content),
		Room:      NewRoomService(repos.Room, repos.Content),
		Area:      NewAreaService(repos.Area, repos.Content),
		Media:     NewMediaService(repos.Media, cfg),
		Auth:      NewAuthService(repos.User, rdb, cfg),
		Analytics: NewAnalyticsService(repos.Analytics, cfg),
		Content:   NewContentService(repos.Content),
	}
}
