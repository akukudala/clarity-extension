let cardCount = 0;

export function showOverlay(originalText, rewrite) {
  const card = document.createElement("div");
  const bottomOffset = 20 + cardCount * 120;
  cardCount++;

  card.style.cssText = `
    position: fixed;
    bottom: ${bottomOffset}px;
    right: 20px;
    width: 340px;
    background: #0f0f0f;
    color: #f0f0f0;
    border-left: 4px solid #7c3aed;
    border-radius: 10px;
    padding: 14px 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    line-height: 1.5;
    z-index: 2147483647;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    animation: claritySlideIn 0.35s cubic-bezier(0.16,1,0.3,1);
  `;

  card.innerHTML = `
    <style>
      @keyframes claritySlideIn {
        from { opacity: 0; transform: translateX(30px); }
        to   { opacity: 1; transform: translateX(0); }
      }
    </style>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
      <div style="flex:1;">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#7c3aed;margin-bottom:8px;font-weight:600;">
          👁 Clarity
        </div>
        <div style="color:#aaa;font-size:11px;margin-bottom:6px;text-decoration:line-through;opacity:0.7;">
          "${originalText.slice(0, 60)}${originalText.length > 60 ? '...' : ''}"
        </div>
        <div style="color:#f0f0f0;font-size:13px;">
          ${rewrite}
        </div>
      </div>
      <button onclick="this.closest('div[style]').remove()" style="
        background:none;border:none;color:#555;cursor:pointer;
        font-size:18px;padding:0;line-height:1;flex-shrink:0;margin-top:2px;
      ">✕</button>
    </div>
  `;

  document.body.appendChild(card);

  // Auto dismiss after 12 seconds
  setTimeout(() => {
    card.style.transition = "opacity 0.5s, transform 0.5s";
    card.style.opacity = "0";
    card.style.transform = "translateX(30px)";
    setTimeout(() => { card.remove(); cardCount = Math.max(0, cardCount - 1); }, 500);
  }, 12000);
}