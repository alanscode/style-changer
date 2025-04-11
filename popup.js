// popup.js
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('disableStylesToggle');
  const restylePrompt = document.getElementById('restylePrompt');
  const restyleSubmit = document.getElementById('restyleSubmit');
  const statusMessage = document.getElementById('statusMessage');

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
  chrome.storage.local.get(['stylesDisabled'], (result) => {
    toggle.checked = result.stylesDisabled || false;
  });

  // --- Toggle Change Listener ---
  toggle.addEventListener('change', () => {
    const isDisabled = toggle.checked;
    updateStatus(''); // Clear status on toggle change

    // Save the new state
    chrome.storage.local.set({ stylesDisabled: isDisabled }, () => {
      console.log('Style disabled state saved:', isDisabled);
    });

    // Send message to active tab's content script
    sendMessageToActiveTab({ action: "toggleStyles", disabled: isDisabled }, (response) => {
      if (response?.error) {
        updateStatus(`Error toggling styles: ${response.error}`, true);
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

    try {
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
    }
  });
});