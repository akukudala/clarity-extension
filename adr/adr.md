# ADR 001 — Clarity Chrome Extension Architecture

## Context

Clarity is a Chrome extension that detects manipulative dark patterns on e-commerce sites (Amazon, Booking.com, Macy's) and surfaces humorous, honest rewrites to the user via an overlay card. The goal is to make manipulation visible without blocking or breaking the page.

## Decisions

### 1. Manifest V3

We use Chrome Manifest V3 (not V2). MV3 is the current Chrome standard and required for new extensions published to the Chrome Web Store. Background scripts run as service workers, not persistent background pages. This means the service worker can be killed between messages — state must not be assumed to persist across calls.

### 2. Webpack + Babel build pipeline

Source files use ES module syntax (`import/export`). Chrome content scripts do not natively support ES modules, so we compile with Webpack and transpile with Babel (`@babel/preset-env` targeting Chrome 120, `modules: "commonjs"`). Output lands in `dist/`. Never edit `dist/` directly — always edit `src/` and rebuild.

### 3. Text scraping over DOM pattern matching

Early versions used CSS class selectors and regex to detect dark patterns. This failed on real sites because:
- Amazon, Booking.com and others load content dynamically after page load
- Class names vary across sites and change frequently
- Single-word matches ("Deal", "Save") produced too many false positives

Current approach: a `TreeWalker` walks all text nodes after a 5-second delay (to allow dynamic content to load), filters by a meaningful regex, and collects up to 5 results. This is more resilient than selector-based detection.

### 4. All scraped text sent to Claude in one API call

Rather than making one API call per detected pattern, we batch all findings into a single prompt and ask Claude to return a numbered list of rewrites. This reduces latency, cost, and rate limit exposure. The service worker parses the numbered list response and maps rewrites back to their source elements.

### 5. Claude Haiku for rewrites

We use `claude-haiku-4-5-20251001` (not Sonnet or Opus). Haiku is fast enough for real-time overlays and cheap enough for hackathon/demo usage. The rewrite task is straightforward — a larger model adds no meaningful quality improvement here.

### 6. `anthropic-dangerous-direct-browser-access` header required

The Anthropic API rejects direct browser requests without this header. It must be included in every fetch call from the service worker. Do not remove it.

### 7. In-memory cache in service worker

API responses are cached in a `Map` keyed by `domain::scraped_texts`. This prevents duplicate API calls when the observer fires multiple times on the same page. The cache is in-memory only and resets when the service worker is killed (which Chrome may do after inactivity). This is acceptable — a cold cache just means one extra API call.

### 8. 5-second delay before scraping

We wait 5 seconds after `window.load` before running the scraper. This allows JavaScript-rendered content (React, Vue, lazy-loaded widgets) to appear in the DOM. A shorter delay (1-2s) consistently missed Amazon deal badges and Booking.com urgency text in testing.

### 9. Overlay cards, not inline replacement

We show rewrites in floating overlay cards (bottom-right, stacked), not by replacing the original text in place. Inline replacement risks breaking page layouts and triggering site JS that watches DOM mutations. Overlay cards are non-destructive and do not interact with the host page's event system.

### 10. `hasRun` flag prevents re-triggering

A boolean `hasRun` flag prevents the scraper from running more than once per page load. Without it, the MutationObserver fires dozens of times as the page loads, burning through the `MAX_CALLOUTS` limit before meaningful content appears. The flag resets on SPA navigation (detected by watching `location.href` changes).

## File Structure

```
clarity-extension/
├── src/
│   ├── background/
│   │   └── service-worker.js   # API calls, caching, prompt building
│   ├── content/
│   │   ├── index.js            # Entry point, analyze(), SPA nav watcher
│   │   ├── overlay.js          # Card UI injection
│   │   └── observer.js         # MutationObserver (legacy, mostly superseded)
│   ├── popup/
│   │   ├── popup.html          # Extension popup
│   │   ├── popup.js            # Shows active domain
│   │   └── popup.css           # Dark theme styles
│   └── shared/
│       └── patterns.js         # scrapeManipulativeText() — TreeWalker + regex
├── manifest.json               # MV3 manifest
├── webpack.config.js           # Build config
└── babel.config.json           # Transpile ES modules → CommonJS
```

## Constraints and conditions to revisit

- **5-second delay** is a blunt instrument. A smarter approach would use a `MutationObserver` that fires only once the DOM has been stable for 1-2 seconds. Revisit if the delay feels too slow in demos.

- **API key is hardcoded** in `service-worker.js`. This is acceptable for a hackathon but must never be shipped to the Chrome Web Store. The production approach is a backend proxy that holds the key server-side.

- **`anthropic-dangerous-direct-browser-access`** is a direct browser flag that Anthropic may restrict or remove. If API calls start returning 403, check whether this header is still supported.

- **Haiku model string** (`claude-haiku-4-5-20251001`) may be deprecated. If calls fail with a model-not-found error, check `docs.anthropic.com` for the current Haiku model string.

## Sites tested

| Site | URL pattern | Works? | Notes |
|---|---|---|---|
| Amazon | amazon.com/deals | ✅ | Best results — "Limited time deal", "% off" badges |
| Booking.com | searchresults page | ✅ | Must be on results page, not homepage |
| Test store | local file:// | ✅ | Enable "Allow access to file URLs" in extension settings |
| Macy's | macys.com | Not yet tested | |