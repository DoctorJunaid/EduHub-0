export function printElement(element, title = 'Report') {
  if (!element) return;
  const frame = document.createElement('iframe');
  frame.title = 'Print preview';
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0';
  frame.onload = () => {
    const doc = frame.contentDocument;
    doc.title = title;
    doc.body.appendChild(doc.importNode(element, true));
    doc.querySelectorAll('[data-print-hide]').forEach((node) => node.remove());
    const cleanup = () => frame.remove();
    frame.contentWindow.addEventListener('afterprint', cleanup, { once: true });
    frame.contentWindow.focus();
    frame.contentWindow.print();
    setTimeout(cleanup, 60000);
  };
  frame.srcdoc = '<!doctype html><html><head><style>body{font:12px Arial,sans-serif;color:#172d3e;padding:24px}h1,h2{font-size:22px}p{line-height:1.6}table{border-collapse:collapse;width:100%;margin:20px 0}th,td{text-align:left;padding:9px;border-bottom:1px solid #ddd}th{font-size:11px}small{display:block}button,select{display:none}tr{break-inside:avoid}@page{margin:15mm}</style></head><body></body></html>';
  document.body.appendChild(frame);
}
