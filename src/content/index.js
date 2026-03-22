import { scrapeManipulativeText } from "../shared/patterns.js";
import { showOverlay } from "./overlay.js";

let hasRun = false;

function isExtensionValid() {
  try { return !!chrome.runtime?.id; } catch { return false; }
}

async function analyze() {
  if (hasRun || !isExtensionValid()) return;

  const items = scrapeManipulativeText();
  console.log("👁 Clarity found items:", items.map(i => i.text));

  if (!items.length) {
    console.log("👁 Clarity: nothing found on this page");
    return;
  }

  hasRun = true;

  // Send all found texts to service worker at once
  chrome.runtime.sendMessage(
    {
      type: "REWRITE_TEXTS",
      payload: {
        domain: location.hostname,
        items: items.map(i => i.text),
      },
    },
    (response) => {
      if (chrome.runtime.lastError || !response?.rewrites) return;

      // Show each rewrite in the overlay
      response.rewrites.forEach((rewrite, i) => {
        if (rewrite && items[i]) {
          setTimeout(() => {
            showOverlay(items[i].text, rewrite);
          }, i * 1500); // stagger cards by 1.5s
        }
      });
    }
  );
}

// Run after page fully loads
if (document.readyState === "complete") {
  setTimeout(analyze, 5000);
} else {
  window.addEventListener("load", () => setTimeout(analyze, 5000));
}

// Also run on navigation (for SPAs like Amazon)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    hasRun = false;
    setTimeout(analyze, 2000);
  }
}).observe(document.body, { childList: true, subtree: true });