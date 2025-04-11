/**
 * content.js
 * Applies a hacker/cyber terminal aesthetic.
 * Includes logic for site-specific styles (Reddit, Hacker News) and enable/disable toggle.
 */

const WIDGET_ID = 'hacker-theme-widget'; // More generic ID
const STYLE_ID = 'hacker-theme-style';
const FONT_ID = 'hacker-theme-font-link';

// --- Style Definitions ---

const baseStyles = `
  html, body {
    font-family: 'Fira Mono', 'Share Tech Mono', 'Consolas', monospace !important;
    background: #101010 !important;
    color: #e0e0e0 !important;
    letter-spacing: 1.1px !important;
    transition: all 0.3s !important;
    min-height: 100vh !important;
  }
  body:before { /* Scanlines effect */
    content: "";
    pointer-events: none;
    position: fixed;
    inset: 0;
    z-index: 0;
    background:
      repeating-linear-gradient(0deg, transparent, transparent 29px, #222 30px),
      repeating-linear-gradient(90deg, transparent, transparent 29px, #222 30px);
    opacity: 0.13;
    mix-blend-mode: lighten;
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Share Tech Mono', 'Fira Mono', monospace !important;
    color: #39ff14 !important;
    text-shadow: 0 0 8px #39ff14, 0 0 8px #0ff !important;
    border-bottom: 1.5px solid #39ff14 !important;
    padding-bottom: 4px !important;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  a {
    color: #39ff14 !important;
    text-shadow: 0 0 4px #39ff14;
    border-bottom: 1px dashed #39ff14 !important;
    transition: color 0.2s;
    text-decoration: none !important; /* Remove default underline */
  }
  a:hover, a:focus {
    color: #fff900 !important;
    border-bottom: 1px solid #fff900 !important;
    text-shadow: 0 0 8px #fff900;
  }
  button, input[type="button"], input[type="submit"] {
    background: #181818 !important;
    color: #39ff14 !important;
    border: 2px solid #39ff14 !important;
    border-radius: 0 !important;
    font-family: 'Fira Mono', 'Share Tech Mono', monospace !important;
    font-size: 1em !important;
    box-shadow: 0 0 8px #39ff14 !important;
    text-shadow: 0 0 4px #39ff14;
    padding: 8px 18px !important;
    margin: 4px !important;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    transition: background 0.2s, color 0.2s;
    cursor: pointer;
  }
  button:hover, input[type="button"]:hover, input[type="submit"]:hover {
    background: #39ff14 !important;
    color: #181818 !important;
    border-color: #fff900 !important;
    text-shadow: 0 0 8px #fff900;
  }
  input, textarea, select {
    background: #181818 !important;
    color: #e0e0e0 !important;
    border: 1.5px solid #39ff14 !important;
    border-radius: 0 !important;
    font-family: 'Fira Mono', 'Share Tech Mono', monospace !important;
    font-size: 1em !important;
    box-shadow: 0 0 4px #39ff14 !important;
    padding: 6px 12px !important;
    margin: 2px !important;
    transition: border-color 0.2s;
  }
  input:focus, textarea:focus, select:focus {
    border-color: #fff900 !important;
    outline: none !important;
    box-shadow: 0 0 8px #fff900 !important;
  }
  table, th, td {
    border: 1.5px solid #39ff14 !important;
    background: #181818 !important;
    color: #e0e0e0 !important;
    border-collapse: collapse !important;
    padding: 6px 12px !important;
  }
  code, pre {
    background: #181818 !important;
    color: #39ff14 !important;
    font-family: 'Fira Mono', 'Share Tech Mono', monospace !important;
    border: 1px solid #39ff14 !important;
    border-radius: 0 !important;
    padding: 6px 12px !important;
    font-size: 1em !important;
    box-shadow: 0 0 4px #39ff14 !important;
  }
  ::selection {
    background: #39ff14 !important;
    color: #181818 !important;
  }
  /* General text */
  p, span, div, li, ul, ol, td, th {
    color: #e0e0e0 !important;
    background: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    font-family: 'Fira Mono', 'Share Tech Mono', monospace !important;
  }
  /* Images: subtle neon border */
  img {
    filter: grayscale(0.5) brightness(1.1) contrast(1.1) !important;
    border-radius: 0 !important;
    border: 1px solid #39ff14 !important;
    box-shadow: 0 0 8px #39ff14 !important;
  }
  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 12px;
    background: #181818;
  }
  ::-webkit-scrollbar-thumb {
    background: #39ff14;
    border-radius: 0;
    box-shadow: 0 0 8px #39ff14;
  }
`;

