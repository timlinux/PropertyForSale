// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package notification

import (
	"time"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/pkg/types"
)

// NotificationType represents the type of notification
type NotificationType string

const (
	NotificationTypeInterest    NotificationType = "interest"     // Expression of interest
	NotificationTypeViewing     NotificationType = "viewing"      // Viewing request
	NotificationTypeMessage     NotificationType = "message"      // Direct message
	NotificationTypePriceChange NotificationType = "price_change" // Price updated
	NotificationTypeNewProperty NotificationType = "new_property" // New property listed
	NotificationTypeSystem      NotificationType = "system"       // System notification
)

// NotificationStatus represents whether the notification has been read
type NotificationStatus string

const (
	NotificationStatusUnread NotificationStatus = "unread"
	NotificationStatusRead   NotificationStatus = "read"
)

// DeliveryChannel represents how the notification should be delivered
type DeliveryChannel string

const (
	DeliveryChannelInApp DeliveryChannel = "in_app"
	DeliveryChannelEmail DeliveryChannel = "email"
	DeliveryChannelPush  DeliveryChannel = "push"
)

// Notification represents an in-app notification
type Notification struct {
	ID        uuid.UUID          `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    uuid.UUID          `gorm:"type:uuid;not null;index" json:"user_id"`
	Type      NotificationType   `gorm:"not null" json:"type"`
	Title     string             `gorm:"not null" json:"title"`
	Message   string             `json:"message"`
	Data      types.JSONB        `gorm:"type:text" json:"data"` // Additional context (property_id, etc.)
	Status    NotificationStatus `gorm:"default:'unread'" json:"status"`
	ActionURL string             `json:"action_url"`
	CreatedAt time.Time          `json:"created_at"`
	ReadAt    *time.Time         `json:"read_at"`
}

// TableName returns the table name for GORM
func (Notification) TableName() string {
	return "notifications"
}

// EmailTemplate represents an email template
type EmailTemplate struct {
	ID        uuid.UUID   `gorm:"type:uuid;primaryKey" json:"id"`
	Name      string      `gorm:"uniqueIndex;not null" json:"name"`
	Subject   string      `gorm:"not null" json:"subject"`
	HTMLBody  string      `gorm:"not null" json:"html_body"`
	TextBody  string      `json:"text_body"`
	Variables types.JSONB `gorm:"type:text" json:"variables"` // Expected variables
	CreatedAt time.Time   `json:"created_at"`
	UpdatedAt time.Time   `json:"updated_at"`
}

// TableName returns the table name for GORM
func (EmailTemplate) TableName() string {
	return "email_templates"
}

// EmailLog records sent emails
type EmailLog struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	TemplateID   uuid.UUID  `gorm:"type:uuid;index" json:"template_id"`
	TemplateName string     `json:"template_name"`
	RecipientID  uuid.UUID  `gorm:"type:uuid;index" json:"recipient_id"`
	ToEmail      string     `gorm:"not null" json:"to_email"`
	Subject      string     `gorm:"not null" json:"subject"`
	Status       string     `gorm:"default:'pending'" json:"status"` // pending, sent, failed
	Error        string     `json:"error"`
	SentAt       *time.Time `json:"sent_at"`
	CreatedAt    time.Time  `json:"created_at"`
}

// TableName returns the table name for GORM
func (EmailLog) TableName() string {
	return "email_logs"
}

// NotificationPreference represents user notification preferences
type NotificationPreference struct {
	ID              uuid.UUID   `gorm:"type:uuid;primaryKey" json:"id"`
	UserID          uuid.UUID   `gorm:"type:uuid;uniqueIndex;not null" json:"user_id"`
	EmailEnabled    bool        `gorm:"default:true" json:"email_enabled"`
	PushEnabled     bool        `gorm:"default:true" json:"push_enabled"`
	DigestEnabled   bool        `gorm:"default:true" json:"digest_enabled"`
	DigestFrequency string      `gorm:"default:'daily'" json:"digest_frequency"` // daily, weekly
	TypePreferences types.JSONB `gorm:"type:text" json:"type_preferences"`       // Per-type settings
	CreatedAt       time.Time   `json:"created_at"`
	UpdatedAt       time.Time   `json:"updated_at"`
}

// TableName returns the table name for GORM
func (NotificationPreference) TableName() string {
	return "notification_preferences"
}

// ExpressionOfInterest represents a potential buyer's interest in a property
type ExpressionOfInterest struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	PropertyID uuid.UUID  `gorm:"type:uuid;not null;index" json:"property_id"`
	Name       string     `gorm:"not null" json:"name"`
	Email      string     `gorm:"not null" json:"email"`
	Phone      string     `json:"phone"`
	Message    string     `json:"message"`
	Status     string     `gorm:"default:'new'" json:"status"` // new, contacted, qualified, closed
	NotifiedAt *time.Time `json:"notified_at"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

// TableName returns the table name for GORM
func (ExpressionOfInterest) TableName() string {
	return "expressions_of_interest"
}

// BeforeCreate generates UUID if not set
func (n *Notification) BeforeCreate() error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}

// BeforeCreate generates UUID if not set
func (e *EmailTemplate) BeforeCreate() error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}

// BeforeCreate generates UUID if not set
func (e *EmailLog) BeforeCreate() error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}

// BeforeCreate generates UUID if not set
func (n *NotificationPreference) BeforeCreate() error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}

// BeforeCreate generates UUID if not set
func (e *ExpressionOfInterest) BeforeCreate() error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}
