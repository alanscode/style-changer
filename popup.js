// popup.js
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('disableStylesToggle');

  // Load initial state from storage
  chrome.storage.local.get(['stylesDisabled'], (result) => {
    toggle.checked = result.stylesDisabled || false;
  });

  // Add listener for toggle changes
  toggle.addEventListener('change', () => {
    const isDisabled = toggle.checked;

    // Save the new state
    chrome.storage.local.set({ stylesDisabled: isDisabled }, () => {
      console.log('Style disabled state saved:', isDisabled);
    });

    // Send message to active Reddit tab's content script
    chrome.tabs.query({ active: true, currentWindow: true, url: "*://*.reddit.com/*" }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "toggleStyles", disabled: isDisabled }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError.message);
            // Handle error, maybe content script isn't loaded yet
          } else {
            console.log("Message sent to content script, response:", response);
          }
        });
      } else {
        console.log("No active Reddit tab found.");
      }
    });
  });
});