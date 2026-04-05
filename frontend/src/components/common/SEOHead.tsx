// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useEffect } from 'react'

interface SEOHeadProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
  structuredData?: string
}

const DEFAULT_TITLE = 'PropertyForSale - Premium Real Estate'
const DEFAULT_DESCRIPTION = 'Discover your dream home with immersive 3D experiences and interactive maps. Premium properties beautifully presented.'

export function SEOHead({
  title,
  description,
  image,
  url,
  type = 'website',
  structuredData,
}: SEOHeadProps) {
  const pageTitle = title ? `${title} | PropertyForSale` : DEFAULT_TITLE
  const pageDescription = description || DEFAULT_DESCRIPTION
  const pageUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

  useEffect(() => {
    // Update document title
    document.title = pageTitle

    // Update or create meta tags
    updateMetaTag('description', pageDescription)
    updateMetaTag('og:type', type, 'property')
    updateMetaTag('og:title', pageTitle, 'property')
    updateMetaTag('og:description', pageDescription, 'property')
    updateMetaTag('og:url', pageUrl, 'property')
    updateMetaTag('og:site_name', 'PropertyForSale', 'property')
    if (image) {
      updateMetaTag('og:image', image, 'property')
    }

    updateMetaTag('twitter:card', image ? 'summary_large_image' : 'summary')
    updateMetaTag('twitter:title', pageTitle)
    updateMetaTag('twitter:description', pageDescription)
    if (image) {
      updateMetaTag('twitter:image', image)
    }

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = pageUrl

    // Update structured data
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement
      if (!script) {
        script = document.createElement('script')
        script.type = 'application/ld+json'
        document.head.appendChild(script)
      }
      script.textContent = structuredData
    }
  }, [pageTitle, pageDescription, pageUrl, type, image, structuredData])

  return null
}

function updateMetaTag(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attr, name)
    document.head.appendChild(meta)
  }
  meta.content = content
}
