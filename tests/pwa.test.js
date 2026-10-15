/* O app instalável: manifest, ícones, fonte local e service worker.

   O service worker não é conferido por expressão regular: o sw.js de verdade
   roda aqui dentro, num mundo de mentira — cache em memória, rede que serve
   os arquivos do repositório ou cai quando eu mando, eventos de instalar e
   ativar disparados à mão. É a única peça do app que, com defeito, prende
   o celular de quem instalou numa versão velha sem ninguém perceber, então
   é a que mais merece ser exercitada como roda, e não como texto. */
const fs=require('fs'), path=require('path'), vm=require('vm'), crypto=require('crypto');
const {html}=require('./_harness');
const RAIZ=path.join(__dirname,'..');
let fail=0;
const eq=(g,e,m)=>{const a=JSON.stringify(g),b=JSON.stringify(e);
  if(a!==b){fail++;console.log('  FALHOU '+m+'\n    esperado '+b+'\n    obtido   '+a);}else console.log('  ok  '+m+' = '+a);};
const existe=p=>fs.existsSync(path.join(RAIZ,p));
const relativo=u=>!/^(https?:|\/)/.test(u);
function png(p){
  const b=fs.readFileSync(path.join(RAIZ,p));
  return {png:b.slice(1,4).toString()==='PNG', w:b.readUInt32BE(16), h:b.readUInt32BE(20),
          alfa:[4,6].includes(b[25]) || b.includes(Buffer.from('tRNS'))};
}

console.log('\n[PA] O manifest: o que faz o Chrome oferecer "Instalar app"');
const linkMan=html.match(/<link rel="manifest" href="([^"]+)"/);
eq(!!linkMan,true,'o index.html aponta para um manifest');
eq(existe(linkMan[1]),true,'e o arquivo existe: '+linkMan[1]);
const man=JSON.parse(fs.readFileSync(path.join(RAIZ,linkMan[1]),'utf8'));
eq(man.display,'standalone','abre sem barra de navegador');
eq([man.short_name, man.short_name.length<=12],['braço',true],
   'nome curto de até 12 caracteres: é o que cabe embaixo do ícone na gaveta');
eq(!!man.name && !!man.description,true,'nome completo e descrição, que o PWABuilder leva para a Play');
eq([man.id,man.start_url,man.scope].every(relativo),true,
   'id, início e escopo relativos: valem em /repo/ hoje e num domínio próprio amanhã');
eq([man.background_color,man.theme_color].every(c=>/^#[0-9A-Fa-f]{6}$/.test(c)),true,
   'cores em hexadecimal, que é o que a tela de abertura do Android aceita');
eq(man.lang,'pt-BR','idioma declarado');

console.log('\n[PB] Ícones: cada sistema corta de um jeito');
const icones=man.icons;
const tem=(s,p)=>icones.some(i=>i.sizes===s && (i.purpose||'any').split(' ').includes(p));
eq([tem('192x192','any'),tem('512x512','any'),tem('512x512','maskable')],[true,true,true],
   '192 e 512 comuns, e um 512 maskable para a máscara do launcher');
icones.forEach(i=>{
  const ok=existe(i.src);
  const d=ok?png(i.src):{};
  eq([ok,d.png,d.w+'x'+d.h,d.alfa],[true,true,i.sizes,false],
     i.src+': existe, é PNG, tem o tamanho que o manifest promete e é opaco');
});
eq(icones.every(i=>relativo(i.src)),true,'caminhos relativos, pelo mesmo motivo do escopo');

console.log('\n[PC] A fonte mora no site, não no Google');
eq(/fonts\.(googleapis|gstatic)\.com/.test(html),false,'nenhuma chamada ao Google Fonts sobrou');
const faces=[...html.matchAll(/@font-face\{[^}]*font-family:'([^']+)'[^}]*src:url\(([^)]+)\)/g)]
  .map(m=>({familia:m[1], src:m[2]}));
eq(faces.map(f=>f.familia),['Archivo','Archivo Black'],'as duas famílias que a página usa');
faces.forEach(f=>{
  const ok=existe(f.src);
  eq([ok, ok && fs.readFileSync(path.join(RAIZ,f.src)).slice(0,4).toString()],[true,'wOF2'],
     f.src+' existe e é woff2');
});
eq(['fonts/OFL-archivo.txt','fonts/OFL-archivo-black.txt'].every(existe),true,
   'e a licença OFL vai junto, que é condição dela para redistribuir');
const pre=html.match(/<link rel="preload" href="([^"]+)" as="font"/);
eq(!!pre && faces.some(f=>f.src===pre[1]),true,'o preload aponta para uma fonte que existe de fato');

