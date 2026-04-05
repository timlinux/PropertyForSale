// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

// Package types provides shared types for the application
package types

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

// JSONB is a map type that properly serializes to/from SQLite TEXT columns
type JSONB map[string]interface{}

// Value implements the driver.Valuer interface for database serialization
func (j JSONB) Value() (driver.Value, error) {
	if j == nil {
		return "{}", nil
	}
	b, err := json.Marshal(j)
	if err != nil {
		return nil, err
	}
	return string(b), nil
}

// Scan implements the sql.Scanner interface for database deserialization
func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		*j = make(JSONB)
		return nil
	}

	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return errors.New("failed to scan JSONB: unsupported type")
	}

	if len(bytes) == 0 {
		*j = make(JSONB)
		return nil
	}

	return json.Unmarshal(bytes, j)
}
