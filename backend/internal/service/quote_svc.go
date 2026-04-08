// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/quote"
	"github.com/timlinux/PropertyForSale/backend/internal/repository"
)

// QuoteService handles quote business logic
type QuoteService struct {
	quoteRepo repository.QuoteRepository
}

// NewQuoteService creates a new quote service
func NewQuoteService(quoteRepo repository.QuoteRepository) *QuoteService {
	return &QuoteService{
		quoteRepo: quoteRepo,
	}
}

// CreateQuoteInput contains the data for creating a quote
type CreateQuoteInput struct {
	PropertyID uuid.UUID
	Text       string
	SortOrder  int
}

// Create creates a new quote
func (s *QuoteService) Create(ctx context.Context, input CreateQuoteInput) (*quote.Quote, error) {
	now := time.Now()
	q := &quote.Quote{
		ID:         uuid.New(),
		PropertyID: input.PropertyID,
		Text:       input.Text,
		SortOrder:  input.SortOrder,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	if err := s.quoteRepo.Create(ctx, q); err != nil {
		return nil, fmt.Errorf("failed to create quote: %w", err)
	}

	return q, nil
}

// GetByID retrieves a quote by ID
func (s *QuoteService) GetByID(ctx context.Context, id uuid.UUID) (*quote.Quote, error) {
	return s.quoteRepo.GetByID(ctx, id)
}

// ListByPropertyID retrieves all quotes for a property
func (s *QuoteService) ListByPropertyID(ctx context.Context, propertyID uuid.UUID) ([]quote.Quote, error) {
	return s.quoteRepo.ListByPropertyID(ctx, propertyID)
}

// UpdateQuoteInput contains the data for updating a quote
type UpdateQuoteInput struct {
	Text      *string
	SortOrder *int
}

// Update updates a quote
func (s *QuoteService) Update(ctx context.Context, id uuid.UUID, input UpdateQuoteInput) (*quote.Quote, error) {
	q, err := s.quoteRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("quote not found: %w", err)
	}

	if input.Text != nil {
		q.Text = *input.Text
	}
	if input.SortOrder != nil {
		q.SortOrder = *input.SortOrder
	}

	q.UpdatedAt = time.Now()

	if err := s.quoteRepo.Update(ctx, q); err != nil {
		return nil, fmt.Errorf("failed to update quote: %w", err)
	}

	return q, nil
}

// Delete deletes a quote
func (s *QuoteService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.quoteRepo.Delete(ctx, id)
}
