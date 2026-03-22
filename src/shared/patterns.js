export function scrapeManipulativeText() {
    const results = [];
    const seen = new Set();
  
    const meaningfulRegex = /\d+%\s*off|save|limited|deal|hurry|only\s*\d+|ends?\s*(soon|today)|flash|exclusive|last\s*chance|popular|demand|sold|viewing|people/i;
  
    // Walk every single text node on the page
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const text = node.textContent?.trim();
          // Skip empty, scripts, styles
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName;
          if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") return NodeFilter.FILTER_REJECT;
          if (!text || text.length < 4 || text.length > 200) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
  
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent.trim();
      if (meaningfulRegex.test(text) && !seen.has(text)) {
        seen.add(text);
        results.push({ el: node.parentElement, text });
      }
    }
  
    console.log("👁 Clarity scraped:", results.map(r => r.text));
    return results.slice(0, 5);
  }