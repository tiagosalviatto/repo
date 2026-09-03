/* simula a mesa de montagem: replica a regra de clique do app e
   passa o resultado pelo reconhecimento */
const E=require('./_harness').engine();
let fail=0;
const eq=(g,e,m)=>{const a=JSON.stringify(g),b=JSON.stringify(e);
  if(a!==b){fail++;console.log('  FALHOU '+m+'\n    esperado '+b+'\n    obtido   '+a);}else console.log('  ok  '+m+' = '+a);};
const std=E.TUNINGS[0].midi;
const nm=pc=>E.LETTERS[E.SHARP_MAP[pc][0]]+E.accStr(E.SHARP_MAP[pc][1]);

/* mesma regra do onPick: uma casa por corda; reclicar tira; outra casa muda de lugar */
function click(picked,s,f){
  const i=picked.findIndex(p=>p.s===s);
  if(i>=0){ if(picked[i].f===f) picked.splice(i,1); else picked[i]={s,f}; }
  else picked.push({s,f});
  return picked;
}
function readPicked(picked){
  if(!picked.length) return '(vazio)';
  const notes=picked.map(p=>std[p.s]+p.f).sort((a,b)=>a-b);
  const c=E.identify(new Set(notes.map(m=>m%12)), notes[0]%12);
  if(!c.length) return '(sem nome)';
  return nm(c[0].root)+c[0].sym+(c[0].inv?'/'+nm(notes[0]%12):'');
}
/* helper: cifra "x32010" -> lista de cliques */
function build(txt){
  const p=[]; [...txt].forEach((ch,s)=>{ if(ch!=='x') click(p,s,+ch); }); return p;
}

console.log('\n[K] MESA DE MONTAGEM: regra de clique');
let p=[];
click(p,1,3);              eq(readPicked(p),'(sem nome)','1 nota: C na 5a corda -> sem nome ainda');
click(p,2,2);              eq(readPicked(p),'C(3)','+ E: so tonica e terca maior');
click(p,3,0);              eq(readPicked(p),'C','+ G: virou C maior');
click(p,4,1);              eq(readPicked(p),'C','+ C dobrado: continua C');
click(p,5,0);              eq(readPicked(p),'C','+ E agudo: o x32010 inteiro');
eq(p.length,5,'5 cordas selecionadas');
click(p,2,3);              eq(readPicked(p),'Cadd11','movi o dedo da 4a corda de E pra F -> Cadd11');
eq(p.filter(x=>x.s===2).length,1,'a 4a corda continua com uma casa so, nao duas');
click(p,2,3);              eq(readPicked(p),'C','reclicar tira a nota: volta a ser C (sem a 4a corda)');

console.log('\n[L] MONTAR acordes conhecidos clicando');
eq(readPicked(build('x32000')),'Cmaj7','montei x32000');
eq(readPicked(build('x35553')),'C','x35553 e pestana de C maior, nao maj7');
eq(readPicked(build('020100')),'E7','montei 020100');
eq(readPicked(build('x02010')),'Am7','montei x02010');
eq(readPicked(build('320033')),'G','montei 320033');
eq(readPicked(build('xx2210')),'Am/E','xx2210 e Am com mi no baixo — inversao');
eq(readPicked(build('x02210')),'Am','montei x02210');
eq(readPicked(build('x00210')),'Am(add11)','x00210 tem re: Am com quarta somada');
eq(readPicked(build('076780')),'E7♯9','o acorde do Hendrix montado no braco');
eq(readPicked(build('xx0010')),'Cadd9/D','xx0010 = re sol do mi -> Cadd9 invertido');
eq(readPicked(build('x2413x')),'Bm6','x2413x nao era lixo: e um Bm6');
/* x1413x tambem era acorde de verdade. Pra achar algo sem nome preciso de um
   agregado cromatico, cujas tres rotacoes estao todas fora do dicionario. */
eq(readPicked([{s:3,f:5},{s:4,f:2},{s:5,f:2}]),'(sem nome)','do + do# + fa#: sem nome em nenhuma rotacao');

console.log('\n[M] TODA forma do catalogo, montada a mao, se reconhece');
const bad=[];
E.CHORDS.forEach(ch=>{ for(let pc=0;pc<12;pc++){
  E.chordShapes(ch.deg,pc,std,12).forEach(v=>{
    const picked=[]; v.frets.forEach((f,s)=>{ if(f!==null) click(picked,s,f); });
    if(picked.length!==v.frets.filter(x=>x!==null).length)
      bad.push('perdeu nota: '+v.frets.join(','));
    if(readPicked(picked)==='(sem nome)') bad.push('sem nome: '+(ch.sym||'maior')+' '+nm(pc));
  });
}});
eq(bad.slice(0,5),[], 'nenhuma forma se perde nem fica sem nome ao ser montada');
console.log(fail? '\n>>> '+fail+' falha(s)':'\n>>> todos passaram');
process.exit(fail?1:0);
