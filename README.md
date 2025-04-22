# AI CSS Styler Chrome Extension

## Description

This Chrome extension allows users to dynamically restyle websites using natural language prompts processed by an AI backend. It injects custom CSS into the current page based on user requests or manually edited styles, saving preferences on a per-site basis.

<p align="center">
  <img src="https://github.com/user-attachments/assets/993a2070-218b-4ee2-83ed-32b56788c048" alt="Extension Screenshot" width="500"/>
  <br/>
 Example Prompt: "Make the page look like a retro 1980s arcade game interface, with a black (#000000) background, neon pink (#FF00FF), electric blue (#00FFFF), lime green (#32CD32), bright yellow (#FFFF00), vibrant orange (#FFA500), deep purple (#800080), or similar colors, pixel borders, and animated glowing buttons."
</p>

## Features

- **AI-Powered Restyling:** Describe the desired look and feel in a prompt, and the AI backend generates corresponding CSS.
- **Site-Specific Styles:** Custom styles are automatically saved and loaded for each website visited using `localStorage`.
- **Enable/Disable Toggle:** Easily turn the custom styling on or off for the current tab via the popup.
- **Manual CSS Editor:** View and edit the generated or custom CSS directly within the popup using a CodeMirror editor.
- **CSS Management:** Copy the current site's CSS to the clipboard or delete it entirely.
- **Backend Integration:** Communicates with a local backend server to handle AI prompt processing.

## How it Works

1.  **Popup (`popup.html`, `popup.js`):** Provides the user interface for entering prompts, toggling styles, and accessing the CSS editor.
2.  **Content Script (`content.js`):** Injected into web pages. It manages the application of styles, communicates with the popup, interacts with `localStorage`, sanitizes page HTML, and sends requests to the backend server.
3.  **Background Script (`background.js`):** A simple service worker primarily used to keep the extension alive during potentially long-running AI requests initiated from the popup.
4.  **Backend Server (External):** A separate server (expected to run at `http://localhost:8000/restyle`) receives the user prompt and sanitized HTML structure from the content script, processes it using an AI model, and returns the generated CSS.
5.  **Manifest (`manifest.json`):** Defines the extension's structure, permissions (activeTab, storage, scripting, host permissions for the backend and all URLs), and components.

## Setup

1.  **Clone the Repository:** Ensure you have the project files.
2.  **Run the Backend Server:** This extension requires a separate backend server running locally. Navigate to the `chrome-extensions/style-changer-server` directory in your terminal, install dependencies (`uv pip install -r requirements.txt`), and run the server (e.g., `uvicorn server-claude:app --reload --port 8000`). Ensure it's accessible at `http://localhost:8000`.
3.  **Load the Extension in Chrome:**
    - Open Chrome and navigate to `chrome://extensions/`.
    - Enable "Developer mode" in the top right corner.
    - Click "Load unpacked".
    - Select the `chrome-extensions/style-changer` directory (the one containing `manifest.json`).

## Usage

1.  Navigate to the website you want to restyle.
2.  Click the AI CSS Restyler extension icon in your Chrome toolbar to open the popup.
3.  **To Restyle with AI:**
    - Enter a descriptive prompt in the text area (e.g., "Make this page look like a dark-themed code editor").
    - Click the "Restyle Page" button.
    - Wait for the processing to complete. The new styles will be applied automatically.
4.  **To Toggle Styles:**
    - Use the "Enable Custom Styling" toggle switch at the top of the popup.
5.  **To Manually Edit Styles:**
    - Click the "Edit Custom Styles (CSS)" link.
    - The CodeMirror editor will appear, showing the current CSS for the site.
    - Make your changes.
    - Click "Save Changes" (which replaces the "Edit" link when the editor is open) to apply and save the modified CSS.
    - Click "Cancel" to discard changes and hide the editor.
    - Click "Copy" to copy the CSS to your clipboard.
    - Click "Delete" to remove all custom styles for the current site.

## File Structure

```
chrome-extensions/style-changer/
├── background.js       # Service worker for keep-alive functionality.
├── content.js          # Injects styles, interacts with page and backend.
├── icon*.png           # Extension icons.
├── lib/                # Third-party libraries (CodeMirror).
├── manifest.json       # Extension configuration file.
├── popup.html          # Popup UI structure.
├── popup.js            # Popup UI logic and event handling.
├── README.md           # This file.
└── style.css           # CSS for the popup UI itself.
```
