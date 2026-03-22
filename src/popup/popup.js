document.addEventListener("DOMContentLoaded", () => {
    const status = document.getElementById("status");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url || "";
      try {
        const domain = new URL(url).hostname;
        status.textContent = `Watching ${domain}`;
      } catch {
        status.textContent = "Active on this page";
      }
    });
  });