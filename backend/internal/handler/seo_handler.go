// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

package handler

import (
	"encoding/xml"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/timlinux/PropertyForSale/backend/internal/config"
	"github.com/timlinux/PropertyForSale/backend/internal/repository"
)

// SEOHandler handles SEO-related HTTP requests
type SEOHandler struct {
	propertyRepo repository.PropertyRepository
	cfg          *config.Config
}

// NewSEOHandler creates a new SEO handler
func NewSEOHandler(propertyRepo repository.PropertyRepository, cfg *config.Config) *SEOHandler {
	return &SEOHandler{
		propertyRepo: propertyRepo,
		cfg:          cfg,
	}
}

// URLSet represents the sitemap XML structure
type URLSet struct {
	XMLName xml.Name `xml:"urlset"`
	XMLNS   string   `xml:"xmlns,attr"`
	URLs    []URL    `xml:"url"`
}

// URL represents a single URL in the sitemap
type URL struct {
	Loc        string  `xml:"loc"`
	LastMod    string  `xml:"lastmod,omitempty"`
	ChangeFreq string  `xml:"changefreq,omitempty"`
	Priority   float64 `xml:"priority,omitempty"`
}

// Sitemap handles GET /sitemap.xml
func (h *SEOHandler) Sitemap(c *gin.Context) {
	baseURL := h.cfg.Server.BaseURL
	if baseURL == "" {
		baseURL = fmt.Sprintf("http://%s", c.Request.Host)
	}

	urls := []URL{
		// Static pages
		{
			Loc:        baseURL + "/",
			ChangeFreq: "weekly",
			Priority:   1.0,
		},
		{
			Loc:        baseURL + "/properties",
			ChangeFreq: "daily",
			Priority:   0.9,
		},
	}

	// Get all published properties
	properties, _, err := h.propertyRepo.List(c.Request.Context(), repository.ListOptions{
		Status: "published",
		Limit:  1000,
	})
	if err == nil {
		for _, p := range properties {
			urls = append(urls, URL{
				Loc:        fmt.Sprintf("%s/property/%s", baseURL, p.Slug),
				LastMod:    p.UpdatedAt.Format("2006-01-02"),
				ChangeFreq: "weekly",
				Priority:   0.8,
			})
		}
	}

	sitemap := URLSet{
		XMLNS: "http://www.sitemaps.org/schemas/sitemap/0.9",
		URLs:  urls,
	}

	c.Header("Content-Type", "application/xml; charset=utf-8")
	c.XML(http.StatusOK, sitemap)
}

// RobotsTxt handles GET /robots.txt
func (h *SEOHandler) RobotsTxt(c *gin.Context) {
	baseURL := h.cfg.Server.BaseURL
	if baseURL == "" {
		baseURL = fmt.Sprintf("http://%s", c.Request.Host)
	}

	robots := fmt.Sprintf(`User-agent: *
Allow: /

# Sitemap
Sitemap: %s/sitemap.xml

# Disallow admin/dashboard areas
Disallow: /dashboard/
Disallow: /api/
Disallow: /dev-login
Disallow: /auth/

# Crawl-delay for politeness
Crawl-delay: 1
`, baseURL)

	c.Header("Content-Type", "text/plain; charset=utf-8")
	c.String(http.StatusOK, robots)
}

// PropertyMetadata returns SEO metadata for a property
type PropertyMetadata struct {
	Title          string `json:"title"`
	Description    string `json:"description"`
	OGTitle        string `json:"og_title"`
	OGDescription  string `json:"og_description"`
	OGImage        string `json:"og_image"`
	OGType         string `json:"og_type"`
	CanonicalURL   string `json:"canonical_url"`
	StructuredData string `json:"structured_data"`
}

// GetPropertyMeta handles GET /api/v1/seo/property/:slug
func (h *SEOHandler) GetPropertyMeta(c *gin.Context) {
	slug := c.Param("slug")

	property, err := h.propertyRepo.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "property not found"})
		return
	}

	baseURL := h.cfg.Server.BaseURL
	if baseURL == "" {
		baseURL = fmt.Sprintf("http://%s", c.Request.Host)
	}

	// Build description
	description := property.Description
	if len(description) > 160 {
		description = description[:157] + "..."
	}
	if description == "" {
		description = fmt.Sprintf("Beautiful property in %s, %s. View details, photos, and schedule a tour.", property.City, property.Country)
	}

	// Build title
	title := property.Name
	if property.City != "" {
		title = fmt.Sprintf("%s in %s | PropertyForSale", property.Name, property.City)
	}

	// Build structured data (JSON-LD)
	structuredData := fmt.Sprintf(`{
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  "name": "%s",
  "description": "%s",
  "url": "%s/property/%s",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "%s",
    "addressLocality": "%s",
    "addressRegion": "%s",
    "postalCode": "%s",
    "addressCountry": "%s"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": %f,
    "longitude": %f
  },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "%s",
    "price": %f
  },
  "datePosted": "%s"
}`,
		escapeJSON(property.Name),
		escapeJSON(description),
		baseURL,
		property.Slug,
		escapeJSON(property.AddressLine1),
		escapeJSON(property.City),
		escapeJSON(property.State),
		escapeJSON(property.PostalCode),
		escapeJSON(property.Country),
		property.Latitude,
		property.Longitude,
		property.Currency,
		property.PriceMin,
		property.CreatedAt.Format(time.RFC3339),
	)

	meta := PropertyMetadata{
		Title:          title,
		Description:    description,
		OGTitle:        title,
		OGDescription:  description,
		OGImage:        "", // Would need to get from media
		OGType:         "website",
		CanonicalURL:   fmt.Sprintf("%s/property/%s", baseURL, property.Slug),
		StructuredData: structuredData,
	}

	c.JSON(http.StatusOK, meta)
}

func escapeJSON(s string) string {
	// Basic JSON string escaping
	result := ""
	for _, r := range s {
		switch r {
		case '"':
			result += `\"`
		case '\\':
			result += `\\`
		case '\n':
			result += `\n`
		case '\r':
			result += `\r`
		case '\t':
			result += `\t`
		default:
			result += string(r)
		}
	}
	return result
}
