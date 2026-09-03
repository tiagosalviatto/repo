const E=require('./_harness').engine();
let fail=0;
const eq=(g,e,m)=>{const a=JSON.stringify(g),b=JSON.stringify(e);
  if(a!==b){fail++;console.log('  FALHOU '+m+'\n    esperado '+b+'\n    obtido   '+a);}else console.log('  ok  '+m+' = '+a);};
const std=E.TUNINGS[0].midi;
const nm=pc=>E.LETTERS[E.SHARP_MAP[pc][0]]+E.accStr(E.SHARP_MAP[pc][1]);
const N={C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11,Eb:3,Gb:6,Ab:8,Bb:10,Db:1};

/* le uma cifra tipo x32010 e devolve o nome reconhecido */
function readChart(txt){
  const frets=[...txt.matchAll(/x|\d/g)].map(m=>m[0]==='x'?null:+m[0]);
  const notes=[];
  frets.forEach((f,s)=>{ if(f!==null) notes.push(std[s]+f); });
  notes.sort((a,b)=>a-b);
  const pcs=new Set(notes.map(m=>m%12));
  const c=E.identify(pcs,notes[0]%12);
  if(!c.length) return '(sem nome)';
  return nm(c[0].root)+c[0].sym+(c[0].inv?'/'+nm(notes[0]%12):'');
}
function readNotes(list,bass){
  const pcs=new Set(list.map(x=>N[x]));
  const c=E.identify(pcs,N[bass!==undefined?bass:list[0]]);
  return c.length? c.map(x=>nm(x.root)+x.sym+(x.inv?'/'+nm(N[bass!==undefined?bass:list[0]]):'')) : ['(sem nome)'];
}

console.log('\n[G] DICIONARIO consistente');
const sigs=E.RECOGNIZE.map(e=>E.sigOf(e.deg));
const dup=sigs.filter((s,i)=>sigs.indexOf(s)!==i);
eq(dup,[], E.RECOGNIZE.length+' entradas, nenhuma assinatura repetida');
eq(Object.keys(E.REC_BY_SIG).length, E.RECOGNIZE.length, 'todas indexadas');

console.log('\n[H] RECONHECER conjuntos de notas');
eq(readNotes(['C','E','G'])[0],'C','do mi sol');
eq(readNotes(['C','E','G'],'E')[0],'C/E','mesmas notas, mi no baixo');
eq(readNotes(['C','E','G'],'G')[0],'C/G','sol no baixo');
eq(readNotes(['C','E','G','B'])[0],'Cmaj7','do mi sol si');
eq(readNotes(['C','E','G','Bb'])[0],'C7','do mi sol si bemol');
eq(readNotes(['A','C','E','G'])[0],'Am7','la do mi sol');
eq(readNotes(['C','E','G','A']),['C6','Am7/C'],'do mi sol la: C6, e tambem Am7 invertido');
eq(readNotes(['C','Eb','Gb','A'])[0],'C°7','diminuto de 4 sons');
eq(readNotes(['C','G'])[0],'C5','power chord');
eq(readNotes(['C','E','Bb'])[0],'C7','dominante sem quinta');
eq(readNotes(['E','G#','D','G'])[0],'E7♯9','o acorde do Hendrix (sem quinta)');
eq(readNotes(['C','D','E','G','A'])[0],'C6/9','do re mi sol la');
eq(readNotes(['D','F','A','C','E'])[0],'Dm9','re fa la do mi');
eq(readNotes(['C','Db'])[0],'(sem nome)','duas notas a um semitom nao viram acorde');
eq(readNotes(['C','F','G'])[0],'Csus4','do fa sol');

console.log('\n[I] RECONHECER as formas que a propria ferramenta mostra');
[['x32010','C'],['320003','G'],['xx0232','D'],['x02220','A'],['022100','E'],
 ['133211','F'],['x02210','Am'],['022000','Em'],['xx0231','Dm'],['355333','Gm'],
 ['x32000','Cmaj7'],['320001','G7'],['020100','E7'],['x02020','A7'],['xx0212','D7'],
 ['x02010','Am7'],['xx0211','Dm7'],['020000','Em7'],['x3545x','Cmaj7'],['x2323x','Bm7♭5']]
.forEach(([c,exp])=> eq(readChart(c),exp,c));

console.log('\n[J] IDA E VOLTA: toda forma do catalogo se reconhece de novo');
const bad=[];
E.CHORDS.forEach(ch=>{
  for(let pc=0;pc<12;pc++){
    E.chordShapes(ch.deg,pc,std,12).forEach(v=>{
      const notes=[]; v.frets.forEach((f,s)=>{ if(f!==null) notes.push(std[s]+f); });
      notes.sort((a,b)=>a-b);
      const c=E.identify(new Set(notes.map(m=>m%12)), notes[0]%12);
      if(!c.length){ bad.push('nao reconhecido: '+(ch.sym||'maior')+' '+nm(pc)); return; }
      /* a raiz reconhecida tem de ser a raiz certa, ou uma leitura alternativa valida */
      if(!c.some(x=>x.root===pc)) bad.push((ch.sym||'maior')+' '+nm(pc)+' -> '+nm(c[0].root)+c[0].sym);
    });
  }
});
eq(bad.slice(0,8),[], 'toda forma gerada volta a ser reconhecida com a tonica certa');
console.log(fail? '\n>>> '+fail+' falha(s)':'\n>>> todos passaram');
process.exit(fail?1:0);
