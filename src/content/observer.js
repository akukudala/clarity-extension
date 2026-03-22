export function startObserver(callback) {
    let debounceTimer;
    const observer = new MutationObserver((mutations) => {
      const hasNewNodes = mutations.some((m) => m.addedNodes.length > 0);
      if (hasNewNodes) {
        console.log("👁 Clarity observer fired — new nodes detected");
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(callback, 800);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    console.log("👁 Clarity observer started");
    return observer;
  }