const redditSpecificStyles = `
  /* Reddit Specific Elements - Neon Boxes */
  /* Create Post Button */
  a[href*="/submit"], button[aria-label*="Create Post"] {
    border: 2px solid #39ff14 !important;
    box-shadow: 0 0 8px #39ff14 !important;
    border-radius: 0 !important;
  }
  /* Join Button */
  button[aria-label*="Join community"], button:has(span:contains("Join")) {
    border: 2px solid #39ff14 !important;
    box-shadow: 0 0 8px #39ff14 !important;
    border-radius: 0 !important;
  }
  /* Bell Icon */
  button[aria-label*="Notifications"], #notifications-button {
    border: 2px solid #39ff14 !important;
    box-shadow: 0 0 8px #39ff14 !important;
    border-radius: 0 !important;
    padding: 2px !important;
  }
  /* "..." Menu Trigger */
  button[aria-label*="User menu"], button[id*="profile-menu"] {
     border: 2px solid #39ff14 !important;
     box-shadow: 0 0 8px #39ff14 !important;
     border-radius: 0 !important;
     padding: 2px !important;
  }
  /* Top Search Bar Container */
  div.label-container.without-label.label-container-chips {
     border: 2px solid #39ff14 !important;
     box-shadow: 0 0 8px #39ff14 !important;
     border-radius: 0 !important;
     background: #181818 !important;
     padding-left: 8px !important;
     display: flex !important;
     align-items: center !important;
  }
  /* Actual Search Input inside the container */
  div.label-container.without-label.label-container-chips input[type="search"],
  div.label-container.without-label.label-container-chips input[type="text"] {
     background: transparent !important;
     border: none !important;
     box-shadow: none !important;
     color: #e0e0e0 !important;
     flex-grow: 1 !important;
     padding-left: 8px !important;
  }
  /* Search Icon inside the container */
  div.label-container.without-label.label-container-chips svg {
      color: #39ff14 !important;
      fill: #39ff14 !important;
      flex-shrink: 0 !important;
  }
  /* Star Icons (Awards/Favorites) */
  svg[class*="StarIcon"], i[class*="icon-star"] {
      color: #39ff14 !important;
      fill: #39ff14 !important;
  }
  /* Post Action Buttons (Upvote, Comments, Share, etc.) */
  div[data-testid="post-container"] .buttons button,
  div[data-testid="post-container"] .buttons a,
  div[id^="t3_"] > div:nth-child(2) > div:last-child button,
  div[id^="t3_"] > div:nth-child(2) > div:last-child a {
      background: #181818 !important;
      color: #39ff14 !important;
      border: 1.5px solid #39ff14 !important;
      box-shadow: 0 0 6px #39ff14 !important;
      border-radius: 0 !important;
      padding: 4px 10px !important;
      margin: 2px 4px !important;
      text-transform: none !important;
      letter-spacing: normal !important;
      font-size: 0.9em !important;
      transition: background 0.2s, color 0.2s;
  }
  div[data-testid="post-container"] .buttons button:hover,
  div[data-testid="post-container"] .buttons a:hover,
  div[id^="t3_"] > div:nth-child(2) > div:last-child button:hover,
  div[id^="t3_"] > div:nth-child(2) > div:last-child a:hover {
      background: #39ff14 !important;
      color: #181818 !important;
      border-color: #fff900 !important;
      text-shadow: 0 0 8px #fff900;
  }
  /* Ensure icons within post action buttons are also green */
  div[data-testid="post-container"] .buttons button svg,
  div[data-testid="post-container"] .buttons a svg,
  div[id^="t3_"] > div:nth-child(2) > div:last-child button svg,
  div[id^="t3_"] > div:nth-child(2) > div:last-child a svg {
      fill: #39ff14 !important;
      color: #39ff14 !important;
  }
  div[data-testid="post-container"] .buttons button:hover svg,
  div[data-testid="post-container"] .buttons a:hover svg,
  div[id^="t3_"] > div:nth-child(2) > div:last-child button:hover svg,
  div[id^="t3_"] > div:nth-child(2) > div:last-child a:hover svg {
      fill: #181818 !important;
      color: #181818 !important;
  }
  /* Style common sidebar/left column elements */
  aside, .sidebar, .left-nav, .left-column, #sidebar, #left-column, nav[aria-label*="Primary"] {
    background: #181818 !important;
    color: #39ff14 !important;
    border: 1.5px solid #39ff14 !important;
    border-radius: 0 !important;
    box-shadow: 0 0 8px #39ff14 !important;
    font-family: 'Fira Mono', 'Share Tech Mono', monospace !important;
  }
  aside a, .sidebar a, .left-nav a, .left-column a, #sidebar a, #left-column a, nav[aria-label*="Primary"] a,
  aside a span, .sidebar a span, .left-nav a span, .left-column a span, #sidebar a span, #left-column a span, nav[aria-label*="Primary"] a span {
     color: #39ff14 !important;
     border-bottom: 1px dashed #39ff14 !important;
  }
  /* Remove border from spans if they exist */
  aside a span, .sidebar a span, .left-nav a span, .left-column a span, #sidebar a span, #left-column a span, nav[aria-label*="Primary"] a span {
      border-bottom: none !important;
  }
  aside a:hover, .sidebar a:hover, .left-nav a:hover, .left-column a:hover, #sidebar a:hover, #left-column a:hover, nav[aria-label*="Primary"] a:hover {
     color: #fff900 !important;
     border-bottom: 1px solid #fff900 !important;
  }
  /* Icons within sidebar links */
  aside a svg, .sidebar a svg, .left-nav a svg, .left-column a svg, #sidebar a svg, #left-column a svg, nav[aria-label*="Primary"] a svg,
  aside a i, .sidebar a i, .left-nav a i, .left-column a i, #sidebar a i, #left-column a i, nav[aria-label*="Primary"] a i {
     color: #39ff14 !important;
     fill: #39ff14 !important;
  }
`;

