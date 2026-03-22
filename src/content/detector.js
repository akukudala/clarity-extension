import { PATTERNS } from "../shared/patterns.js";

export function runDetector() {
  const triggered = [];
  for (const pattern of PATTERNS) {
    try {
      const result = pattern.detect();
      if (result.found) {
        triggered.push({
          id: pattern.id,
          label: pattern.label,
          confidence: pattern.confidence,
          context: pattern.context(result.el),
          el: result.el,
        });
      }
    } catch (e) {
      // Silent fail — never break the page
    }
  }
  return triggered;
}