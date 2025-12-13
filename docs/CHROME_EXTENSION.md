# Chrome Extension Guide

<div align="center">

![Chrome](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome)
![Manifest](https://img.shields.io/badge/Manifest-V3-00ffa3?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Ready-green?style=for-the-badge)

**Complete guide for installing, using, and developing the Tissaia AI Chrome Extension.**

</div>

---

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Features](#features)
- [Usage](#usage)
- [Configuration](#configuration)
- [Development](#development)
- [Publishing](#publishing)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Tissaia AI Chrome Extension allows you to analyze and restore images directly from any webpage. Right-click on any image to send it to Tissaia for processing.

### Key Features

| Feature | Description |
|---------|-------------|
| **Context Menu Integration** | Right-click any image to analyze |
| **Screenshot Capture** | Capture visible area or full page |
| **Keyboard Shortcuts** | Quick access with `Ctrl+Shift+S` |
| **Popup Interface** | View recent analyses and settings |
| **Background Processing** | Process images without leaving the page |

---

## Installation

### Method 1: Manual Installation (Development)

1. **Build the Extension**
   ```bash
   npm run build
   ```

2. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Or: Menu > More Tools > Extensions

3. **Enable Developer Mode**
   - Toggle "Developer mode" in the top right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the `chrome-extension` directory

5. **Verify Installation**
   - Look for the Tissaia icon in your toolbar
   - Click to open the popup

### Method 2: From Chrome Web Store (Coming Soon)

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore)
2. Search for "Tissaia AI"
3. Click "Add to Chrome"
4. Click "Add extension" to confirm

---

## Features

### Context Menu

Right-click on any image to access Tissaia features:

```
┌─────────────────────────────────────┐
│  Tissaia AI                     >   │
│  ├─ Analyze image                   │
│  ├─ Restore image                   │
│  ├─ Capture visible area            │
│  └─ Capture full page               │
└─────────────────────────────────────┘
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+S` (Win/Linux) | Capture screenshot |
| `Cmd+Shift+S` (Mac) | Capture screenshot |
| `Ctrl+Shift+E` | Open editor |

**Customize shortcuts:**
1. Go to `chrome://extensions/shortcuts`
2. Find "Tissaia AI"
3. Click the pencil icon to edit

### Popup Interface

```
┌─────────────────────────────────────────────────┐
│  TISSAIA AI                              [≡]    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Status: Connected ●                            │
│  API: http://localhost:3001                     │
│                                                 │
│  [📸 Capture Screenshot]                        │
│                                                 │
│  [📁 Open Editor]                               │
│                                                 │
│  [⚙️ Settings]                                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Usage

### Analyze an Image from Webpage

1. **Find an image** on any webpage
2. **Right-click** on the image
3. **Select** "Analyze image with Tissaia AI"
4. **Wait** for the analysis to complete
5. **View results** in the extension popup or Tissaia app

### Capture Screenshot

1. Click the Tissaia icon in the toolbar
2. Select "Capture Screenshot"
3. Choose "Visible area" or "Full page"
4. The screenshot will load in the editor

### Quick Workflow

```
1. Browse to webpage with image
2. Right-click image > "Analyze image"
3. View detected photos in popup
4. Click "Open in App" for full restoration
```

---

## Configuration

### Extension Settings

Access via popup > Settings (⚙️ icon):

| Setting | Description | Default |
|---------|-------------|---------|
| `API URL` | Tissaia backend URL | `http://localhost:3001` |
| `Auto-analyze` | Analyze on image click | `false` |
| `Notifications` | Show completion alerts | `true` |
| `Theme` | Extension theme | `dark` |

### Permissions Required

| Permission | Why Needed |
|------------|------------|
| `activeTab` | Access current tab for screenshots |
| `contextMenus` | Add right-click menu options |
| `storage` | Save settings and history |
| `tabs` | Manage tabs and capture |
| `downloads` | Download processed images |
| `<all_urls>` | Access images on any website |

---

## Development

### Project Structure

```
chrome-extension/
├── manifest.json       # Extension configuration
├── background.js       # Service worker
├── content.js          # Content script (runs on pages)
├── popup.html          # Popup UI
├── popup.js            # Popup logic
├── popup.css           # Popup styles
└── icons/              # Extension icons
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-48.png
    └── icon-128.png
```

### manifest.json

```json
{
  "manifest_version": 3,
  "name": "Tissaia AI",
  "version": "1.0.0",
  "description": "AI-powered photo analysis and restoration",

  "permissions": [
    "activeTab",
    "contextMenus",
    "storage",
    "tabs",
    "downloads"
  ],

  "host_permissions": [
    "<all_urls>"
  ],

  "background": {
    "service_worker": "background.js"
  },

  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },

  "commands": {
    "capture-screenshot": {
      "suggested_key": {
        "default": "Ctrl+Shift+S",
        "mac": "Command+Shift+S"
      },
      "description": "Capture screenshot"
    }
  }
}
```

### Building

```bash
# Build the main app (extension uses built files)
npm run build

# Extension ready in chrome-extension/
```

### Testing

1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon (↻) on Tissaia AI
4. Test your changes

### Debugging

**Background Script:**
1. Go to `chrome://extensions/`
2. Find Tissaia AI
3. Click "service worker" link
4. DevTools will open

**Popup:**
1. Right-click the extension icon
2. Select "Inspect popup"

**Content Script:**
1. Open any webpage
2. Press F12 for DevTools
3. Check Console for logs

### Message Passing

**Send to Background:**
```javascript
chrome.runtime.sendMessage({
  type: 'analyze-image',
  imageUrl: 'https://example.com/image.jpg'
}, (response) => {
  if (response.success) {
    console.log('Analysis result:', response.data);
  }
});
```

**Available Message Types:**
- `analyze-image` - Analyze an image URL
- `restore-image` - Restore an image URL
- `capture-screenshot` - Capture current tab
- `download-image` - Download processed image

---

## Publishing

### Prepare for Submission

1. **Update version** in `manifest.json`
2. **Create promotional assets:**
   - Small icon: 128x128
   - Large tile: 440x280
   - Screenshots: 1280x800

3. **Package the extension:**
   ```bash
   cd chrome-extension
   zip -r ../tissaia-ai-extension.zip . -x "*.git*"
   ```

### Submit to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay one-time $5 developer fee (if not already)
3. Click "New Item"
4. Upload the zip file
5. Fill in listing details:
   - Description
   - Screenshots
   - Category: Productivity
   - Privacy policy URL
6. Submit for review

### Review Process

| Stage | Duration |
|-------|----------|
| Initial review | 1-3 days |
| Updates | Usually faster |
| Rejection | Check email for feedback |

---

## Troubleshooting

### Extension Not Loading

**Symptoms:** Extension doesn't appear after loading

**Solutions:**
1. Check for errors in `chrome://extensions/`
2. Verify `manifest.json` is valid JSON
3. Ensure all required files exist
4. Reload the extension

### Screenshots Not Capturing

**Symptoms:** Capture button doesn't work

**Solutions:**
1. Check `activeTab` permission is granted
2. Reload the extension
3. Check console for errors

### Context Menu Missing

**Symptoms:** Right-click options not showing

**Solutions:**
1. Verify `contextMenus` permission
2. Check if background script is running
3. Reload the extension

### Images Not Processing

**Symptoms:** Analyze/restore doesn't work

**Solutions:**
1. Check network requests in DevTools
2. Verify API endpoints are accessible
3. Check for CORS issues
4. Ensure backend is running

---

## Security & Privacy

### Best Practices

1. **Content Security Policy** - Use strict CSP
2. **Minimal Permissions** - Request only what's needed
3. **Data Privacy** - Don't collect unnecessary data
4. **HTTPS Only** - Use secure connections
5. **Input Validation** - Sanitize all inputs

### Privacy Statement

The extension:
- **Does NOT** collect personal data
- **Does NOT** track browsing history
- **Only** sends selected images to configured API
- **Stores** settings locally on your device

---

## API Reference

### Storage API

```javascript
// Save data
chrome.storage.local.set({
  pendingAction: 'analyze',
  pendingImage: base64Data
});

// Retrieve data
const data = await chrome.storage.local.get(['pendingAction', 'pendingImage']);
```

### Screenshot API

```javascript
chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
  // dataUrl contains base64 screenshot
});
```

---

## Support

| Resource | Link |
|----------|------|
| GitHub Issues | [Report bugs](https://github.com/your-repo/Tissaia-AI/issues) |
| Documentation | [docs/](../docs/) |
| Email | support@tissaia-ai.com |

---

<div align="center">

**[Back to README](../README.md)** | **[API Documentation](API_DOCUMENTATION.md)** | **[Contributing](CONTRIBUTING.md)**

</div>