const hackerNewsSpecificStyles = `
  /* Hacker News Specific Styles - Refined */

  /* Ensure base overrides */
  body, html {
    background-color: #101010 !important;
    color: #e0e0e0 !important;
  }
  #hnmain { /* Main table container */
    background-color: #101010 !important;
    width: 85%;
    margin: auto;
  }
  #hnmain table { /* Ensure tables within inherit background */
      background-color: #101010 !important;
  }
  #hnmain > tbody > tr > td { /* General table cells */
      background-color: #101010 !important;
      color: #e0e0e0 !important;
      font-family: 'Fira Mono', 'Share Tech Mono', monospace !important;
  }

  /* Header */
  #hnmain > tbody > tr:first-child > td { /* Header row cell */
     background: #181818 !important;
     border: 1.5px solid #39ff14 !important;
     box-shadow: 0 0 8px #39ff14 !important;
     border-radius: 0 !important;
  }
  #hnmain > tbody > tr:first-child img { /* Logo */
      filter: grayscale(1) brightness(5) !important;
      border: none !important;
      box-shadow: none !important;
  }
  .pagetop, .pagetop b { /* Header text and bold elements */
      color: #e0e0e0 !important;
      font-family: 'Fira Mono', 'Share Tech Mono', monospace !important;
  }
  .pagetop a { /* Header links */
      color: #39ff14 !important;
      text-shadow: 0 0 4px #39ff14;
      border-bottom: 1px dashed #39ff14 !important;
      font-family: 'Fira Mono', 'Share Tech Mono', monospace !important;
  }
  .pagetop a:hover {
      color: #fff900 !important;
      border-bottom: 1px solid #fff900 !important;
      text-shadow: 0 0 8px #fff900;
  }

  /* Story List */
  .itemlist { /* Table containing stories */
      background-color: #101010 !important;
  }
  .itemlist > tbody > tr { /* Each story row container */
      background-color: #101010 !important;
  }
  .itemlist > tbody > tr > td { /* Cells within story rows */
      background-color: #101010 !important;
      color: #e0e0e0 !important;
      vertical-align: top !important;
  }
  .titleline > a { /* Story titles */
    color: #39ff14 !important;
    font-size: 1.1em !important;
    text-shadow: 0 0 4px #39ff14;
    border-bottom: 1px dashed #39ff14 !important;
  }
  .titleline > a:visited {
      color: #2aaa0a !important;
      border-bottom-color: #2aaa0a !important;
  }
  .titleline > a:hover {
      color: #fff900 !important;
      border-bottom: 1px solid #fff900 !important;
      text-shadow: 0 0 8px #fff900;
  }
  .sitebit { /* (domain.com) */
      color: #a0a0a0 !important;
      font-family: 'Fira Mono', 'Share Tech Mono', monospace !important;
  }
  .subtext, .subline { /* Score, user, time, comments link etc. */
      color: #a0a0a0 !important;
      font-size: 0.9em !important;
  }
  .subtext > *, .subline > * { /* Ensure children inherit color */
       color: #a0a0a0 !important;
  }
  .subtext a, .subline a {
      color: #a0a0a0 !important;
      border-bottom: 1px dashed #a0a0a0 !important;
      text-shadow: none !important;
  }
  .subtext a:hover, .subline a:hover {
      color: #fff900 !important;
      border-bottom: 1px solid #fff900 !important;
  }
  .score {
      color: #39ff14 !important; /* Highlight score */
  }
  .rank { /* Story rank number */
      color: #a0a0a0 !important;
      padding-right: 5px !important;
  }
  .votearrow { /* Upvote arrows */
      filter: grayscale(1) brightness(5) !important; /* Make arrows green-ish */
      width: 10px !important;
      height: 10px !important;
      margin: 3px 2px 6px !important;
  }
  td.title { vertical-align: middle !important; } /* Align rank/arrow better */
  td.subtext { padding-top: 2px !important; } /* Adjust subtext spacing */

  /* Comments Page */
  .comment-tree .comment { /* Comment text */
      color: #e0e0e0 !important;
      font-size: 1em !important;
      line-height: 1.4 !important;
  }
  .comment-tree .comment * { /* Ensure children inherit */
       color: #e0e0e0 !important;
       font-family: 'Fira Mono', 'Share Tech Mono', monospace !important;
  }
  .comment-tree .comhead { /* Comment header (user, time) */
      color: #a0a0a0 !important;
      font-size: 0.9em !important;
  }
  .comment-tree .comhead a {
      color: #39ff14 !important; /* Highlight user links */
      border-bottom: 1px dashed #39ff14 !important;
      text-shadow: none !important;
  }
  .comment-tree .comhead a:hover {
      color: #fff900 !important;
      border-bottom: 1px solid #fff900 !important;
  }
  .comment-tree .comment a { /* Links within comments */
       color: #39ff14 !important;
       border-bottom: 1px dashed #39ff14 !important;
       text-shadow: 0 0 4px #39ff14;
  }
   .comment-tree .comment a:hover {
       color: #fff900 !important;
       border-bottom: 1px solid #fff900 !important;
       text-shadow: 0 0 8px #fff900;
   }

  /* Forms */
  textarea, input[type="text"] { /* Comment input, search */
      background: #181818 !important;
      color: #e0e0e0 !important;
      border: 1.5px solid #39ff14 !important;
      border-radius: 0 !important;
      font-family: 'Fira Mono', 'Share Tech Mono', monospace !important;
      box-shadow: 0 0 4px #39ff14 !important;
      padding: 6px 12px !important;
      margin: 2px !important;
  }
   textarea:focus, input[type="text"]:focus {
      border-color: #fff900 !important;
      outline: none !important;
      box-shadow: 0 0 8px #fff900 !important;
   }
  input[type="submit"] { /* Submit button */
      background: #181818 !important;
      color: #39ff14 !important;
      border: 2px solid #39ff14 !important;
      box-shadow: 0 0 8px #39ff14 !important;
      border-radius: 0 !important;
      font-family: 'Fira Mono', 'Share Tech Mono', monospace !important;
      padding: 8px 18px !important;
      margin: 4px !important;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      cursor: pointer;
  }
  input[type="submit"]:hover {
      background: #39ff14 !important;
      color: #181818 !important;
      border-color: #fff900 !important;
  }

  /* Footer */
  .yclinks a {
       color: #a0a0a0 !important;
       border-bottom: 1px dashed #a0a0a0 !important;
  }
   .yclinks a:hover {
       color: #fff900 !important;
       border-bottom: 1px solid #fff900 !important;
   }
   form[action="logout"] input[type="submit"] { /* Logout button specific */
       font-size: 1em !important; /* Override general button style if needed */
   }
`;

