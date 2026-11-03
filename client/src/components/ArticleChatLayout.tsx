import { useEffect } from "react";
import { useLocation } from "wouter";

export const ARTICLE_CHAT_LAYOUT_CSS = `
/* Remove only the unsolicited teaser; visitors can still open the chat launcher. */
.lc_text-widget--prompt { display: none !important; }
@media (max-width: 767px) {
  #lc_text-widget--btn { bottom: calc(126px + env(safe-area-inset-bottom)) !important; }
}
`;
/** GHL uses an open shadow root; ordinary page CSS cannot style its prompt/launcher.
 * Apply a narrowly scoped presentation override, restore it when leaving article/city routes.
 * No GHL settings, messages, analytics or chat functionality are changed. */
export default function ArticleChatLayout() {
  const [path] = useLocation();
  useEffect(() => {
    if (!/^\/(?:blog|cancel-solar-contract)\/[a-z0-9-]+$/.test(path)) return;
    let style: HTMLStyleElement | null = null, attempts = 0;
    const apply = () => {
      const shadow = document.querySelector("chat-widget")?.shadowRoot;
      if (!shadow) return false;
      style = document.createElement("style"); style.setAttribute("data-article-chat-layout", "1"); style.textContent = ARTICLE_CHAT_LAYOUT_CSS; shadow.append(style); return true;
    };
    if (apply()) return () => style?.remove();
    const timer = window.setInterval(() => { attempts++; if (apply() || attempts >= 60) window.clearInterval(timer); }, 500);
    return () => { window.clearInterval(timer); style?.remove(); };
  }, [path]);
  return null;
}
