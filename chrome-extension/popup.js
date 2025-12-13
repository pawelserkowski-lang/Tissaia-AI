/**
 * Chrome Extension Popup Script
 */

// DOM elements
const captureBtn = document.getElementById('captureBtn');
const openEditorBtn = document.getElementById('openEditorBtn');
const settingsBtn = document.getElementById('settingsBtn');
const preview = document.getElementById('preview');
const status = document.getElementById('status');

/**
 * Initialize popup
 */
async function init() {
  // Check for pending actions
  const { pendingAction, pendingImage } = await chrome.storage.local.get([
    'pendingAction',
    'pendingImage',
  ]);

  if (pendingAction && pendingImage) {
    showPreview(pendingImage);
    showStatus(`Ready to ${pendingAction} image`);

    // Clear pending action
    await chrome.storage.local.remove(['pendingAction', 'pendingImage']);
  }
}

/**
 * Capture screenshot
 */
captureBtn.addEventListener('click', async () => {
  try {
    showStatus('Capturing screenshot...');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
    });

    showPreview(dataUrl);
    showStatus('Screenshot captured! Click "Open Editor" to process.');
  } catch (error) {
    showStatus(`Error: ${error.message}`, true);
  }
});

/**
 * Open editor in new tab
 */
openEditorBtn.addEventListener('click', async () => {
  const url = chrome.runtime.getURL('dist/index.html');
  await chrome.tabs.create({ url });
  window.close();
});

/**
 * Open settings
 */
settingsBtn.addEventListener('click', () => {
  // Open options page
  chrome.runtime.openOptionsPage();
});

/**
 * Show preview
 */
function showPreview(dataUrl) {
  preview.innerHTML = `<img src="${dataUrl}" alt="Preview">`;
  preview.style.display = 'block';
}

/**
 * Show status message
 */
function showStatus(message, isError = false) {
  status.textContent = message;
  status.style.display = 'block';
  status.style.background = isError ? '#991b1b' : '#1e293b';
}

// Initialize
init();
