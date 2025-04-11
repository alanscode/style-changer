// popup.js
console.log("popup.js script started"); // Log 1: Script start

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOMContentLoaded event fired"); // Log 2: DOM ready
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

  // --- Clear Styling Button Click Listener ---
  const clearStylesBtn = document.getElementById('clearStylesBtn');
  console.log("clearStylesBtn element:", clearStylesBtn); // Log 3: Element check
  if (!clearStylesBtn) {
      console.error("Could not find clearStylesBtn element!");
      return; // Stop if button not found
  }
  clearStylesBtn.addEventListener('click', async () => {
    console.log("Clear Styling button clicked!"); // Add this line
    updateStatus("Clearing custom styling...", false);
    clearStylesBtn.disabled = true;

    try {
      // 1. Clear site-specific theme from the page's localStorage using scripting API
      console.log("Attempting to clear page localStorage via executeScript...");
      await new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length === 0) {
            console.error("Clear Styling: No active tab found.");
            return reject(new Error("No active tab found"));
          }
          const tabId = tabs[0].id;
          chrome.scripting.executeScript(
            {
              target: { tabId: tabId },
              func: () => {
                // Set theme key to empty string in the page context
                console.log("[Injected Script] Running localStorage clear...");
                const hostname = window.location.hostname;
                const siteThemeKey = `${hostname}-theme`;
                if (localStorage.getItem(siteThemeKey) !== null) {
                  localStorage.setItem(siteThemeKey, ""); // Set to empty string
                  console.log(`[Injected Script] Cleared localStorage key: ${siteThemeKey}`);
                } else {
                  console.log(`[Injected Script] localStorage key not found: ${siteThemeKey}`);
                }
              }
            },
            (results) => {
              if (chrome.runtime.lastError) {
                console.error("executeScript failed:", chrome.runtime.lastError.message);
                return reject(new Error(`Failed to execute script: ${chrome.runtime.lastError.message}`));
              }
              console.log("executeScript finished.", results);
              resolve();
            }
          );
        });
      });
      console.log("Page localStorage clear attempt finished.");

      // 2. Send message to content script to remove styles from the current page
      console.log("Sending clearCustomStyles message to content script...");
      await new Promise((resolve, reject) => {
        sendMessageToActiveTab({ action: "clearCustomStyles" }, (response) => {
          if (response?.error) {
            console.error("Error response from content script (clearCustomStyles):", response.error);
            reject(new Error(response.error));
          } else {
            console.log("Content script responded to clearCustomStyles.");
            resolve(response);
          }
        });
      });

      // 3. Disable custom styling in extension storage
      console.log("Setting stylesEnabled to false in chrome.storage...");
      await new Promise((resolve) => {
        chrome.storage.local.set({ stylesEnabled: false }, () => {
          console.log("stylesEnabled set to false.");
          // Update the toggle visually
          const toggle = document.getElementById('enableStylesToggle');
          if (toggle) toggle.checked = false;
          resolve();
        });
      });

      updateStatus("Custom styling cleared!", false);

    } catch (error) {
      console.error("Clear styling error:", error);
      updateStatus(`Error clearing styling: ${error.message}`, true);
    } finally {
      clearStylesBtn.disabled = false;
    }
  });