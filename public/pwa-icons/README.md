# PWA Icons Guide

<div align="center">

![PWA](https://img.shields.io/badge/PWA-Ready-00ffa3?style=for-the-badge)
![Icons](https://img.shields.io/badge/Icons-8%20Sizes-blue?style=for-the-badge)

**Guidelines for Progressive Web App icons in Tissaia AI.**

</div>

---

## Table of Contents

- [Overview](#overview)
- [Required Icon Sizes](#required-icon-sizes)
- [Icon Specifications](#icon-specifications)
- [Generating Icons](#generating-icons)
- [Manifest Configuration](#manifest-configuration)
- [Testing Icons](#testing-icons)

---

## Overview

PWA icons are essential for providing a native app-like experience when users install Tissaia AI on their devices. These icons appear on home screens, app launchers, splash screens, and in browser tabs.

---

## Required Icon Sizes

This directory should contain icons in the following sizes:

| File | Size | Purpose |
|------|------|---------|
| `icon-72x72.png` | 72x72 | Android legacy |
| `icon-96x96.png` | 96x96 | Android legacy |
| `icon-128x128.png` | 128x128 | Chrome Web Store |
| `icon-144x144.png` | 144x144 | iOS splash screen |
| `icon-152x152.png` | 152x152 | iPad |
| `icon-192x192.png` | 192x192 | Android standard (required) |
| `icon-384x384.png` | 384x384 | Android 2x display |
| `icon-512x512.png` | 512x512 | Android splash (required) |

### Critical Icons

The following sizes are **required** for PWA functionality:

- **192x192** - Standard Android icon
- **512x512** - Splash screen and high-DPI displays

---

## Icon Specifications

### Design Requirements

| Property | Value | Notes |
|----------|-------|-------|
| **Format** | PNG | Required for transparency |
| **Background** | Transparent or `#050a0a` | Match app theme |
| **Safe Zone** | 80% center | Content should be in center 80% |
| **Padding** | 10% minimum | Prevent edge clipping |
| **Color** | `#00ffa3` (Tissaia Neon) | Primary logo color |

### Design Guidelines

```
┌────────────────────────────────────────┐
│                                        │
│   ┌────────────────────────────────┐   │
│   │         10% padding            │   │
│   │   ┌────────────────────────┐   │   │
│   │   │                        │   │   │
│   │   │    Safe Zone (80%)     │   │   │
│   │   │                        │   │   │
│   │   │         T              │   │   │
│   │   │    (Tissaia logo)      │   │   │
│   │   │                        │   │   │
│   │   └────────────────────────┘   │   │
│   │         10% padding            │   │
│   └────────────────────────────────┘   │
│                                        │
└────────────────────────────────────────┘
```

### Maskable Icons

For Android adaptive icons, the 192x192 and 512x512 icons should include:
- Safe zone content (inner 80%)
- Full background color extending to edges

```json
{
  "src": "pwa-icons/icon-192x192.png",
  "sizes": "192x192",
  "type": "image/png",
  "purpose": "any maskable"
}
```

---

## Generating Icons

### Method 1: PWA Asset Generator (Recommended)

Using the npm package for automatic generation:

```bash
# Install globally
npm install -g pwa-asset-generator

# Generate from source logo
npx pwa-asset-generator ./source-logo.png ./public/pwa-icons \
  --background "#050a0a" \
  --scrape false \
  --padding "10%" \
  --quality 100

# Or with transparent background
npx pwa-asset-generator ./source-logo.png ./public/pwa-icons \
  --transparent \
  --scrape false \
  --padding "10%"
```

### Method 2: Online Tools

Use these web-based generators:

| Tool | URL | Features |
|------|-----|----------|
| PWA Builder | https://www.pwabuilder.com/imageGenerator | Full PWA support |
| Real Favicon Generator | https://realfavicongenerator.net/ | Cross-platform |
| Favicon.io | https://favicon.io/ | Simple generation |
| App Icon Generator | https://appicon.co/ | Multiple platforms |

### Method 3: Manual Creation

Using image editing software:

1. **Create base image**
   - Size: 512x512px
   - Design the Tissaia "T" logo
   - Center in safe zone (inner 80%)

2. **Export sizes**
   - Export PNG with transparency
   - Resize to each required dimension
   - Use high-quality resampling (Lanczos/Bicubic)

3. **Verify quality**
   - Check each size is crisp
   - Ensure no compression artifacts
   - Test at 100% zoom

### Method 4: Using ImageMagick

```bash
#!/bin/bash
# generate-icons.sh

SOURCE="source-logo.png"
SIZES=(72 96 128 144 152 192 384 512)

for size in "${SIZES[@]}"; do
  convert "$SOURCE" \
    -resize ${size}x${size} \
    -gravity center \
    -background "#050a0a" \
    -extent ${size}x${size} \
    "icon-${size}x${size}.png"
done

echo "Generated ${#SIZES[@]} icons"
```

---

## Manifest Configuration

### manifest.json Icons Array

```json
{
  "icons": [
    {
      "src": "pwa-icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "pwa-icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "pwa-icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "pwa-icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "pwa-icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "pwa-icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "pwa-icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "pwa-icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Complete manifest.json Example

```json
{
  "name": "Tissaia AI - Photo Restoration",
  "short_name": "Tissaia",
  "description": "AI-powered photo restoration and analysis dashboard",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#050a0a",
  "theme_color": "#00ffa3",
  "orientation": "portrait-primary",
  "icons": [
    // ... icons array from above
  ]
}
```

---

## Testing Icons

### Chrome DevTools

1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Manifest** in sidebar
4. Verify all icons are loading
5. Check for warnings

### Lighthouse Audit

```bash
# Run Lighthouse PWA audit
npx lighthouse http://localhost:5174 --only-categories=pwa
```

Check for:
- ✅ Has a 192x192 pixel icon
- ✅ Has a 512x512 pixel icon
- ✅ Manifest contains icons with purpose

### Visual Testing

Test on actual devices:

| Platform | How to Test |
|----------|-------------|
| Android | Install PWA, check home screen |
| iOS | Add to Home Screen via Safari |
| Windows | Install via Chrome/Edge |
| macOS | Install via Chrome |

### Maskable Icon Testing

Use the Maskable.app tool:
- https://maskable.app/editor

Upload your 512x512 icon and verify:
- Content stays within safe zone
- Icon looks good in all mask shapes (circle, squircle, rounded rect)

---

## Troubleshooting

### Icons Not Appearing

**Issue:** Icons don't show after installation

**Solutions:**
1. Clear browser cache
2. Uninstall and reinstall PWA
3. Verify manifest.json paths are correct
4. Check Network tab for 404 errors

### Blurry Icons

**Issue:** Icons appear pixelated

**Solutions:**
1. Ensure source image is 512x512 or larger
2. Use PNG format, not JPEG
3. Avoid upscaling smaller images
4. Use proper resampling when resizing

### Wrong Icon Displayed

**Issue:** Old icon showing instead of new

**Solutions:**
1. Update icon version in manifest:
   ```json
   "icons": [
     {
       "src": "pwa-icons/icon-192x192.png?v=2",
       ...
     }
   ]
   ```
2. Clear service worker cache
3. Force refresh (Ctrl+Shift+R)

---

## Brand Guidelines

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Tissaia Neon | `#00ffa3` | Primary logo/icon color |
| Dark Background | `#050a0a` | Icon background |
| Glass Border | `rgba(0,255,163,0.2)` | Subtle highlights |

### Logo Variations

For different sizes, consider:
- **Large (384+):** Full logo with detail
- **Medium (128-192):** Simplified logo
- **Small (72-96):** Icon only, minimal detail

---

## File Checklist

Verify all required files exist:

```
public/pwa-icons/
├── icon-72x72.png     ☐
├── icon-96x96.png     ☐
├── icon-128x128.png   ☐
├── icon-144x144.png   ☐
├── icon-152x152.png   ☐
├── icon-192x192.png   ☐ (required)
├── icon-384x384.png   ☐
├── icon-512x512.png   ☐ (required)
└── README.md          ☑
```

---

<div align="center">

**[Back to README](../../README.md)** | **[PWA Documentation](https://web.dev/progressive-web-apps/)**

</div>
