// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/quote"
	"gorm.io/gorm"
)

type quoteRepository struct {
	db *gorm.DB
}

// NewQuoteRepository creates a new quote repository
func NewQuoteRepository(db *gorm.DB) QuoteRepository {
	return &quoteRepository{db: db}
}

func (r *quoteRepository) Create(ctx context.Context, q *quote.Quote) error {
	return r.db.WithContext(ctx).Create(q).Error
}

func (r *quoteRepository) GetByID(ctx context.Context, id uuid.UUID) (*quote.Quote, error) {
	var q quote.Quote
	err := r.db.WithContext(ctx).First(&q, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &q, nil
}

func (r *quoteRepository) ListByPropertyID(ctx context.Context, propertyID uuid.UUID) ([]quote.Quote, error) {
	var items []quote.Quote
	err := r.db.WithContext(ctx).
		Where("property_id = ?", propertyID).
		Order("sort_order ASC, created_at ASC").
		Find(&items).Error
	return items, err
}

func (r *quoteRepository) Update(ctx context.Context, q *quote.Quote) error {
	return r.db.WithContext(ctx).Save(q).Error
}

func (r *quoteRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&quote.Quote{}, "id = ?", id).Error
}
