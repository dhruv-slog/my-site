/* Vercel Web Analytics: enable Analytics on the project, then redeploy. */
(() => {
  'use strict';
  const { protocol, hostname, pathname, search } = window.location;
  if (!/^https?:$/.test(protocol) || hostname === 'localhost' || hostname === '[::1]' ||
      /^127\./.test(hostname) || pathname.includes('/dev/') ||
      new URLSearchParams(search).has('debug')) return;

  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
  };
  const script = document.createElement('script');
  script.src = '/_vercel/insights/script.js';
  script.defer = true;
  document.head.append(script);

  // Fixed labels only; do not send full URLs, query strings, or visitor IPs.
  const platforms = new Map([
    ['t.me', 'telegram'], ['www.instagram.com', 'instagram'],
    ['x.com', 'x'], ['www.youtube.com', 'youtube']
  ]);
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    const platform = platforms.get(new URL(link.href, window.location.href).hostname);
    if (platform) window.va('event', { name: 'social_click', data: { platform } });
  });
})();
