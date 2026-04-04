// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package auth

import (
	"github.com/gorilla/sessions"
	"github.com/markbates/goth/gothic"
)

// InitSession initializes the session store for OAuth flows
// The key should be a 32 or 64 byte random string in production
func InitSession(key string) {
	// Create a new cookie store with the secret key
	store := sessions.NewCookieStore([]byte(key))

	// Configure session options
	store.MaxAge(86400 * 30) // 30 days
	store.Options.Path = "/"
	store.Options.HttpOnly = true
	store.Options.Secure = false // Set to true in production with HTTPS

	// Set the store for gothic
	gothic.Store = store
}
