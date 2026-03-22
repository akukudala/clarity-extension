# 👁 Clarity — Callout

> *Making manipulation visible — and a little uncomfortable.*

Clarity is a Chrome extension that reads manipulative offers on Amazon, Booking.com, and Macy's — and rewrites them in honest, friendly, and funny language. In real time.

---

## 🎯 What It Does

Modern apps don't just capture attention — they manipulate it. Countdown timers, fake scarcity, social proof pressure, and endless promotional banners are designed to make you panic-buy without thinking.

Clarity scrapes those messages, sends them to Claude AI, and surfaces a card in the bottom-right corner of your screen with what they **actually** mean.

| What the site says | What Clarity says |
|---|---|
| `"Only 3 left in stock — order soon!"` | *"Either this is genuinely rare, or they're banking on you not calling their bluff."* |
| `"Limited time offer — price goes up at midnight!"` | *"The price isn't actually going anywhere — they just want you panicking at midnight."* |
| `"23 people are viewing this right now"` | *"We sprinkled some fake viewer numbers in hopes you'd fear missing out."* |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- Chrome browser
- Anthropic API key → [console.anthropic.com](https://console.anthropic.com)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/akukudala/clarity-extension.git
cd clarity-extension

# 2. Install dependencies
npm install

# 3. Add your API key
cp .env.example .env
# Open .env and replace with your actual key

# 4. Build the extension
npx webpack --config webpack.config.js
```

### Load into Chrome

1. Open Chrome and go to `chrome://extensions`
2. Toggle **Developer mode** ON (top right)
3. Click **Load unpacked**
4. Select the `clarity-extension` folder
5. Visit `amazon.com/deals` and wait 5 seconds 🎉

---

## 🏗️ Architecture

```
clarity-extension/
├── src/
│   ├── background/
│   │   └── service-worker.js   # API calls, caching, prompt building
│   ├── content/
│   │   ├── index.js            # Entry point, scraper trigger, SPA nav watcher
│   │   ├── overlay.js          # Card UI injection
│   │   └── observer.js         # MutationObserver
│   ├── popup/
│   │   ├── popup.html          # Extension popup
│   │   ├── popup.js            # Shows active domain
│   │   └── popup.css           # Dark theme styles
│   └── shared/
│       └── patterns.js         # scrapeManipulativeText() — TreeWalker + regex
├── adr/                        # Architecture Decision Records
├── manifest.json               # Chrome MV3 manifest
├── webpack.config.js           # Build config
└── babel.config.json           # ES module transpilation
```

### How It Works

```
You visit Amazon
      ↓
👀 Content script waits 5s for dynamic content
      ↓
🔍 TreeWalker scans every text node for manipulation language
      ↓
🧠 Up to 5 findings batched → sent to Claude Haiku API
      ↓
Claude writes honest, friendly, funny rewrites
      ↓
🎨 Dark overlay cards slide in from bottom-right
      ↓
You pause. You rethink. You decide. 😄
```

---

## 🧠 The Prompt

Clarity prompts Claude like this:

> *"You are Clarity — a friendly, knowing AI that translates manipulative marketing text into honest, lightly humorous versions. Like a good friend who sees through the BS and tells you what's really going on — warm, never mean, always a little wry."*

---

## 🔧 Development

```bash
# Build once
npx webpack --config webpack.config.js

# Watch mode (rebuilds on save)
npx webpack --watch

# After any code change:
# 1. Rebuild
# 2. Go to chrome://extensions → refresh Clarity
# 3. Hard refresh the test page (Cmd+Shift+R)
```

### Test Sites

| Site | URL | Dark Patterns |
|---|---|---|
| Amazon | `amazon.com/deals` | "Limited time deal", "% off" badges |
| Booking.com | Search results page | "X people viewing", urgency banners |
| Macy's | Any sale page | Countdown timers, promo callouts |
| Local test | `test-store.html` | All 7 patterns in one page |

---

## 🌍 Environment Variables

```bash
# .env (never commit this)
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Copy `.env.example` → `.env` and add your key. The key is injected at build time via `dotenv-webpack` and never exposed in source control.

---

## 🗺️ Roadmap

- **Phase 1 — Now:** Chrome extension detecting manipulation on major e-commerce sites
- **Phase 2 — Next:** Personal manipulation score, weekly digest of tactics used on you
- **Phase 3 — Future:** Block specific patterns, crowdsource detections, Clarity API

---

## 📋 ADR

Architecture decisions are documented in `/adr`. Read them before making architectural changes. Key decisions include why we use a 5-second delay, why we batch API calls, and why we use overlay cards instead of inline text replacement.

---

## 🛠️ Built With

- [Chrome Extension MV3](https://developer.chrome.com/docs/extensions/mv3/)
- [Claude Haiku API](https://docs.anthropic.com) — Anthropic
- [Webpack](https://webpack.js.org/) + [Babel](https://babeljs.io/)

---

## ⚠️ Disclaimer

API key must never be committed. Always use `.env` locally. For production, use a backend proxy to hold the key server-side.

---

*Built at Hackathon · Powered by Claude API · clarity-callout*
