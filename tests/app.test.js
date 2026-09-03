/* Roda o app inteiro num DOM simulado. Tudo é assertado pelo que aparece
   na tela — nada de estado interno, que é o que o usuário também vê. */
const {JSDOM}=require('jsdom');
const html=require('./_harness').html;
const errs=[];
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,
  beforeParse(w){ w.AudioContext=undefined; w.webkitAudioContext=undefined;
    w.addEventListener('error',e=>errs.push(String(e.error||e.message))); }});
const w=dom.window, d=w.document;
let fail=0;
const eq=(g,e,m)=>{const a=JSON.stringify(g),b=JSON.stringify(e);
  if(a!==b){fail++;console.log('  FALHOU '+m+'\n    esperado '+b+'\n    obtido   '+a);}else console.log('  ok  '+m+' = '+a);};
const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
const setSel=(id,v)=>{const e=d.getElementById(id); e.value=v;
  e.dispatchEvent(new w.Event('change',{bubbles:true}));};
const rootChip=pc=>d.querySelectorAll('#roots .chip')[pc];
const kindChip=k=>d.querySelector(`[data-kind="${k}"]`);
const degBtn=i=>d.querySelectorAll('#field-list .deg-btn')[i];
const dot=(s,f)=>[...d.querySelectorAll('.dot')].find(x=>+x.dataset.s===s&&+x.dataset.f===f);
const banner=()=>d.querySelector('#composicao .name').textContent.trim();
const sub=()=>d.querySelector('#composicao .sub').textContent.trim();
const fieldKey=()=>d.getElementById('field-key').textContent.trim();
const field=()=>[...d.querySelectorAll('#field-list .deg-btn')].map(b=>
  b.querySelector('.num').textContent+' '+b.querySelector('.chd').textContent);
const lit=()=>[...d.querySelectorAll('.dot.on')];
const ghost=()=>[...new Set([...d.querySelectorAll('.dot.ghost')].map(x=>x.textContent))].sort();
/* qual botão de tônica está marcado = onde o app acha que está o tom */
const tomMarcado=()=>{const b=[...d.querySelectorAll('#roots .chip')]
  .find(x=>x.getAttribute('aria-pressed')==='true'); return b?b.textContent:'(nenhum)';};
const graus=()=>[...d.querySelectorAll('#composicao table.tones tr')].map(tr=>
  [...tr.children].map(td=>td.textContent.trim()).join(' | '));

console.log('\n[N] O app carrega e pinta');
eq(d.querySelectorAll('.dot').length,78,'78 casas (6 cordas x 13 posições)');
eq([banner(),tomMarcado()],['C','C'],'abre em dó, modo uma nota');
eq(lit().length,6,'6 dós num braço de 12 casas');

console.log('\n[O] Modo uma nota: intocado');
click(dot(0,3));
eq([banner(),tomMarcado(),lit().length],['G','G',7],'cliquei G na 6ª/3ª: tom G, 7 sóis (a 3ª corda dá sol na casa 0 e na 12)');
click(rootChip(0));
eq(banner(),'C','botão de tônica volta pra C');

console.log('\n[P] O BUG RELATADO: grau do campo não pode mover o tom');
click(kindChip('acorde'));
eq([banner(),tomMarcado()],['Cmaj7','C'],'modo acorde: Cmaj7 no tom de C');
eq(fieldKey(),'— tom de C maior','cabeçalho do campo declara o tom');
eq(field(),['I C','ii Dm','iii Em','IV F','V G','vi Am','vii° B°'],'campo de C maior abre em tríades');
click(d.getElementById('btn-tet'));
const antes=field();
eq(antes,['I Cmaj7','ii Dm7','iii Em7','IV Fmaj7','V G7','vi Am7','viiø Bm7♭5'],'tétrades de C maior, com viiø meio-diminuto');
click(degBtn(4));
eq(banner(),'G7','banner virou G7');
eq(tomMarcado(),'C','>>> o tom CONTINUA marcado em C <<<');
eq(fieldKey(),'— tom de C maior','>>> cabeçalho do campo não mudou <<<');
eq(field(),antes,'>>> a lista de graus é a MESMA <<<');
eq(sub(),'grau V — tom de C','subtítulo diz de onde veio');
click(degBtn(1)); eq([banner(),tomMarcado(),field()[0]],['Dm7','C','I Cmaj7'],'grau ii: idem');
click(degBtn(6)); eq([banner(),tomMarcado()],['Bm7♭5','C'],'grau vii: idem');
click(degBtn(2)); eq([banner(),tomMarcado()],['Em7','C'],'grau iii: idem');

