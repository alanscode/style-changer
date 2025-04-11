// background.js
// Keeps the extension alive while a prompt is processing in the popup

chrome.runtime.onConnect.addListener(function(port) {
  if (port.name === "keepAlive") {
    // Set a timeout to disconnect after 3 minutes (180000 ms)
    const timeout = setTimeout(() => {
      try { port.disconnect(); } catch (e) {}
    }, 180000);

    port.onDisconnect.addListener(() => {
      clearTimeout(timeout);
    });
  }
});