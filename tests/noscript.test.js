/* Reproduz as duas situações: script desligado (app Arquivos) e ligado. */
const {JSDOM}=require('jsdom');
const html=require('./_harness').html;
let fail=0;
const eq=(g,e,m)=>{const a=JSON.stringify(g),b=JSON.stringify(e);
  if(a!==b){fail++;console.log('  FALHOU '+m+'\n    esperado '+b+'\n    obtido   '+a);}else console.log('  ok  '+m+' = '+a);};

console.log('\n[CA] Script DESLIGADO — o que o app Arquivos mostra');
const off=new JSDOM(html).window.document;   // sem runScripts: script não executa
eq(off.querySelectorAll('.dot').length,0,'braço vazio, como você viu');
eq([...off.querySelectorAll('#sel-chord option')].length,0,'dropdown sem opções, como você viu');
eq(off.querySelectorAll('#roots .chip').length,0,'sem botões de tônica');
const aviso=off.querySelector('.nojs');
eq(!!aviso,true,'MAS agora aparece o aviso explicando por quê');
eq(aviso.querySelector('h2').textContent,'O JavaScript não está rodando aqui','título do aviso');
eq(aviso.querySelectorAll('ol li').length,3,'três saídas listadas');
eq(/python3 -m http\.server/.test(aviso.textContent),true,'inclui o comando pra servir na rede local');
eq(!!off.querySelector('noscript style'),true,'e esconde a casca vazia da interface');
eq(/#btn-prose/.test(off.querySelector('noscript style').textContent),true,
   'inclusive o botão de recolher texto, que sem script não recolheria nada');
eq(off.querySelector('header.top p').hidden,false,'o texto do topo segue legível');
const secs=[...off.querySelectorAll('[data-sec]')];
eq(secs.length,5,'cinco cabeçalhos que recolhem');
eq(secs.every(b=>b.closest('.deck,.stage,.foot')!==null),true,
   'todos moram dentro de .deck/.stage/.foot, que o noscript já esconde inteiros — '
   +'um deles no header, como o btn-prose, precisaria de regra própria');

console.log('\n[CB] Script LIGADO — o mesmo arquivo, funcionando');
const on=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,
  beforeParse(w){w.AudioContext=undefined;w.webkitAudioContext=undefined;}}).window.document;
eq(on.querySelectorAll('.dot').length,60,'60 casas montadas — o padrão são 9 casas');
eq([...on.querySelectorAll('#sel-chord option')].length,16,'16 acordes no dropdown');
eq([...on.querySelectorAll('#sel-key option')].length,4,'4 espécies de tom');
eq(on.querySelectorAll('#roots .chip').length,12,'12 botões de tônica');
eq(on.querySelectorAll('#field-list .deg-btn').length,7,'7 graus no campo harmônico');
eq(on.querySelector('#composicao .name').textContent.trim(),'C','composição preenchida');
eq(on.querySelector('.nojs'),null,'com script, o aviso nem existe no documento');
eq([on.getElementById('btn-prose').textContent,on.getElementById('btn-prose').getAttribute('aria-pressed'),
    on.querySelectorAll('.prose').length],
   ['documentação','false',2],'o botão de documentação assume os dois parágrafos, e abre apagado');
console.log(fail? '\n>>> '+fail+' falha(s)':'\n>>> todos passaram');
process.exit(fail?1:0);
