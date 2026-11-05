/* Grito.Art – Service Worker
   Estratégia: o app inteiro é um único HTML; fica em cache e abre instantâneo/offline.
   Quando há rede, ele é revalidado em segundo plano e a versão nova aparece na próxima abertura.
   Para forçar atualização do cache, aumente VERSION. */
const VERSION = "v4";
const SHELL = "grito-shell-" + VERSION;
const FONTS = "grito-fonts-v1";
const SHELL_URLS = ["./", "manifest.json", "favicon.ico",
  "icons/icon-192.png", "icons/icon-512.png",
  "icons/maskable-192.png", "icons/maskable-512.png",
  "icons/apple-touch-icon.png", "icons/favicon-32.png"];

/* só guarda respostas válidas da própria origem (nunca páginas de login redirecionadas do Cloudflare Access) */
const ok = (r) => r && r.ok && r.type === "basic" && !r.redirected;

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    await Promise.all(SHELL_URLS.map(async (u) => {
      const r = await fetch(new Request(u, { cache: "reload", credentials: "same-origin" }));
      if (!ok(r)) throw new Error("Falha ao pré-carregar " + u + " (" + r.status + ")");
      await c.put(u, r);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) {
      if (k !== SHELL && k !== FONTS) await caches.delete(k);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  /* Fontes do Google: cache primeiro, atualiza em segundo plano */
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith((async () => {
      const c = await caches.open(FONTS);
      const hit = await c.match(req);
      const net = fetch(req).then((r) => { if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; }).catch(() => null);
      if (hit) { e.waitUntil(net); return hit; }
      return (await net) || Response.error();
    })());
    return;
  }

  if (url.origin !== self.location.origin) return;

  /* Navegação: sempre entrega o app em cache e revalida no fundo */
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      const c = await caches.open(SHELL);
      const hit = await c.match("./");
      const refresh = fetch(new Request("./", { cache: "no-cache", credentials: "same-origin" }))
        .then((r) => { if (ok(r)) return c.put("./", r.clone()); })
        .catch(() => {});
      if (hit) { e.waitUntil(refresh); return hit; }
      try { const r = await fetch(req); if (ok(r)) c.put("./", r.clone()); return r; }
      catch (err) { return new Response("Sem conexão e o app ainda não foi salvo no aparelho. Abra uma vez com internet.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }); }
    })());
    return;
  }

  /* Demais arquivos da própria origem: cache primeiro, rede como reserva */
  e.respondWith((async () => {
    const c = await caches.open(SHELL);
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    const r = await fetch(req);
    if (ok(r)) c.put(req, r.clone());
    return r;
  })());
});