// Function to enable the cyber styles
function enableCyberStyles() {
  // Remove any previous style/widget to ensure a clean slate
  disableCyberStyles();

  // --- Floating Widget (Optional - Keep or remove based on preference) ---
  const widget = document.createElement('div');
  widget.id = WIDGET_ID;
  // ... (widget HTML and styling remains the same as before) ...
   widget.innerHTML = `
     <span style="
       font-family: 'Fira Mono', 'Share Tech Mono', 'Consolas', monospace;
       font-size: 1.2em;
       font-weight: 700;
       color: #39ff14;
       background: #181818;
       padding: 10px 24px;
       border: 2px solid #39ff14;
       margin-right: 16px;
       box-shadow: 0 0 8px #39ff14, 0 0 2px #0ff;
       text-shadow: 0 0 4px #39ff14, 0 0 8px #39ff14;
       letter-spacing: 1.5px;
       text-transform: uppercase;
       ">
       HACKER TERMINAL THEME ACTIVE
     </span>
     <button id="rue-close-btn" title="Close"
       style="
         background: #181818;
         border: 2px solid #39ff14;
         color: #39ff14;
         font-size: 1.4em;
         font-family: 'Fira Mono', 'Share Tech Mono', monospace;
         font-weight: 700;
         cursor: pointer;
         line-height: 1;
         padding: 6px 18px;
         box-shadow: 0 0 8px #39ff14;
         text-shadow: 0 0 4px #39ff14;
         margin-left: 8px;
         border-radius: 0;
       ">
       &times;
     </button>
   `;

   Object.assign(widget.style, {
     position: 'fixed',
     bottom: '32px',
     right: '32px',
     zIndex: 99999,
     background: '#181818',
     border: '2px solid #39ff14',
     borderRadius: '0',
     boxShadow: '0 0 24px #39ff14, 0 0 2px #0ff',
     padding: '12px 18px 12px 18px',
     display: 'flex',
     alignItems: 'center',
     fontFamily: "'Fira Mono', 'Share Tech Mono', 'Consolas', monospace",
     fontSize: '1.1em',
     transition: 'opacity 0.3s',
     opacity: '0.99'
   });

   widget.querySelector('#rue-close-btn').onclick = function () {
     widget.style.opacity = '0';
     setTimeout(() => widget.remove(), 300);
   };

  document.body.appendChild(widget); // Add widget regardless of site for now

  // Inject Google Fonts if not already present
  if (!document.getElementById(FONT_ID)) {
      const fontLink = document.createElement('link');
      fontLink.id = FONT_ID;
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Fira+Mono:wght@400;700&family=Share+Tech+Mono&display=swap';
      document.head.appendChild(fontLink);
  }

  // Determine site and apply appropriate styles
  let combinedStyles = baseStyles;
  const hostname = window.location.hostname;

  if (hostname.includes('reddit.com')) {
    console.log("Applying Reddit specific styles");
    combinedStyles += redditSpecificStyles;
  } else if (hostname.includes('news.ycombinator.com')) {
    console.log("Applying Hacker News specific styles");
    combinedStyles += hackerNewsSpecificStyles;
  } else {
      console.log("Applying base styles only to:", hostname);
  }

  // Inject the combined styles
  const styleElement = document.createElement('style');
  styleElement.id = STYLE_ID;
  styleElement.innerHTML = combinedStyles;
  document.head.appendChild(styleElement);
}

// Function to disable the cyber styles
function disableCyberStyles() {
  console.log("Disabling Cyber Styles");
  const styleElement = document.getElementById(STYLE_ID);
  if (styleElement) {
    styleElement.remove();
  }
  const widgetElement = document.getElementById(WIDGET_ID);
  if (widgetElement) {
    widgetElement.remove();
  }
  // Optionally remove font link if desired, or leave for faster re-enable
  // const fontElement = document.getElementById(FONT_ID);
  // if (fontElement) fontElement.remove();
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content script:", request);
  if (request.action === "toggleStyles") {
    if (request.disabled) {
      disableCyberStyles();
      sendResponse({ status: "Styles disabled" });
    } else {
      enableCyberStyles();
      sendResponse({ status: "Styles enabled" });
    }
  }
  // Keep the message channel open for asynchronous response if needed,
  // but in this case, sendResponse is called synchronously within the branches.
  // return true;
});

// Initial load: check storage and apply styles if not disabled
chrome.storage.local.get(['stylesDisabled'], (result) => {
  if (!result.stylesDisabled) {
    enableCyberStyles();
  } else {
      console.log("Cyber styles initially disabled.");
  }
});
