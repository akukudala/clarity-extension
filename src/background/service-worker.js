const CACHE = new Map();
const API_KEY = process.env.ANTHROPIC_API_KEY;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "REWRITE_TEXTS") {
    console.log("✅ Rewriting texts for:", message.payload.domain);
    handleRewrites(message.payload).then(sendResponse);
    return true;
  }
});

async function handleRewrites({ domain, items }) {
  const cacheKey = `${domain}::${items.join("|").slice(0, 100)}`;
  if (CACHE.has(cacheKey)) {
    console.log("📦 Cache hit");
    return CACHE.get(cacheKey);
  }

  console.log("🚀 Calling Anthropic API for", items.length, "items...");

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: buildPrompt(domain, items) }],
      }),
    });

    const data = await response.json();
    console.log("📨 Response:", data);
    const text = data?.content?.[0]?.text?.trim();

    if (text) {
      // Parse the numbered list response
      const rewrites = parseRewrites(text, items.length);
      const result = { rewrites };
      CACHE.set(cacheKey, result);
      return result;
    }
  } catch (e) {
    console.error("❌ API error:", e);
  }

  return { rewrites: [] };
}

function parseRewrites(text, count) {
  // Expect numbered list: 1. rewrite\n2. rewrite\n etc.
  const lines = text.split("\n").filter(l => l.trim());
  const rewrites = [];

  for (const line of lines) {
    const match = line.match(/^\d+\.\s*(.+)/);
    if (match) rewrites.push(match[1].trim());
    if (rewrites.length >= count) break;
  }

  // Fallback: just split by newline if parsing fails
  if (!rewrites.length) {
    return lines.slice(0, count);
  }

  return rewrites;
}

function buildPrompt(domain, items) {
  const list = items.map((text, i) => `${i + 1}. "${text}"`).join("\n");

  return `You are Clarity — a friendly, knowing AI that translates manipulative marketing text into honest, lightly humorous versions. Like a good friend who sees through the BS and tells you what's really going on — warm, never mean, always a little wry.

Website: ${domain}

Here are ${items.length} manipulative texts found on this page. Rewrite each one as an honest, funny translation of what it ACTUALLY means. One sentence each, max 20 words. Speak directly to the user as "you". Return a numbered list only.

${list}

Example style:
- "Only 3 left in stock!" → "There are probably warehouses full of these, but scarcity sells."
- "47 people viewing this now" → "A number they made up to make you feel competitive."
- "Sale ends tonight!" → "This sale will be back tomorrow, and the day after that."
- "Exclusive member deal" → "You're on their email list. That's all it takes to be 'exclusive'."

Now rewrite the ${items.length} texts above:`;
}