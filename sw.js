/* Service worker do braço: é o que deixa o app instalado abrir sem rede.

   Duas regras, uma para cada tipo de arquivo:

   - A PÁGINA vai para a rede primeiro. É o index.html que muda a cada push,
     e um service worker que servisse a página do cache primeiro congelaria
     cada aparelho na versão do dia em que o app foi instalado — o pior
     defeito possível num PWA, porque o usuário não tem como saber nem como
     sair dele. Se a rede não responder em ESPERA_REDE_MS (sala de ensaio
     com Wi-Fi ruim), serve a cópia guardada, e a resposta da rede, quando
     chegar, atualiza a cópia para a próxima abertura.

   - O RESTO (fontes, ícones, manifest) vem do cache primeiro. Não muda nunca
     sem mudar também a VERSAO, e por isso ela não é um número que alguém
     lembra de subir: o sufixo é um carimbo do conteúdo desses arquivos, e o
     tests/pwa.test.js recalcula o carimbo e falha, dizendo o valor novo, se
     algum arquivo mudou e a VERSAO não acompanhou.

   Pedido de outra origem ou que não seja GET passa direto, sem tocar em nada. */

const VERSAO = 'braco-11f83c4b';
const ESTATICOS = [
  './',
  'manifest.webmanifest',
  'icone-180.png',
  'icone-192.png',
  'icone-512.png',
  'icone-maskable-512.png',
  'fonts/archivo-latin.woff2',
  'fonts/archivo-black-latin.woff2'
];
const ESPERA_REDE_MS = 3000;
/* toda navegação é a mesma página: o app tem uma só, e /repo/,
   /repo/index.html e /repo/?v=2 têm de cair na mesma cópia guardada */
const PAGINA = new URL('./', self.location).href;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO)
    .then(c => c.addAll(ESTATICOS))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('braco-') && k !== VERSAO)
                              .map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') { e.respondWith(paginaRedePrimeiro(e)); return; }
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});

function comPrazo(promessa, ms){
  return new Promise((ok, falha) => {
    const t = setTimeout(() => falha(new Error('a rede não respondeu a tempo')), ms);
    promessa.then(v => { clearTimeout(t); ok(v); },
                  x => { clearTimeout(t); falha(x); });
  });
}

async function paginaRedePrimeiro(e){
  const cache = await caches.open(VERSAO);
  const daRede = fetch(e.request).then(resp => {
    if (resp.ok) return cache.put(PAGINA, resp.clone()).then(() => resp);
    return resp;
  });
  /* mesmo que a cópia guardada ganhe a corrida, a rede segue até o fim e
     atualiza o cache — o waitUntil mantém o worker vivo para isso */
  e.waitUntil(daRede.catch(() => {}));
  try {
    return await comPrazo(daRede, ESPERA_REDE_MS);
  } catch (_) {
    const guardada = await cache.match(PAGINA);
    if (guardada) return guardada;
    return daRede;   // nada guardado ainda: só resta esperar a rede
  }
}
