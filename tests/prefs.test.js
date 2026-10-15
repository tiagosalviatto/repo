/* Preferências: o app lembra como foi ajustado, de uma abertura para a outra.

   Cada "abertura" é um jsdom novo, como fechar e abrir o app: o que passa de
   uma para a outra é só a string guardada, carregada à mão no localStorage
   da abertura seguinte. Os outros testes rodam em about:blank, onde o jsdom
   recusa localStorage — aqui a página tem endereço de verdade. */
const {JSDOM}=require('jsdom');
const {html}=require('./_harness');
const CHAVE='braco.preferencias.v1';
let fail=0;
const eq=(g,e,m)=>{const a=JSON.stringify(g),b=JSON.stringify(e);
  if(a!==b){fail++;console.log('  FALHOU '+m+'\n    esperado '+b+'\n    obtido   '+a);}else console.log('  ok  '+m+' = '+a);};

function abrir(guardado,{url='https://exemplo.test/repo/',celular=false}={}){
  const errs=[];
  const dom=new JSDOM(html,{url,runScripts:'dangerously',pretendToBeVisual:true,
    beforeParse(w){
      w.AudioContext=undefined; w.webkitAudioContext=undefined;
      w.addEventListener('error',e=>errs.push(String(e.error||e.message)));
      if (celular) w.matchMedia=()=>({matches:true});
      if (guardado!==undefined) w.localStorage.setItem(CHAVE,guardado);
    }});
  const w=dom.window, d=w.document;
  const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  const setSel=(id,v)=>{const e=d.getElementById(id); e.value=v;
    e.dispatchEvent(new w.Event('change',{bubbles:true}));};
  const ler=()=>({
    tema:d.documentElement.dataset.theme||'sistema',
    braco:d.getElementById('board').dataset.neck,
    casas:d.getElementById('sel-frets').value,
    pontos:d.querySelectorAll('.dot').length,
    afinacao:d.getElementById('sel-tuning').value,
    grafia:d.getElementById('btn-acc').textContent,
    rotulo:d.getElementById('btn-label').textContent,
    nomes:d.getElementById('btn-names').textContent,
    som:d.getElementById('btn-sound').textContent,
    doc:d.getElementById('btn-prose').getAttribute('aria-pressed'),
    deitado:d.getElementById('board').dataset.orient,
    tetrade:d.getElementById('btn-tet').classList.contains('on'),
    campoAberto:!d.getElementById('sec-field').hidden,
  });
  const guardadoAgora=()=>{ try { return w.localStorage.getItem(CHAVE); } catch(e){ return 'NEGADO'; } };
  return {w,d,errs,click,setSel,ler,guardadoAgora};
}
const PADRAO={tema:'sistema',braco:'jacaranda',casas:'9',pontos:60,afinacao:'std',
  grafia:'sustenidos',rotulo:'rótulo: nota',nomes:'notas apagadas',som:'som',doc:'false',
  deitado:'v',tetrade:false,campoAberto:true};

console.log('\n[RA] Primeira abertura: nada guardado');
let a=abrir();
eq(a.ler(),PADRAO,'tudo no padrão');
eq(a.guardadoAgora(),null,'abrir não grava nada: só uma escolha sua grava');

console.log('\n[RB] Ajustar tudo');
a.click(a.d.getElementById('btn-theme')); a.click(a.d.getElementById('btn-theme'));
a.click(a.d.getElementById('btn-neck'));  a.click(a.d.getElementById('btn-neck'));
a.setSel('sel-frets','12'); a.setSel('sel-tuning','dropd');
a.click(a.d.getElementById('btn-acc'));
a.click(a.d.getElementById('btn-label')); a.click(a.d.getElementById('btn-label'));
a.click(a.d.getElementById('btn-names')); a.click(a.d.getElementById('btn-sound'));
a.click(a.d.getElementById('btn-prose')); a.click(a.d.getElementById('btn-orient'));
a.click(a.d.getElementById('btn-tet'));
a.click(a.d.querySelector('[data-sec="field"]'));
const AJUSTADO={tema:'escuro',braco:'maple',casas:'12',pontos:78,afinacao:'dropd',
  grafia:'bemóis',rotulo:'rótulo: solfejo',nomes:'só o conjunto',som:'sem som',doc:'true',
  deitado:'h',tetrade:true,campoAberto:false};