console.log('\n[Q] Graus do acorde são lidos como fundamental, não como tônica');
click(degBtn(4));
eq(graus(),['T | G | fundamental do acorde | 3ª, 6ª',
            '3 | B | terça maior | 2ª, 5ª',
            '5 | D | quinta justa | 4ª',
            '♭7 | F | sétima menor | 1ª'],'tabela do G7 na forma 320001, grau por corda');
click(kindChip('nota'));
eq(graus()[0],'T | C | tônica','fora de acorde a nota 1 volta a se chamar tônica');
click(kindChip('acorde'));

console.log('\n[R] Escalas removidas: nada de anéis vazados nem modo escala');
eq(d.querySelectorAll('.dot.ghost').length,0,'nenhum anel vazado no braço');
eq(d.querySelector('[data-kind="escala"]'),null,'o chip de modo escala não existe mais');
eq(d.querySelectorAll('[data-kind]').length,2,'sobraram dois modos: uma nota e acorde');
eq(d.getElementById('btn-ghost'),null,'o botão escala por trás não existe mais');
eq(d.getElementById('sel-scale'),null,'o dropdown de escala não existe mais');
click(degBtn(4));

console.log('\n[S] Trocar de tom recoloca o acorde');
click(rootChip(5));
eq([banner(),tomMarcado(),fieldKey()],['Fmaj7','F','— tom de F maior'],'tom F');
eq(field(),['I Fmaj7','ii Gm7','iii Am7','IV B♭maj7','V C7','vi Dm7','viiø Em7♭5'],'campo de F com si bemol e viiø meio-diminuto');
eq(d.getElementById('btn-tet').className.includes('on'),true,'tétrades seguem ligadas ao trocar de tom');

console.log('\n[T] Bemóis reescrevem sem transpor');
click(degBtn(3)); eq(banner(),'B♭maj7','grau IV de F');
click(d.getElementById('btn-acc'));
eq([banner(),tomMarcado()],['B♭maj7','F'],'em bemóis: mesmo acorde, mesmo tom');
click(d.getElementById('btn-acc'));
eq([banner(),tomMarcado()],['B♭maj7','F'],'de volta a sustenidos: nada se perdeu');

console.log('\n[U] Mesa de montagem');
click(rootChip(0));
click(dot(1,3)); click(dot(2,2)); click(dot(3,0));
eq([banner(),tomMarcado()],['C','C'],'montei dó-mi-sol: reconheceu C e o tom segue visível');
eq(lit().length,3,'só as 3 casas que cliquei estão acesas');
eq(d.querySelectorAll('.dot.x').length,3,'3 cordas sem nota marcadas com x');
click(dot(3,3));
eq([banner(),lit().length],['C7',3],'movi a 3ª corda de sol pra lá♯: virou C7 sem quinta');
click(dot(2,3));
eq(banner(),'C7sus4','movi a 4ª corda de mi pra fá: a terça virou quarta');
click(dot(1,3));
eq(banner(),'F(4)','tirei o dó: sobrou fá com si♭, que é tônica e quarta');
const acts=()=>[...d.querySelectorAll('#composicao [data-act]')].map(b=>b.dataset.act);
eq(acts().includes('tocar')&&acts().includes('limpar'),true,'botões tocar e limpar presentes');
click([...d.querySelectorAll('#composicao [data-act]')].find(b=>b.dataset.act==='limpar'));
eq([banner(),lit().length>6],['Cmaj7',false],'limpei: voltou ao acorde do catálogo');

console.log('\n[V] Formas, editar, orientação, afinação');
setSel('sel-chord','7');
eq(banner(),'C7','dropdown troca a qualidade na fundamental atual');
const formas=[...d.querySelectorAll('#composicao [data-form]')].map(b=>b.textContent.trim());
eq(formas[formas.length-1],'braço todo','último chip volta pro braço todo');
eq(formas.slice(0,-1),['dó · 3ª ○','lá · 3ª','sol · 8ª','mi · 8ª','ré · 10ª'],'5 formas de C7 em 12 casas');
eq(lit().length<=6,true,'forma acende '+lit().length+' casas');
click([...d.querySelectorAll('#composicao [data-act]')].find(b=>b.dataset.act==='editar'));
eq([banner(),tomMarcado()],['C7','C'],'editar joga a forma na mesa, tom continua marcado');
eq(d.querySelectorAll('#composicao [data-form]').length,0,'na mesa não há chips de forma');
click([...d.querySelectorAll('#composicao [data-act]')].find(b=>b.dataset.act==='limpar'));
const chips=[...d.querySelectorAll('#composicao [data-form]')];
click(chips[chips.length-1]);
eq(lit().length>6,true,'braço todo acende o arpejo inteiro ('+lit().length+')');
click(d.getElementById('btn-orient'));
eq(d.getElementById('board').dataset.orient,'h','braço deitou');
click(d.getElementById('btn-orient'));
setSel('sel-frets','22'); eq(d.querySelectorAll('.dot').length,6*23,'22 casas');
setSel('sel-tuning','dadgad'); eq(banner(),'C7','DADGAD sem estourar');
setSel('sel-tuning','std'); setSel('sel-frets','12');
setSel('sel-key','harmonica');
eq(field(),['i Cm(maj7)','iiø Dm7♭5','♭III+ E♭maj7♯5','iv Fm7','V G7','♭VI A♭maj7','vii° B°7'],
   'campo de dó menor harmônica');
