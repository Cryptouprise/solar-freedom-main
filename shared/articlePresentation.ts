import { marked } from 'marked';

/** Presentation only: converts saved Markdown to HTML without rewriting claims,
 * links or assets. Existing HTML passes through Marked's HTML tokens intact.
 * This is NOT a sanitizer; callers must retain their content trust/governance rules.
 */
export function normalizeArticleMarkup(content: string): string {
  // Some saved HTML still contains Markdown inline syntax. A previous internal
  // linker can even put an HTML anchor inside a Markdown source-link label.
  // Keep that existing anchor and expose the original source as a second link;
  // never create nested anchors or silently discard either destination.
  const mixed = content.replace(/\[(<a\b[^>]*>[\s\S]*?<\/a>)\]\((https?:\/\/[^\s)]+)\)/gi,
    (_match, anchor: string, href: string) => `${anchor} (<a href="${href.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">source</a>)`);
  const html = marked.parse(mixed, { async: false, gfm: true, breaks: false }) as string;
  return html.replace(/(<p\b[^>]*>)([\s\S]*?)(<\/p>)/gi, (_match, open: string, body: string, close: string) => {
    if (!/\[[^\]]+\]\([^)]*\)|\*\*[^*]+\*\*|__[^_]+__/.test(body)) return `${open}${body}${close}`;
    return `${open}${marked.parseInline(body, { async: false, gfm: true })}${close}`;
  });
}

/** Split only at sentence boundaries, retaining every character in order.
 * An indivisible long sentence is intentionally left intact.
 */
export function splitReadableParagraph(text: string, targetLength = 340): string[] {
  if (text.length <= targetLength) return [text];
  const sentences = Array.from(new Intl.Segmenter('en', { granularity: 'sentence' }).segment(text), part => part.segment);
  const blocks: string[] = [];
  let block = '';
  for (const sentence of sentences) {
    if (block && block.length + sentence.length > targetLength) {
      blocks.push(block);
      block = '';
    }
    block += sentence;
  }
  if (block) blocks.push(block);
  return blocks;
}

/** Keep nested lists, tables, figures and wrappers intact when placing a CTA.
 * Browser parsing handles adjacent HTML paragraphs and Markdown-generated HTML
 * instead of slicing a raw string at an arbitrary closing paragraph tag.
 */
export function articleTopLevelBlocks(markup: string): string[] {
  if (typeof DOMParser === 'undefined') return [markup];
  const document = new DOMParser().parseFromString(markup, 'text/html');
  return Array.from(document.body.childNodes).map(node =>
    node.nodeType === 1 ? (node as Element).outerHTML : node.textContent ?? ''
  ).filter(block => block.trim());
}

/** Browser-only layout enhancement. Clone DOM ranges so emphasis and links survive
 * sentence-boundary paragraph breaks. Never split paragraphs containing media or
 * code. The server-safe normalizer above remains usable for saved drafts.
 */
export function readableArticleMarkup(markup: string): string {
  if (typeof DOMParser === 'undefined') return markup;
  const document = new DOMParser().parseFromString(markup, 'text/html');
  document.querySelectorAll('p').forEach(paragraph => {
    if (paragraph.querySelector('img, video, iframe, code, br, svg')) return;
    const text = paragraph.textContent ?? '';
    const parts = splitReadableParagraph(text);
    if (parts.length < 2) return;
    const walker = document.createTreeWalker(paragraph, 4 /* SHOW_TEXT */);
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    const locate = (offset: number): [Text, number] => {
      let remaining = offset;
      for (const node of nodes) {
        if (remaining <= node.length) return [node, remaining];
        remaining -= node.length;
      }
      return [nodes[nodes.length - 1], nodes[nodes.length - 1].length];
    };
    let offset = 0;
    const fragment = document.createDocumentFragment();
    parts.forEach(part => {
      const range = document.createRange();
      const [start, startOffset] = locate(offset);
      const [end, endOffset] = locate(offset + part.length);
      range.setStart(start, startOffset);
      range.setEnd(end, endOffset);
      const next = paragraph.cloneNode(false) as HTMLParagraphElement;
      if (offset) next.removeAttribute('id');
      next.append(range.cloneContents());
      fragment.append(next);
      offset += part.length;
    });
    paragraph.replaceWith(fragment);
  });
  return document.body.innerHTML;
}
