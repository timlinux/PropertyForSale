// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/timlinux/PropertyForSale/backend/internal/domain/notification"
	"gorm.io/gorm"
)

type notificationRepository struct {
	db *gorm.DB
}

// NewNotificationRepository creates a new notification repository
func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{db: db}
}

// NotificationListOptions for filtering notifications
type NotificationListOptions struct {
	UserID uuid.UUID
	Status string
	Type   string
	Offset int
	Limit  int
}

// Notification operations
func (r *notificationRepository) CreateNotification(ctx context.Context, n *notification.Notification) error {
	return r.db.WithContext(ctx).Create(n).Error
}

func (r *notificationRepository) GetNotification(ctx context.Context, id uuid.UUID) (*notification.Notification, error) {
	var n notification.Notification
	err := r.db.WithContext(ctx).First(&n, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &n, nil
}

func (r *notificationRepository) ListNotifications(ctx context.Context, opts NotificationListOptions) ([]notification.Notification, int64, error) {
	var notifications []notification.Notification
	var total int64

	query := r.db.WithContext(ctx).Model(&notification.Notification{})

	if opts.UserID != uuid.Nil {
		query = query.Where("user_id = ?", opts.UserID)
	}
	if opts.Status != "" {
		query = query.Where("status = ?", opts.Status)
	}
	if opts.Type != "" {
		query = query.Where("type = ?", opts.Type)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if opts.Limit == 0 {
		opts.Limit = 20
	}

	err := query.
		Order("created_at DESC").
		Offset(opts.Offset).
		Limit(opts.Limit).
		Find(&notifications).Error

	return notifications, total, err
}

func (r *notificationRepository) MarkAsRead(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&notification.Notification{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":  notification.NotificationStatusRead,
			"read_at": now,
		}).Error
}

func (r *notificationRepository) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&notification.Notification{}).
		Where("user_id = ? AND status = ?", userID, notification.NotificationStatusUnread).
		Updates(map[string]interface{}{
			"status":  notification.NotificationStatusRead,
			"read_at": now,
		}).Error
}

func (r *notificationRepository) GetUnreadCount(ctx context.Context, userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&notification.Notification{}).
		Where("user_id = ? AND status = ?", userID, notification.NotificationStatusUnread).
		Count(&count).Error
	return count, err
}

func (r *notificationRepository) DeleteNotification(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&notification.Notification{}, "id = ?", id).Error
}

func (r *notificationRepository) DeleteOldNotifications(ctx context.Context, olderThan time.Time) (int64, error) {
	result := r.db.WithContext(ctx).
		Where("created_at < ? AND status = ?", olderThan, notification.NotificationStatusRead).
		Delete(&notification.Notification{})
	return result.RowsAffected, result.Error
}

// Preference operations
func (r *notificationRepository) GetPreferences(ctx context.Context, userID uuid.UUID) (*notification.NotificationPreference, error) {
	var pref notification.NotificationPreference
	err := r.db.WithContext(ctx).First(&pref, "user_id = ?", userID).Error
	if err != nil {
		return nil, err
	}
	return &pref, nil
}

func (r *notificationRepository) CreateOrUpdatePreferences(ctx context.Context, pref *notification.NotificationPreference) error {
	return r.db.WithContext(ctx).
		Where("user_id = ?", pref.UserID).
		Assign(pref).
		FirstOrCreate(pref).Error
}

// Expression of Interest operations
func (r *notificationRepository) CreateEOI(ctx context.Context, eoi *notification.ExpressionOfInterest) error {
	return r.db.WithContext(ctx).Create(eoi).Error
}

func (r *notificationRepository) GetEOI(ctx context.Context, id uuid.UUID) (*notification.ExpressionOfInterest, error) {
	var eoi notification.ExpressionOfInterest
	err := r.db.WithContext(ctx).First(&eoi, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &eoi, nil
}

func (r *notificationRepository) ListEOIs(ctx context.Context, propertyID uuid.UUID, status string) ([]notification.ExpressionOfInterest, error) {
	var eois []notification.ExpressionOfInterest
	query := r.db.WithContext(ctx)

	if propertyID != uuid.Nil {
		query = query.Where("property_id = ?", propertyID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	err := query.Order("created_at DESC").Find(&eois).Error
	return eois, err
}

func (r *notificationRepository) UpdateEOIStatus(ctx context.Context, id uuid.UUID, status string) error {
	return r.db.WithContext(ctx).Model(&notification.ExpressionOfInterest{}).
		Where("id = ?", id).
		Update("status", status).Error
}

func (r *notificationRepository) GetEOIsByProperty(ctx context.Context, propertyID uuid.UUID) ([]notification.ExpressionOfInterest, error) {
	var eois []notification.ExpressionOfInterest
	err := r.db.WithContext(ctx).
		Where("property_id = ?", propertyID).
		Order("created_at DESC").
		Find(&eois).Error
	return eois, err
}

// Email template operations
func (r *notificationRepository) GetEmailTemplate(ctx context.Context, name string) (*notification.EmailTemplate, error) {
	var template notification.EmailTemplate
	err := r.db.WithContext(ctx).First(&template, "name = ?", name).Error
	if err != nil {
		return nil, err
	}
	return &template, nil
}

func (r *notificationRepository) ListEmailTemplates(ctx context.Context) ([]notification.EmailTemplate, error) {
	var templates []notification.EmailTemplate
	err := r.db.WithContext(ctx).Order("name ASC").Find(&templates).Error
	return templates, err
}

func (r *notificationRepository) CreateOrUpdateEmailTemplate(ctx context.Context, template *notification.EmailTemplate) error {
	return r.db.WithContext(ctx).
		Where("name = ?", template.Name).
		Assign(template).
		FirstOrCreate(template).Error
}

// Email log operations
func (r *notificationRepository) CreateEmailLog(ctx context.Context, log *notification.EmailLog) error {
	return r.db.WithContext(ctx).Create(log).Error
}

func (r *notificationRepository) UpdateEmailLogStatus(ctx context.Context, id uuid.UUID, status string, errMsg string) error {
	updates := map[string]interface{}{"status": status}
	if status == "sent" {
		now := time.Now()
		updates["sent_at"] = now
	}
	if errMsg != "" {
		updates["error"] = errMsg
	}
	return r.db.WithContext(ctx).Model(&notification.EmailLog{}).
		Where("id = ?", id).
		Updates(updates).Error
}

func (r *notificationRepository) GetPendingEmails(ctx context.Context, limit int) ([]notification.EmailLog, error) {
	var logs []notification.EmailLog
	err := r.db.WithContext(ctx).
		Where("status = ?", "pending").
		Order("created_at ASC").
		Limit(limit).
		Find(&logs).Error
	return logs, err
}