click(degBtn(2)); eq([banner(),tomMarcado()],['E♭maj7♯5','C'],'grau ♭III sem forma catalogada: tom intacto');
eq(lit().length>0,true,'a busca achou forma pra ele ('+lit().length+' casas)');


console.log('\n[AA] Navegação por setas de verdade');
const board=d.getElementById('board');
const key=k=>{const el=d.activeElement;
  el.dispatchEvent(new w.KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true}));};
const onde=()=>{const a=d.activeElement; return a&&a.classList.contains('dot')
  ? 'corda '+(6-+a.dataset.s)+', casa '+a.dataset.f : '(fora do braço)';};
const zeros=()=>[...d.querySelectorAll('.dot')].filter(x=>x.tabIndex===0).length;
dot(0,0).focus();
eq(onde(),'corda 6, casa 0','foco inicial na 6ª corda solta');
key('ArrowDown'); eq(onde(),'corda 6, casa 1','baixo desce uma casa (braço em pé)');
key('ArrowDown'); key('ArrowDown'); eq(onde(),'corda 6, casa 3','três casas abaixo');
key('ArrowRight'); eq(onde(),'corda 5, casa 3','direita vai pra corda mais aguda');
key('ArrowUp'); eq(onde(),'corda 5, casa 2','cima sobe uma casa');
key('ArrowLeft'); eq(onde(),'corda 6, casa 2','esquerda volta pra corda grave');
eq(zeros(),1,'só uma casa com tabindex 0 (tabindex móvel)');
key('ArrowLeft'); eq(onde(),'corda 6, casa 2','na borda esquerda o foco não escapa');
for(let i=0;i<20;i++) key('ArrowUp');
eq(onde(),'corda 6, casa 0','subindo demais para na casa 0, sem estourar');
eq(zeros(),1,'ainda um tabindex 0 só');
/* deitado: pestana à direita, mi grave em cima */
click(d.getElementById('btn-orient'));
const col=(s,f)=>+dot(s,f).parentElement.style.gridColumn;
const row=(s,f)=>+dot(s,f).parentElement.style.gridRow;
eq(col(0,0)>col(0,12),true,'casa 0 fica à DIREITA da casa 12 ('+col(0,0)+' > '+col(0,12)+')');
eq(col(0,0),13,'a pestana é a última coluna');
eq(row(0,0)<row(5,0),true,'mi grave em cima do mi agudo (linha '+row(0,0)+' vs '+row(5,0)+')');
eq([row(0,0),row(5,0)],[1,6],'6ª corda na linha 1, 1ª corda na linha 6');
eq(+d.querySelectorAll('.axis')[0].style.gridRow,7,'números das casas embaixo');
dot(0,0).focus();
key('ArrowLeft');  eq(onde(),'corda 6, casa 1','deitado, esquerda avança nas casas');
key('ArrowRight'); eq(onde(),'corda 6, casa 0','direita volta pra pestana');
key('ArrowRight'); eq(onde(),'corda 6, casa 0','na pestana o foco não escapa pela direita');
key('ArrowDown');  eq(onde(),'corda 5, casa 0','baixo vai pra corda mais aguda');
key('ArrowUp');    eq(onde(),'corda 6, casa 0','cima volta pro mi grave');
key('ArrowUp');    eq(onde(),'corda 6, casa 0','no mi grave o foco não escapa por cima');
/* trocar o número de casas não pode mandar a pestana pro outro lado */
setSel('sel-frets','22');
eq([+dot(0,0).parentElement.style.gridColumn,+dot(0,22).parentElement.style.gridColumn],[23,1],
   'com 22 casas a pestana segue na coluna mais à direita');
