# PWA Icons

This directory should contain PWA icons in the following sizes:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Generating Icons

You can generate these icons from a single source image using tools like:

1. **PWA Asset Generator** (npm package):
   ```bash
   npx pwa-asset-generator source-logo.png ./public/pwa-icons
   ```

2. **Online Tools**:
   - https://www.pwabuilder.com/imageGenerator
   - https://realfavicongenerator.net/

3. **Manual Creation**:
   - Create a 512x512px base image with the Tissaia "T" logo
   - Use image editing software to resize to each required dimension
   - Save as PNG with transparency

## Icon Requirements

- Format: PNG with transparency
- Background: Transparent or #050a0a (dark background color)
- Logo: Tissaia neon green (#00ffa3) "T" symbol
- Design: Simple, recognizable at small sizes
- Purpose: "any maskable" for 192x192 and 512x512
