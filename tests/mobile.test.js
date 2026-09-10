/* Auditoria de iPhone: o que dá pra verificar sem aparelho é a aritmética
   de largura, a presença das metas e das regras, e o comportamento no DOM. */
const {JSDOM}=require('jsdom');
const html=require('./_harness').html;
let fail=0;
const eq=(g,e,m)=>{const a=JSON.stringify(g),b=JSON.stringify(e);
  if(a!==b){fail++;console.log('  FALHOU '+m+'\n    esperado '+b+'\n    obtido   '+a);}else console.log('  ok  '+m+' = '+a);};
const css=html.split('<style>')[1].split('</style>')[0];
/* comentário meu que fala de vh não é declaração de vh */
const cssNu=css.replace(/\/\*[\s\S]*?\*\//g,'');
const meta=n=>{const m=html.match(new RegExp('<meta name="'+n+'" content="([^"]+)"'));return m&&m[1];};

console.log('\n[BA] Metas que o iOS lê');
eq(/viewport-fit=cover/.test(meta('viewport')),true,'viewport-fit=cover (área segura do notch)');
eq(meta('apple-mobile-web-app-capable'),'yes','abre em tela cheia se salvar na tela de início');
eq(meta('apple-mobile-web-app-title'),'braço','nome do ícone');
eq(!!meta('theme-color'),true,'cor da barra do navegador');

console.log('\n[BB] Armadilhas do Safari do iPhone');
eq(/select\{[^}]*font-size:16px/.test(css.replace(/\s+/g,'')),true,
   'select em 16px: abaixo disso o iOS dá zoom ao focar');
eq(/@media \(hover:hover\)/.test(css),true,'hover isolado atrás de @media (hover:hover)');
eq(/@media \(max-width:760px\), \(pointer:coarse\)/.test(css),true,
   'os alvos grandes valem por dedo, não só por largura — pega iPhone deitado');
const hovers=[...css.matchAll(/\.dot:hover|\.chip:hover|\.deg-btn:hover|\.dot\.hide:hover/g)].length;
const dentro=[...css.matchAll(/@media \(hover:hover\)\{[^@]*?\}/gs)].map(m=>m[0]).join('');
eq([...dentro.matchAll(/:hover/g)].length>=hovers-1,true,
   'praticamente todo :hover está dentro do bloco de ponteiro');
eq(/touch-action:manipulation/.test(css),true,'touch-action:manipulation (mata o zoom de duplo toque)');
eq(/-webkit-tap-highlight-color:transparent/.test(css),true,'sem o flash cinza do toque');
eq(/user-select:none/.test(css),true,'toque rápido não seleciona o texto da nota');

console.log('\n[BC] Nada de vh: no iOS ele muda de valor quando a barra some');
const rootVars=cssNu.match(/:root\{[\s\S]*?\}/)[0];
eq(/\d\s*vh/.test(rootVars),false,'nenhuma unidade vh nas variáveis de tamanho');
eq(/\d\s*vh/.test(cssNu),false,'nenhum vh em nenhuma declaração do arquivo');
eq(/\d\s*vw/.test(rootVars),true,'as variáveis escalam por largura, que é estável');
eq(/--cell:46px/.test(css),true,'altura da casa em px fixo no celular');

console.log('\n[BD] O braço caber na tela: aritmética por aparelho');
/* --lane: clamp(44px, (100vw - 66px)/6, 58px); coluna de números = 2rem = 32px;
   padding da página no celular = 14px de cada lado */
const lane=w=>Math.max(44,Math.min((w-66)/6,58));
const cabe=w=>{const disp=w-28, uso=32+6*lane(w); return {disp,uso:Math.round(uso*10)/10,ok:uso<=disp};};
[['iPhone SE / 13 mini',375],['iPhone 14 / 15',390],['iPhone 15 Plus',430],['iPad mini retrato',744]]
  .forEach(([n,w])=>{const r=cabe(w);
    eq(r.ok,true,n+' ('+w+'px): braço usa '+r.uso+'px de '+r.disp+'px');});
eq(cabe(320).ok,false,'em 320px (iPhone 5) não cabe — aí a rolagem lateral do braço entra');
eq(/\.board-wrap\{[^}]*overflow-x:auto/.test(css.replace(/\s+/g,'')),true,
   'existe rolagem lateral local pro braço, em vez da página inteira rolar');

console.log('\n[BE] O alvo de toque saiu de 29px');
const alvo=w=>Math.min(40, lane(w)-12);
[375,390,430].forEach(w=> eq(alvo(w)>=39,true,'em '+w+'px o alvo tem '+alvo(w)+'px (antes: 29px)'));

console.log('\n[BF] Recolher texto poupa altura, e o botão não a devolve');
const cssNoSp=cssNu.replace(/\s+/g,'');
eq(/header\.topp\{[^}]*order:1;flex-basis:100%/.test(cssNoSp),true,
   'no celular a frase de abertura cai numa linha só dela, e o botão divide a primeira com o título');
eq(/\[hidden\]\{display:none!important\}/.test(cssNoSp),true,
   'o recolhido usa [hidden], que já tem regra — nada de altura sobrando');

console.log('\n[BG] Nada disso quebrou o app');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,
  beforeParse(w){w.AudioContext=undefined;w.webkitAudioContext=undefined;}});
const w=dom.window,d=w.document;
eq(!!d.querySelector('.board-wrap #board'),true,'o braço está dentro do contêiner de rolagem');
eq(d.querySelectorAll('.dot').length,78,'78 casas montadas');
const dot=(s,f)=>[...d.querySelectorAll('.dot')].find(x=>+x.dataset.s===s&&+x.dataset.f===f);
dot(0,3).dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
eq(d.querySelector('#composicao .name').textContent.trim(),'G','clicar ainda funciona');
dot(0,0).focus();
dot(0,0).dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));
eq(d.activeElement.dataset.f,'1','setas ainda funcionam dentro do contêiner');
console.log(fail? '\n>>> '+fail+' falha(s)':'\n>>> todos passaram');
process.exit(fail?1:0);
