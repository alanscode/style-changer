// popup.js
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('enableStylesToggle');
  const restylePrompt = document.getElementById('restylePrompt');
  const restyleSubmit = document.getElementById('restyleSubmit');
  const statusMessage = document.getElementById('statusMessage');
  const randomThemeBtn = document.getElementById('randomTheme');

  // --- Helper Function to Send Message to Active Tab ---
  function sendMessageToActiveTab(message, callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError.message);
            if (callback) callback({ error: chrome.runtime.lastError.message });
          } else {
            if (callback) callback(response);
          }
        });
      } else {
        console.log("No active tab found.");
        if (callback) callback({ error: "No active tab found." });
      }
    });
  }

  // --- Helper Function to Update Status ---
  function updateStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message'; // Reset classes
    if (message) {
      statusMessage.classList.add(isError ? 'error' : 'success');
    }
  }

  // --- Load Initial State for Toggle ---
  // Migrate old key if present, otherwise use new key
  chrome.storage.local.get(['stylesEnabled', 'stylesDisabled'], (result) => {
    if (typeof result.stylesEnabled === "boolean") {
      toggle.checked = result.stylesEnabled;
    } else if (typeof result.stylesDisabled === "boolean") {
      // Migrate: invert old value
      toggle.checked = !result.stylesDisabled;
      chrome.storage.local.set({ stylesEnabled: !result.stylesDisabled });
      chrome.storage.local.remove('stylesDisabled');
    } else {
      toggle.checked = true; // Default: enabled
      chrome.storage.local.set({ stylesEnabled: true });
    }
  });

  // --- Toggle Change Listener ---
  toggle.addEventListener('change', () => {
    const isEnabled = toggle.checked;
    updateStatus(''); // Clear status on toggle change

    // Save the new state
    chrome.storage.local.set({ stylesEnabled: isEnabled }, () => {
      console.log('Style enabled state saved:', isEnabled);
    });

    // Send message to active tab's content script
    sendMessageToActiveTab({ action: "toggleStyles", enabled: isEnabled }, (response) => {
      if (response?.error) {
        updateStatus(`Error toggling custom styling: ${response.error}`, true);
      } else {
        console.log("Toggle message sent, response:", response);
        // Optional: update status based on response if needed
      }
    });
  });

  // --- Restyle Button Click Listener ---
  restyleSubmit.addEventListener('click', async () => {
    const promptText = restylePrompt.value.trim();
    if (!promptText) {
      updateStatus("Please enter a prompt.", true);
      return;
    }

    updateStatus("Processing...", false);
    restyleSubmit.disabled = true;

    // --- Keep popup alive using background port ---
    let keepAlivePort = null;
    let keepAliveTimeout = null;
    try {
      keepAlivePort = chrome.runtime.connect({ name: "keepAlive" });
      // Set a 3-minute timeout to auto-close the popup if not finished
      keepAliveTimeout = setTimeout(() => {
        if (keepAlivePort) {
          try { keepAlivePort.disconnect(); } catch (e) {}
          keepAlivePort = null;
          window.close(); // Auto-close popup after 3 minutes
        }
      }, 180000);

      // 1. Send prompt to content script to handle the entire process
      updateStatus("Sending prompt to page...", false);
      const contentResponse = await new Promise((resolve) => {
        sendMessageToActiveTab({ action: "processRestyle", prompt: promptText }, resolve);
      });

      // 2. Check response from content script
      if (contentResponse?.error) {
        throw new Error(contentResponse.error); // Display error from content script
      }

      if (contentResponse?.status === "success") {
        updateStatus("Styles successfully applied by page!", false);
      } else {
        // Handle cases where content script might send back unexpected status or no status
        throw new Error(contentResponse?.status || "Unknown response from page.");
      }

    } catch (error) {
      console.error("Restyle error:", error);
      updateStatus(`Error: ${error.message}`, true);
    } finally {
      restyleSubmit.disabled = false; // Re-enable button regardless of outcome
      if (keepAliveTimeout) clearTimeout(keepAliveTimeout);
      if (keepAlivePort) {
        try { keepAlivePort.disconnect(); } catch (e) {}
        keepAlivePort = null;
      }
    }
  });

  // --- Random Theme Button Click Listener ---
  randomThemeBtn.addEventListener('click', async () => {
    updateStatus("Generating random theme...", false);
    randomThemeBtn.disabled = true;

    try {
      // Send message to content script to trigger random theme
      const contentResponse = await new Promise((resolve) => {
        sendMessageToActiveTab({ action: "randomTheme" }, resolve);
      });

      if (contentResponse?.error) {
        throw new Error(contentResponse.error);
      }

      if (contentResponse?.status === "success") {
        updateStatus("Random theme applied!", false);
      } else {
        throw new Error(contentResponse?.status || "Unknown response from page.");
      }
    } catch (error) {
      console.error("Random theme error:", error);
      updateStatus(`Error: ${error.message}`, true);
    } finally {
      randomThemeBtn.disabled = false;
    }
  });
  });