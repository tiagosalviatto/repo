/* As 126 digitações das folhas, conferidas contra o motor do próprio app.
   "Bate com a teoria" e "bate com a ordem dos graus, a grafia e o array de
   afinação DESTE app" são afirmações diferentes. Esta suíte faz a segunda:
   é ela que pega um grau trocado de lugar, uma linha de tom no lugar errado
   ou um traste digitado a mais numa transcrição feita à mão. */
const E=require('./_harness').engine();
let fail=0;
const eq=(g,e,m)=>{const a=JSON.stringify(g),b=JSON.stringify(e);
  if(a!==b){fail++;console.log('  FALHOU '+m+'\n    esperado '+b+'\n    obtido   '+a);}else console.log('  ok  '+m+' = '+a);};

const std=E.TUNINGS[0].midi;
const maior=E.SCALES.find(s=>s.id==='maior');
const chart=f=>f.map(x=>x===null?'x':String(x)).join('');
/* a linha do tom é indexada pela classe de altura; a letra sai da grafia
   com bemol, que é como as folhas escrevem si♭ e mi♭ */
const LETRA={0:'C',2:'D',3:'E',4:'E',5:'F',7:'G',9:'A',10:'B',11:'B'};
const tons=pc=>[E.LETTERS.indexOf(LETRA[pc]),pc];

console.log('');
console.log('[A] FORMATO: 9 tons x 7 graus, em duas espécies');
eq(Object.keys(E.CADERNO).sort(),['tet','tri'],'duas espécies');
const chaves=e=>Object.keys(E.CADERNO[e]).map(Number).sort((a,b)=>a-b);
eq(chaves('tri'),[0,2,3,4,5,7,9,10,11],'tríades: as nove classes de altura das folhas');
eq(chaves('tet'),[0,2,3,4,5,7,9,10,11],'tétrades: as mesmas nove');
let total=0, malformadas=[];
['tri','tet'].forEach(e=>chaves(e).forEach(pc=>{
  const linha=E.CADERNO[e][pc];
  if(linha.length!==7) malformadas.push(e+' '+pc+' tem '+linha.length+' graus');
  linha.forEach((v,i)=>{ total++;
    if(!/^[0-9x]{6}$/.test(v)) malformadas.push(e+' '+pc+' grau '+i+': '+v); });
}));
eq(malformadas,[],'toda forma é seis caracteres, um por corda, de [0-9x]');
eq(total,126,'126 digitações ao todo');

console.log('');
console.log('[B] MÚSICA: cada forma descreve o acorde que o campo harmônico produz');
const erros=[], iguais=[], difs=[];
['tri','tet'].forEach(esp=>{
  const tet = esp==='tet';
  chaves(esp).forEach(pc=>{
    const [letra,raiz]=tons(pc);
    const campo=E.harmonicField(maior,letra,raiz,tet);
    E.CADERNO[esp][pc].forEach((str,idx)=>{
      const ch=campo[idx];
      const frets=E.cadernoFrets('maior','std',pc,tet,idx);
      const rp=ch.root.pc;
      const pcs=new Set(ch.deg.map(p=>((rp+p[1])%12+12)%12));
      const need=new Set(ch.deg.filter(p=>p[0]!==5).map(p=>((rp+p[1])%12+12)%12));
      const rotulo=esp+' '+E.LETTERS[letra]+' grau '+(idx+1)+' ('+ch.label+') '+str;
      if(!E.valid(frets,std,pcs,need,rp)) { erros.push(rotulo); return; }
      if(E.rootFretOf(frets,std,rp)===null) erros.push('sem fundamental: '+rotulo);
      const ger=E.chordShapes(ch.deg,rp,std,12);
      (ger.length && chart(ger[0].frets)===str ? iguais : difs).push(rotulo);
    });
  });
});
eq(erros,[],'126 formas: só notas do acorde, com fundamental e terça e sétima, mão em 4 casas');

console.log('');
console.log('[C] COBERTURA: fora das folhas, devolve null e o app segue como antes');
eq(E.cadernoFrets('maior','std',0,true,4),[3,null,3,4,3,null],'grau V de dó em tétrade: 3x343x');
eq(E.cadernoFrets('menor','std',0,true,4),null,'escala menor não está nas folhas');
eq(E.cadernoFrets('harmonica','std',0,true,4),null,'menor harmônica idem');
eq(E.cadernoFrets('maior','dadgad',0,true,4),null,'as casas são absolutas: outra afinação, outra história');
eq([1,6,8].map(pc=>E.cadernoFrets('maior','std',pc,false,0)),[null,null,null],
   'os três tons que as folhas não trazem');
eq(E.cadernoFrets('maior','std',0,true,9),null,'grau que não existe');

console.log('');
console.log('[D] QUANTO ISSO MUDA de fato o que aparece na tela');
eq(iguais.length+difs.length,126,'as 126 comparadas contra a primeira forma que o app gera');
eq(difs.length>0,true,difs.length+' digitações diferem do que o app mostraria sozinho, '
   +iguais.length+' já coincidem');

console.log(fail? '\n>>> '+fail+' falha(s)':'\n>>> todos passaram');
process.exit(fail?1:0);
