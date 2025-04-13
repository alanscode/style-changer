// popup.js
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("enableStylesToggle");
  const restylePrompt = document.getElementById("restylePrompt");
  const restyleSubmit = document.getElementById("restyleSubmit");
  const statusMessage = document.getElementById("statusMessage");
  const headerSubtitle = document.getElementById("headerSubtitle");

  // Prevent wheel scrolling on the page except in the custom editor
  document.addEventListener(
    "wheel",
    function (event) {
      // Check if the event originated from the custom editor or its children
      let target = event.target;
      let isInEditor = false;

      while (target && target !== document.body) {
        if (
          target.id === "customStylesEditor" ||
          (target.classList && target.classList.contains("CodeMirror"))
        ) {
          isInEditor = true;
          break;
        }
        target = target.parentNode;
      }

      // If not in the editor, prevent scrolling
      if (!isInEditor) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    },
    { passive: false }
  );

  // --- Helper Function to Send Message to Active Tab ---

  // Make popup always large (width 1200px, height 1000px)
  window.resizeTo(1200, 1000);
  function sendMessageToActiveTab(message, callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error sending message:",
              chrome.runtime.lastError.message
            );
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
    statusMessage.className = "status-message"; // Reset classes
    if (message) {
      statusMessage.classList.add(isError ? "error" : "success");
    }
  }

  // --- Update Header Subtitle with Hostname ---
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0 && tabs[0].url) {
      try {
        const url = new URL(tabs[0].url);
        if (headerSubtitle) {
          headerSubtitle.textContent = `AI CSS Restyler: ${url.hostname}`;
        }
      } catch (e) {
        console.error("Error parsing URL for hostname:", e);
        if (headerSubtitle) {
          headerSubtitle.textContent = "Styling: Current Page";
        }
      }
    } else {
      if (headerSubtitle) {
        headerSubtitle.textContent = "Styling: Current Page";
      }
    }
  });

  // --- Load Initial State for Toggle ---
  // Migrate old key if present, otherwise use new key
  chrome.storage.local.get(["stylesEnabled", "stylesDisabled"], (result) => {
    if (typeof result.stylesEnabled === "boolean") {
      toggle.checked = result.stylesEnabled;
    } else if (typeof result.stylesDisabled === "boolean") {
      // Migrate: invert old value
      toggle.checked = !result.stylesDisabled;
      chrome.storage.local.set({ stylesEnabled: !result.stylesDisabled });
      chrome.storage.local.remove("stylesDisabled");
    } else {
      toggle.checked = true; // Default: enabled
      chrome.storage.local.set({ stylesEnabled: true });
    }
  });

  // --- Toggle Change Listener ---
  toggle.addEventListener("change", () => {
    const isEnabled = toggle.checked;
    updateStatus(""); // Clear status on toggle change

    // Save the new state
    chrome.storage.local.set({ stylesEnabled: isEnabled }, () => {
      console.log("Style enabled state saved:", isEnabled);
    });

    // Send message to active tab's content script
    sendMessageToActiveTab(
      { action: "toggleStyles", enabled: isEnabled },
      (response) => {
        if (response?.error) {
          updateStatus(
            `Error toggling custom styling: ${response.error}`,
            true
          );
        } else {
          console.log("Toggle message sent, response:", response);
          // Optional: update status based on response if needed
        }
      }
    );
  });

  // --- Restyle Button Click Listener ---
  restyleSubmit.addEventListener("click", async () => {
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
          try {
            keepAlivePort.disconnect();
          } catch (e) {}
          keepAlivePort = null;
          window.close(); // Auto-close popup after 3 minutes
        }
      }, 180000);

      // 1. Send prompt to content script to handle the entire process
      updateStatus("Sending prompt to page...", false);
      const contentResponse = await new Promise((resolve) => {
        sendMessageToActiveTab(
          { action: "processRestyle", prompt: promptText },
          resolve
        );
      });
      // Force CodeMirror to fill its container
      codeMirrorEditor.setSize("100%", "100%");

      // 2. Check response from content script
      if (contentResponse?.error) {
        throw new Error(contentResponse.error); // Display error from content script
      }

      if (contentResponse?.status === "success") {
        updateStatus("Styles successfully applied by page!", false);
      } else {
        // Handle cases where content script might send back unexpected status or no status
        throw new Error(
          contentResponse?.status || "Unknown response from page."
        );
      }
    } catch (error) {
      console.error("Restyle error:", error);
      updateStatus(`Error: ${error.message}`, true);
    } finally {
      restyleSubmit.disabled = false; // Re-enable button regardless of outcome
      if (keepAliveTimeout) clearTimeout(keepAliveTimeout);
      if (keepAlivePort) {
        try {
          keepAlivePort.disconnect();
        } catch (e) {}
        keepAlivePort = null;
      }
    }
  });

  // --- Custom Styles Editor Logic ---
  // Initialize CodeMirror for rich CSS editing
  let codeMirrorEditor = null;
  const customStylesEditorDiv = document.getElementById("customStylesEditor");

  if (customStylesEditorDiv && window.CodeMirror) {
    codeMirrorEditor = CodeMirror(customStylesEditorDiv, {
      value: "",
      mode: "css",
      theme: "material-darker",
      lineNumbers: true,
      tabSize: 2,
      viewportMargin: Infinity,
      lineWrapping: true,
      autofocus: false,
    });
    // Force CodeMirror to fill its container
    codeMirrorEditor.setSize("100%", "100%");
  }

  // Helper: Load custom styles from localStorage of the active tab and populate CodeMirror
  function loadCustomStylesFromActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs.length) return;
      const tabId = tabs[0].id;
      chrome.scripting.executeScript(
        {
          target: { tabId },
          func: () => {
            try {
              const hostname = window.location.hostname;
              const siteThemeKey = `${hostname}-theme`;
              return localStorage.getItem(siteThemeKey) || "";
            } catch (e) {
              return "";
            }
          },
        },
        (results) => {
          const editStylesSection = document.querySelector(
            ".edit-styles-section"
          );
          let customStylesValue = "";
          if (results && results[0] && typeof results[0].result === "string") {
            customStylesValue = results[0].result;
            if (codeMirrorEditor) {
              codeMirrorEditor.setValue(customStylesValue);
            }
          } else {
            if (codeMirrorEditor) {
              codeMirrorEditor.setValue("");
            }
          }
          // Hide or show the edit-styles-section based on custom styles content
          if (editStylesSection) {
            if (!customStylesValue || customStylesValue.trim().length === 0) {
              editStylesSection.style.display = "none";
            } else {
              editStylesSection.style.display = "";
            }
          }
        }
      );
    });
  }

  // On popup load, populate the custom styles editor from the active tab's localStorage
  if (codeMirrorEditor) {
    // Wait for CodeMirror to initialize before setting value
    setTimeout(() => {
      loadCustomStylesFromActiveTab();

      // After loading, check if there is content and resize popup if needed
      setTimeout(() => {
        // Remove auto-save functionality - will save only when "Save Changes" is clicked
        console.log(
          "Auto-save disabled - will save only when Save Changes is clicked"
        );
      }, 200);
    }, 100);
  }

  // Removed Save button handler as it's no longer needed due to auto-save
  // Copy CSS to clipboard button logic
  const copyBtn = document.getElementById("copyCustomCssBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      if (codeMirrorEditor) {
        try {
          const css = codeMirrorEditor.getValue();
          await navigator.clipboard.writeText(css);
          copyBtn.textContent = "Copied!";
          setTimeout(() => {
            copyBtn.textContent = "Copy";
          }, 1200);
        } catch (err) {
          copyBtn.textContent = "Error";
          setTimeout(() => {
            copyBtn.textContent = "Copy";
          }, 1200);
        }
      }
    });
  }

  // Toggle editor visibility when link is clicked
  const toggleEditorLink = document.getElementById("toggleEditorLink");
  const cancelEditorLink = document.getElementById("cancelEditorLink");
  if (toggleEditorLink) {
    toggleEditorLink.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Toggle editor link clicked");

      const editor = document.getElementById("customStylesEditor");
      const contentElement = document.querySelector(".content");
      const copyButton = document.getElementById("copyCustomCssBtn");

      if (editor && contentElement) {
        // Get computed style to check actual display value
        const computedStyle = window.getComputedStyle(editor);
        const isEditorVisible = computedStyle.display !== "none";

        if (isEditorVisible) {
          // Save changes to localhost before hiding editor
          console.log("Saving changes to localhost");
          try {
            const css = codeMirrorEditor.getValue();
            // Save to chrome.storage.local
            chrome.storage.local.set({ customStyles: css });
            // Send to active tab (localhost)
            sendMessageToActiveTab(
              { action: "updateCustomStyles", css },
              (response) => {
                console.log("Save response:", response);
                updateStatus("Changes saved successfully!", false);

                // Hide editor after saving
                console.log("Hiding editor");
                editor.style.display = "none";
                contentElement.classList.remove("editor-mode");
                toggleEditorLink.textContent = "Edit Custom Styles (CSS)";

                // Hide copy button
                if (copyButton) {
                  copyButton.style.display = "none";
                }

                // Hide cancel link
                if (cancelEditorLink) {
                  cancelEditorLink.style.display = "none";
                }
              }
            );
          } catch (error) {
            console.error("Error saving changes:", error);
            updateStatus("Error saving changes: " + error.message, true);
          }
        } else {
          // Show editor
          console.log("Showing editor");
          editor.style.display = "block";
          contentElement.classList.add("editor-mode");
          toggleEditorLink.textContent = "Save Changes";

          // Show cancel link
          if (cancelEditorLink) {
            cancelEditorLink.style.display = "inline-block";
          }

          // Show copy button
          if (copyButton) {
            copyButton.style.display = "inline-block";
          }

          // Force CodeMirror to refresh after becoming visible
          if (codeMirrorEditor) {
            setTimeout(() => {
              codeMirrorEditor.refresh();
            }, 10);
          }
        }
      }
    });
  }

  // Cancel button functionality
  if (cancelEditorLink) {
    cancelEditorLink.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Cancel link clicked");

      const editor = document.getElementById("customStylesEditor");
      const contentElement = document.querySelector(".content");
      const copyButton = document.getElementById("copyCustomCssBtn");

      if (editor && contentElement) {
        // Reload original content from localStorage (discard changes)
        loadCustomStylesFromActiveTab();

        // Hide editor without saving
        console.log("Hiding editor without saving changes");
        editor.style.display = "none";
        contentElement.classList.remove("editor-mode");
        toggleEditorLink.textContent = "Edit Custom Styles (CSS)";

        // Hide cancel link
        cancelEditorLink.style.display = "none";

        // Hide copy button
        if (copyButton) {
          copyButton.style.display = "none";
        }

        updateStatus("Changes discarded", false);
      }
    });
  }
});