console.log('\n[PD] O service worker, como arquivo');
const swSrc=fs.readFileSync(path.join(RAIZ,'sw.js'),'utf8');
const ESTATICOS=JSON.parse(swSrc.match(/const ESTATICOS = (\[[\s\S]*?\]);/)[1].replace(/'/g,'"'));
eq(ESTATICOS.map(p=>p==='./'?'index.html':p).filter(p=>!existe(p)),[],
   'tudo que ele guarda na instalação existe — um 404 aqui derruba a instalação inteira');
eq(icones.every(i=>ESTATICOS.includes(i.src)) && faces.every(f=>ESTATICOS.includes(f.src)),true,
   'e guarda todos os ícones e fontes, senão o app abre offline sem eles');
/* o carimbo: sem ele, trocar uma fonte ou um ícone e esquecer de subir a
   versão deixaria todo celular com o arquivo velho para sempre */
const h=crypto.createHash('sha256');
ESTATICOS.filter(p=>p!=='./').forEach(p=>{h.update(p+'\0'); h.update(fs.readFileSync(path.join(RAIZ,p)));});
const carimbo='braco-'+h.digest('hex').slice(0,8);
const versao=swSrc.match(/const VERSAO = '([^']+)'/)[1];
eq(versao,carimbo,versao===carimbo
   ? 'VERSAO bate com o conteúdo dos arquivos guardados'
   : 'algum arquivo guardado mudou: troque VERSAO no sw.js para \''+carimbo+'\'');
eq(/'serviceWorker' in navigator && location\.protocol !== 'file:'/.test(html),true,
   'o registro é condicional: aberto do disco, o app segue funcionando sem ele');

console.log('\n[PE] O service worker, rodando');
const BASE='https://exemplo.test/repo/';
let paginaNoAr='versão 1';          // o index.html "publicado" no momento
let rede='normal';                    // normal | fora | lenta
function servir(url){
  const u=new URL(url);
  if (u.origin!==new URL(BASE).origin || !u.pathname.startsWith('/repo/'))
    return new Response('',{status:404});
  const rel=u.pathname.slice('/repo/'.length);
  if (rel===''||rel==='index.html') return new Response(paginaNoAr,{status:200});
  return existe(rel) ? new Response(fs.readFileSync(path.join(RAIZ,rel)),{status:200})
                     : new Response('',{status:404});
}
function buscar(alvo){
  const url=typeof alvo==='string'?new URL(alvo,BASE).href:alvo.url;
  if (rede==='fora') return Promise.reject(new TypeError('sem rede'));
  if (rede==='lenta') return new Promise(ok=>setTimeout(()=>ok(servir(url)),150));
  return Promise.resolve(servir(url));
}
class Cache{
  constructor(){ this.m=new Map(); }
  k(r){ return typeof r==='string'?new URL(r,BASE).href:r.url; }
  async put(r,resp){ this.m.set(this.k(r),resp); }
  async match(r){ const v=this.m.get(this.k(r)); return v?v.clone():undefined; }
  async addAll(lista){ for (const u of lista){ const resp=await buscar(u);
    if(!resp.ok) throw new Error('addAll falhou em '+u); this.m.set(this.k(u),resp); } }
}
const gaveta={c:new Map(),
  async open(n){ if(!this.c.has(n)) this.c.set(n,new Cache()); return this.c.get(n); },
  async keys(){ return [...this.c.keys()]; },
  async delete(n){ return this.c.delete(n); },
  async match(r){ for (const c of this.c.values()){ const v=await c.match(r); if(v) return v; } }};
const ouvintes={};
const mundo={caches:gaveta, fetch:buscar, URL, Response, Promise, Error, TypeError,
  /* o prazo de 3s da rede vira 20ms, para o teste não esperar de verdade */
  setTimeout:(fn,ms)=>setTimeout(fn, ms>=1000?20:ms), clearTimeout,
  self:{location:new URL(BASE+'sw.js'), addEventListener:(t,f)=>{ouvintes[t]=f;},
        skipWaiting:()=>Promise.resolve(), clients:{claim:()=>Promise.resolve()}}};
vm.createContext(mundo);
vm.runInContext(swSrc,mundo);

const ciclo=async(tipo)=>{ const espera=[]; ouvintes[tipo]({waitUntil:p=>espera.push(p)}); await Promise.all(espera); };
async function pedir(url,{mode='cors',method='GET'}={}){
  let resposta=null; const espera=[];
  ouvintes.fetch({request:{url:new URL(url,BASE).href,mode,method},
                  respondWith:p=>{resposta=p;}, waitUntil:p=>espera.push(p)});
  if (!resposta) return {interceptou:false};
  try { const r=await resposta; return {interceptou:true, texto:await r.clone().text(), espera}; }
  catch(e){ return {interceptou:true, erro:true, espera}; }
}
const guardada=async()=>{ const c=await gaveta.open(versao); const r=await c.match(BASE); return r && r.text(); };

(async()=>{
  /* sem nada guardado e sem rede, o app não tem o que mostrar: tem de
     falhar logo, e não pendurar a tela */
  rede='fora';
  const zero=await pedir(BASE,{mode:'navigate'});
  eq([zero.interceptou,!!zero.erro],[true,true],'antes de instalar, offline: falha na hora, não pendura');
  rede='normal';

  await gaveta.open('braco-velho');                  // de uma versão anterior
  await gaveta.open('outro-app');                    // de outro app na mesma origem
  await ciclo('install');
  const instalado=await gaveta.open(versao);
  eq(ESTATICOS.every(p=>instalado.m.has(new URL(p,BASE).href)),true,'instalar guarda os '+ESTATICOS.length+' arquivos');
  await ciclo('activate');
  eq((await gaveta.keys()).sort(),[versao,'outro-app'].sort(),
     'ativar apaga o cache da versão anterior e não toca no que não é dele');

  paginaNoAr='versão 2';
  let r=await pedir(BASE,{mode:'navigate'});
  eq([r.texto,await guardada()],['versão 2','versão 2'],
     'online: a página vem da rede e a cópia guardada se atualiza — é por aqui que todo push chega');

  rede='fora';
  r=await pedir(BASE,{mode:'navigate'});
  eq(r.texto,'versão 2','offline: abre a última versão que viu');
  r=await pedir(BASE+'index.html?v=9',{mode:'navigate'});
  eq(r.texto,'versão 2','offline, por outro endereço da mesma página: mesma cópia');

  r=await pedir(BASE+'fonts/archivo-latin.woff2');
  eq([r.interceptou,r.texto && r.texto.length>0],[true,true],'offline: a fonte sai do cache');

  rede='lenta'; paginaNoAr='versão 3';
  const t0=Date.now();
  r=await pedir(BASE,{mode:'navigate'});
  const levou=Date.now()-t0;
  eq([r.texto,levou<120],['versão 2',true],
     'rede lenta: não espera ela, abre a cópia guardada ('+levou+'ms)');
  await Promise.all(r.espera);
  eq(await guardada(),'versão 3','e quando a rede enfim responde, a próxima abertura já vem atualizada');
  rede='normal';

  eq((await pedir('https://fonts.googleapis.com/css2')).interceptou,false,'pedido de outra origem passa direto');
  eq((await pedir(BASE,{method:'POST'})).interceptou,false,'e o que não é GET também');

  console.log(fail? '\n>>> '+fail+' falha(s)':'\n>>> todos passaram');
  process.exit(fail?1:0);
})().catch(e=>{ console.log('  FALHOU exceção: '+e.stack); process.exit(1); });
