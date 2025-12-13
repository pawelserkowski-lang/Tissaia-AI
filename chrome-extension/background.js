/**
 * Chrome Extension Background Service Worker
 * Handles context menus, commands, and messaging
 */

// Context menu items
const CONTEXT_MENU_IDS = {
  ANALYZE_IMAGE: 'analyze-image',
  RESTORE_IMAGE: 'restore-image',
  CAPTURE_VISIBLE: 'capture-visible',
  CAPTURE_FULL: 'capture-full',
};

/**
 * Initialize extension
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('Tissaia AI Extension installed');

  // Create context menus
  chrome.contextMenus.create({
    id: CONTEXT_MENU_IDS.ANALYZE_IMAGE,
    title: 'Analyze image with Tissaia AI',
    contexts: ['image'],
  });

  chrome.contextMenus.create({
    id: CONTEXT_MENU_IDS.RESTORE_IMAGE,
    title: 'Restore image with Tissaia AI',
    contexts: ['image'],
  });

  chrome.contextMenus.create({
    id: CONTEXT_MENU_IDS.CAPTURE_VISIBLE,
    title: 'Capture visible area',
    contexts: ['page'],
  });

  chrome.contextMenus.create({
    id: CONTEXT_MENU_IDS.CAPTURE_FULL,
    title: 'Capture full page',
    contexts: ['page'],
  });
});

/**
 * Handle context menu clicks
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case CONTEXT_MENU_IDS.ANALYZE_IMAGE:
      await handleAnalyzeImage(info.srcUrl, tab);
      break;

    case CONTEXT_MENU_IDS.RESTORE_IMAGE:
      await handleRestoreImage(info.srcUrl, tab);
      break;

    case CONTEXT_MENU_IDS.CAPTURE_VISIBLE:
      await captureVisibleTab(tab);
      break;

    case CONTEXT_MENU_IDS.CAPTURE_FULL:
      await captureFullPage(tab);
      break;
  }
});

/**
 * Handle keyboard commands
 */
chrome.commands.onCommand.addListener(async (command, tab) => {
  switch (command) {
    case 'capture-screenshot':
      await captureVisibleTab(tab);
      break;

    case 'open-editor':
      await openEditor();
      break;
  }
});

/**
 * Handle messages from content script and popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'analyze-image':
      handleAnalyzeImage(request.imageUrl, sender.tab)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case 'restore-image':
      handleRestoreImage(request.imageUrl, sender.tab)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case 'capture-screenshot':
      captureVisibleTab(sender.tab)
        .then((dataUrl) => sendResponse({ success: true, dataUrl }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case 'download-image':
      downloadImage(request.dataUrl, request.filename)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;
  }
});

/**
 * Analyze image
 */
async function handleAnalyzeImage(imageUrl, tab) {
  // Fetch image
  const response = await fetch(imageUrl);
  const blob = await response.blob();

  // Convert to base64
  const base64 = await blobToBase64(blob);

  // Open popup with image
  await chrome.storage.local.set({
    pendingAction: 'analyze',
    pendingImage: base64,
  });

  await chrome.action.openPopup();
}

/**
 * Restore image
 */
async function handleRestoreImage(imageUrl, tab) {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const base64 = await blobToBase64(blob);

  await chrome.storage.local.set({
    pendingAction: 'restore',
    pendingImage: base64,
  });

  await chrome.action.openPopup();
}

/**
 * Capture visible tab area
 */
async function captureVisibleTab(tab) {
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
    format: 'png',
  });

  await chrome.storage.local.set({
    pendingAction: 'capture',
    pendingImage: dataUrl,
  });

  await chrome.action.openPopup();

  return dataUrl;
}

/**
 * Capture full page (requires content script)
 */
async function captureFullPage(tab) {
  // Inject content script to get full page dimensions
  const [{ result: dimensions }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => ({
      width: Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth
      ),
      height: Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      ),
    }),
  });

  // Capture multiple screenshots and stitch together
  // (Simplified version - full implementation would handle scrolling)
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
    format: 'png',
  });

  await chrome.storage.local.set({
    pendingAction: 'capture',
    pendingImage: dataUrl,
  });

  await chrome.action.openPopup();
}

/**
 * Open editor in new tab
 */
async function openEditor() {
  await chrome.tabs.create({
    url: chrome.runtime.getURL('dist/index.html'),
  });
}

/**
 * Download image
 */
async function downloadImage(dataUrl, filename = 'tissaia-result.png') {
  await chrome.downloads.download({
    url: dataUrl,
    filename,
    saveAs: true,
  });
}

/**
 * Convert blob to base64
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
