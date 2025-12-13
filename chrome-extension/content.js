/**
 * Chrome Extension Content Script
 * Runs on all web pages to provide context menu and capture functionality
 */

console.log('Tissaia AI content script loaded');

/**
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'get-page-dimensions':
      sendResponse({
        width: Math.max(
          document.body.scrollWidth,
          document.documentElement.scrollWidth
        ),
        height: Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight
        ),
      });
      break;

    case 'scroll-to':
      window.scrollTo(request.x, request.y);
      sendResponse({ success: true });
      break;
  }
});

/**
 * Add visual feedback for image hover
 */
document.addEventListener('contextmenu', (e) => {
  if (e.target.tagName === 'IMG') {
    // Add temporary border to indicate Tissaia AI can process this image
    e.target.style.outline = '2px solid #3b82f6';
    setTimeout(() => {
      e.target.style.outline = '';
    }, 300);
  }
});

/**
 * Keyboard shortcut helper
 */
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Shift + S for screenshot
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
    e.preventDefault();
    chrome.runtime.sendMessage({ type: 'capture-screenshot' });
  }

  // Ctrl/Cmd + Shift + E for editor
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
    e.preventDefault();
    chrome.runtime.sendMessage({ type: 'open-editor' });
  }
});
