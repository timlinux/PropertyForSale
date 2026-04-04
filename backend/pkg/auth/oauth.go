// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package auth

import (
	"github.com/markbates/goth"
	"github.com/markbates/goth/providers/apple"
	"github.com/markbates/goth/providers/facebook"
	"github.com/markbates/goth/providers/github"
	"github.com/markbates/goth/providers/google"
	"github.com/markbates/goth/providers/microsoftonline"
	"github.com/timlinux/PropertyForSale/backend/internal/config"
)

// InitProviders initializes all OAuth2 providers from configuration
func InitProviders(cfg *config.Config) {
	var providers []goth.Provider

	for name, providerCfg := range cfg.Auth.Providers {
		switch name {
		case "google":
			providers = append(providers, google.New(
				providerCfg.ClientID,
				providerCfg.ClientSecret,
				providerCfg.CallbackURL,
				"email", "profile",
			))
		case "apple":
			// Apple requires additional configuration (team ID, key ID, private key)
			// For now, we'll create a basic provider
			providers = append(providers, apple.New(
				providerCfg.ClientID,
				providerCfg.ClientSecret,
				providerCfg.CallbackURL,
				nil, // HTTP client
				apple.ScopeName,
				apple.ScopeEmail,
			))
		case "microsoft":
			providers = append(providers, microsoftonline.New(
				providerCfg.ClientID,
				providerCfg.ClientSecret,
				providerCfg.CallbackURL,
				"openid", "profile", "email",
			))
		case "github":
			providers = append(providers, github.New(
				providerCfg.ClientID,
				providerCfg.ClientSecret,
				providerCfg.CallbackURL,
				"user:email",
			))
		case "facebook":
			providers = append(providers, facebook.New(
				providerCfg.ClientID,
				providerCfg.ClientSecret,
				providerCfg.CallbackURL,
				"email",
			))
		}
	}

	goth.UseProviders(providers...)
}

// GetProviderNames returns a list of configured provider names
func GetProviderNames() []string {
	var names []string
	for name := range goth.GetProviders() {
		names = append(names, name)
	}
	return names
}