setSel('sel-frets','12');
click(d.getElementById('btn-orient'));
eq([+dot(0,0).parentElement.style.gridRow,+dot(0,0).parentElement.style.gridColumn],[1,2],
   'em pé: casa 0 na linha 1, mi grave na coluna 2 (depois dos números)');
eq(+dot(5,0).parentElement.style.gridColumn,7,'mi agudo na última coluna, como na imagem de referência');

console.log('\n[AB] "só o conjunto" também apaga a linha das cordas soltas');
click(kindChip('acorde'));
const abertasVisiveis=()=>[...d.querySelectorAll('.cell.open .dot')]
  .filter(x=>!x.classList.contains('hide')&&x.textContent.trim()!=='').length;
const antesHide=abertasVisiveis();
click(d.getElementById('btn-names'));
eq(abertasVisiveis()<antesHide,true,'antes '+antesHide+' rótulos soltos visíveis, agora '+abertasVisiveis());
click(d.getElementById('btn-names'));
eq(abertasVisiveis(),antesHide,'voltou ao normal');


console.log('\n[AC] Botão de limpar seleção na barra do braço');
const unpick=()=>d.getElementById('btn-unpick');
click(rootChip(0)); click(kindChip('nota'));
eq(unpick().hidden,true,'escondido no modo uma nota');
click(kindChip('acorde'));
eq([unpick().hidden,unpick().disabled,unpick().textContent],
   [false,true,'limpar seleção'],'no modo acorde aparece, desabilitado, antes de eu clicar em nada');
click(dot(1,3));
eq([unpick().disabled,unpick().textContent],[false,'limpar seleção (1)'],'1 corda: habilita e conta');
click(dot(2,2)); click(dot(3,0));
eq(unpick().textContent,'limpar seleção (3)','3 cordas: contador acompanha');
eq(banner(),'C','montagem reconhecida como C');
click(unpick());
eq([banner(),unpick().disabled,unpick().textContent,lit().length<=6],
   ['C7',true,'limpar seleção',true],'limpou: voltou ao acorde do dropdown, que estava em 7');
click(dot(1,3)); click(dot(2,2));
eq(unpick().textContent,'limpar seleção (2)','montei de novo');
d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
eq([banner(),unpick().disabled],['C7',true],'Esc limpa também');
/* Esc com foco num select não pode apagar a seleção */
click(dot(1,3));
const sel=d.getElementById('sel-chord');
sel.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
eq(unpick().textContent,'limpar seleção (1)','Esc dentro de um select não limpa');
click(unpick());
eq(d.getElementById('btn-clear').textContent,'recomeçar','o botão do cartão de tônica agora se chama recomeçar');
click(dot(1,3)); click(d.getElementById('btn-clear'));
eq([banner(),unpick().hidden],['C',true],'recomeçar zera tudo e volta pro modo uma nota');

console.log('\n[AD] A escala sobrou como espécie do tom, e o campo harmônico depende dela');
click(rootChip(0)); click(kindChip('nota'));
eq(d.getElementById('card-field').hidden,false,'campo harmônico visível mesmo no modo uma nota');
const opcoes=()=>[...d.getElementById('sel-key').options].map(o=>o.textContent);
eq(opcoes(),['maior','menor natural','menor harmônica','menor melódica'],'quatro espécies de tom');
setSel('sel-key','maior'); click(d.getElementById('btn-tri'));
eq(fieldKey(),'— tom de C maior','cabeçalho do campo');
eq(field()[4],'V G','grau V de dó maior é maior');
setSel('sel-key','menor');
eq([fieldKey(),field()[0],field()[4]],['— tom de C menor natural','i Cm','v Gm'],
   'dó menor natural: o grau V fica menor');
setSel('sel-key','harmonica');
eq([field()[4],field()[6]],['V G','vii° B°'],
   'menor harmônica devolve o V maior — é pra isso que ela existe');
setSel('sel-key','melodica');
eq(field()[3],'IV F','menor melódica: o grau IV vira maior');
setSel('sel-key','harmonica');
click(degBtn(4));
eq([banner(),tomMarcado(),fieldKey()],['G','C','— tom de C menor harmônica'],
   'grau V de dó menor harmônica: G maior, tom intacto');
setSel('sel-key','maior');
eq([banner(),tomMarcado()],['C7','C'],
   'trocar a espécie recoloca o acorde na tônica (dropdown está em 7)');
eq(d.querySelectorAll('.dot.on').length<=6,true,'mostrando uma forma, não o braço todo');

console.log('\n[W] Nenhum erro de execução no caminho todo');
eq(errs,[], 'zero exceções lançadas');
console.log(fail? '\n>>> '+fail+' falha(s)':'\n>>> todos passaram');
process.exit(fail?1:0);