eq(a.ler(),AJUSTADO,'a tela mostra os doze ajustes');
const guardado=a.guardadoAgora();
const p=JSON.parse(guardado);
eq([p.theme,p.neck,p.frets,p.tuning,p.acc,p.label,p.showNames,p.sound,p.prose,p.orient,p.tetrad,p.open.field],
   ['escuro','maple',12,'dropd','flat','solfejo',false,false,true,'h',true,false],
   'e o que ficou guardado diz o mesmo');
/* o que você está OLHANDO não volta: abrir no acorde de ontem parece bug */
a.click(a.d.querySelectorAll('#roots .chip')[7]);
eq(['keyPc','chordId','picked'].some(k=>k in JSON.parse(a.guardadoAgora())),false,
   'tom, acorde e montagem à mão não são guardados');
eq(a.errs,[],'nenhuma exceção ajustando');

console.log('\n[RC] Fechar e abrir de novo');
let b=abrir(guardado);
eq(b.ler(),AJUSTADO,'volta exatamente como ficou');
/* os rótulos que dependem de grafia e solfejo também têm de voltar certos,
   e não só os botões de preferência */
eq(b.d.querySelectorAll('#roots .chip')[1].textContent,'Ré♭','tônicas em solfejo e bemóis');
eq(b.d.querySelectorAll('#tuner-strings .chip')[0].textContent,'6ª Ré',
   'o afinador mira a 6ª em ré, porque a afinação guardada é Drop D');
eq(b.errs,[],'nenhuma exceção abrindo');

console.log('\n[RD] O que vem guardado nunca é confiado');
[['JSON cortado ao meio','{"theme":"esc'],
 ['texto qualquer','isto não é json'],
 ['null','null'],
 ['número','42'],
 ['lista','[1,2,3]'],
 ['valores de outro planeta',JSON.stringify({theme:'roxo',neck:'pinho',frets:999,tuning:'xyz',
   label:'grego',acc:'dobrado',orient:'diagonal',showNames:'true',sound:1,prose:'sim',
   tetrad:null,open:'tudo'})],
 ['abertos com tipo errado',JSON.stringify({open:{field:'não',tom:0}})],
].forEach(([nome,conteudo])=>{
  const c=abrir(conteudo);
  eq([c.ler(),c.errs],[PADRAO,[]],nome+': abre no padrão, sem erro');
});
const parcial=abrir(JSON.stringify({neck:'ebano',frets:7}));
eq([parcial.ler().braco,parcial.ler().casas,parcial.ler().pontos,parcial.ler().tema],['ebano','7',48,'sistema'],
   'guardado pela metade: aplica o que é válido, o resto fica no padrão');

console.log('\n[RE] Navegador que nega armazenamento');
const anonimo=abrir(undefined,{url:'about:blank'});
anonimo.click(anonimo.d.getElementById('btn-theme'));
anonimo.click(anonimo.d.getElementById('btn-neck'));
eq([anonimo.guardadoAgora(),anonimo.ler().tema,anonimo.errs],['NEGADO','claro',[]],
   'o app só não lembra: os botões funcionam e nada estoura');

console.log('\n[RF] Escolha explícita vence o padrão do celular');
eq(abrir(undefined,{celular:true}).d.getElementById('sec-inst').hidden,true,
   'no celular, sem nada guardado, o Instrumento chega recolhido');
eq(abrir(JSON.stringify({open:{inst:true}}),{celular:true}).d.getElementById('sec-inst').hidden,false,
   'mas quem abriu ele no celular encontra aberto');

console.log(fail? '\n>>> '+fail+' falha(s)':'\n>>> todos passaram');
process.exit(fail?1:0);
