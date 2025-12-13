# Tissaia AI - Chrome Extension

This guide explains how to install, use, and develop the Tissaia AI Chrome extension.

## Features

- **Context Menu Integration**: Right-click on any image to analyze or restore
- **Screenshot Capture**: Capture visible area or full page
- **Keyboard Shortcuts**: Quick access with Ctrl+Shift+S and Ctrl+Shift+E
- **Popup Interface**: Quick actions from browser toolbar
- **Background Processing**: Process images without leaving your current page

## Installation

### From Chrome Web Store (Coming Soon)

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore)
2. Search for "Tissaia AI"
3. Click "Add to Chrome"
4. Click "Add extension" to confirm

### Manual Installation (Development)

1. Build the extension:
```bash
npm run build
```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top-right corner)

4. Click "Load unpacked"

5. Select the `chrome-extension` directory

6. The Tissaia AI extension icon will appear in your toolbar

## Usage

### Context Menu

**On Images:**
1. Right-click any image on a web page
2. Select "Analyze image with Tissaia AI" or "Restore image with Tissaia AI"
3. The extension popup will open with the image loaded

**On Pages:**
1. Right-click anywhere on a page
2. Select "Capture visible area" or "Capture full page"
3. The screenshot will be captured and loaded in the popup

### Popup Interface

Click the Tissaia AI icon in your toolbar to:
- **Capture Screenshot**: Take a screenshot of the current tab
- **Open Editor**: Open the full Tissaia AI app in a new tab
- **Settings**: Configure extension preferences

### Keyboard Shortcuts

- **Ctrl+Shift+S** (Cmd+Shift+S on Mac): Capture screenshot
- **Ctrl+Shift+E** (Cmd+Shift+E on Mac): Open editor

You can customize these shortcuts:
1. Go to `chrome://extensions/shortcuts`
2. Find "Tissaia AI"
3. Click the pencil icon to edit

## Permissions

The extension requires the following permissions:

- **activeTab**: Access the currently active tab for screenshots
- **contextMenus**: Add context menu items
- **storage**: Store preferences and temporary data
- **tabs**: Manage tabs and capture screenshots
- **downloads**: Download processed images
- **\<all_urls\>**: Access images on any website

## Development

### Project Structure

```
chrome-extension/
├── manifest.json       # Extension configuration
├── background.js       # Service worker (background script)
├── content.js         # Content script (runs on pages)
├── popup.html         # Popup UI
├── popup.js           # Popup logic
└── icons/             # Extension icons
```

### Building

```bash
# Build the main app
npm run build

# The extension uses the built files from dist/
```

### Testing

1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Tissaia AI extension
4. Test your changes

### Debugging

**Background Script:**
1. Go to `chrome://extensions/`
2. Find Tissaia AI
3. Click "service worker" link
4. Developer tools will open

**Popup:**
1. Right-click the extension icon
2. Select "Inspect popup"
3. Developer tools will open

**Content Script:**
1. Open any webpage
2. Press F12 to open DevTools
3. Check the console for content script logs

## Architecture

### Background Service Worker

Handles:
- Context menu creation
- Screenshot capture
- Message passing between components
- File downloads

### Content Script

Runs on all web pages:
- Provides visual feedback for images
- Handles keyboard shortcuts
- Communicates with background script

### Popup

Provides quick access to:
- Screenshot capture
- Editor launcher
- Settings

## API Reference

### Message Passing

**To Background Script:**
```javascript
chrome.runtime.sendMessage({
  type: 'capture-screenshot'
}, (response) => {
  if (response.success) {
    console.log('Screenshot captured:', response.dataUrl);
  }
});
```

**Available Message Types:**
- `analyze-image`: Analyze an image URL
- `restore-image`: Restore an image URL
- `capture-screenshot`: Capture current tab
- `download-image`: Download processed image

### Storage

**Save Data:**
```javascript
chrome.storage.local.set({
  pendingAction: 'analyze',
  pendingImage: base64Data
});
```

**Retrieve Data:**
```javascript
const { pendingAction, pendingImage } = await chrome.storage.local.get([
  'pendingAction',
  'pendingImage'
]);
```

## Configuration

### manifest.json

Key configuration options:

```json
{
  "permissions": ["activeTab", "storage", "downloads"],
  "host_permissions": ["<all_urls>"],
  "action": {
    "default_popup": "popup.html"
  },
  "background": {
    "service_worker": "background.js"
  }
}
```

### Commands (Keyboard Shortcuts)

```json
{
  "commands": {
    "capture-screenshot": {
      "suggested_key": {
        "default": "Ctrl+Shift+S",
        "mac": "Command+Shift+S"
      }
    }
  }
}
```

## Publishing

### Prepare for Submission

1. Update version in `manifest.json`
2. Build the production version
3. Create promotional images:
   - Small icon: 128x128
   - Large icon: 440x280
   - Screenshots: 1280x800

4. Zip the extension:
```bash
cd chrome-extension
zip -r ../tissaia-ai-extension.zip .
```

### Submit to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click "New Item"
3. Upload the zip file
4. Fill in the store listing:
   - Description
   - Screenshots
   - Promotional images
   - Category: Productivity
5. Set pricing (free or paid)
6. Submit for review

### Review Process

- Initial review: 1-3 days
- Updates: Usually faster
- Rejections: Check email for feedback

## Troubleshooting

### Extension Not Loading

**Issue**: Extension doesn't appear after loading

**Solutions:**
- Check for errors in `chrome://extensions/`
- Verify manifest.json is valid JSON
- Ensure all required files exist

### Screenshots Not Capturing

**Issue**: Capture screenshot button doesn't work

**Solutions:**
- Check activeTab permission is granted
- Try reloading the extension
- Check browser console for errors

### Context Menu Not Appearing

**Issue**: Right-click menu items missing

**Solutions:**
- Verify contextMenus permission
- Check background script is running
- Reload the extension

### Images Not Processing

**Issue**: Analyze/restore doesn't work

**Solutions:**
- Check network requests in DevTools
- Verify API endpoints are accessible
- Check for CORS issues

## Security

### Best Practices

1. **Content Security Policy**: Use strict CSP
2. **Permissions**: Request minimal permissions
3. **User Data**: Don't collect unnecessarily
4. **HTTPS**: Use secure connections only
5. **Input Validation**: Sanitize all inputs

### Privacy

- No data collection without consent
- No tracking or analytics by default
- Temporary data cleared after use
- Open source for transparency

## Updates

### Auto-Updates

Chrome automatically updates extensions:
- Checks for updates every few hours
- Updates in background
- Users can force check in `chrome://extensions/`

### Version History

See CHANGELOG.md for version history and release notes.

## Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/Tissaia-AI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/Tissaia-AI/discussions)
- **Email**: support@tissaia-ai.com

## Contributing

See CONTRIBUTING.md for guidelines on:
- Code style
- Testing
- Pull requests
- Release process

## License

MIT License - see LICENSE file for details.
