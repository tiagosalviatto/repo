const E=require('./_harness').engine();
let fail=0;
const eq=(g,e,m)=>{const a=JSON.stringify(g),b=JSON.stringify(e);
  if(a!==b){fail++;console.log('  FALHOU '+m+'\n    esperado '+b+'\n    obtido   '+a);}else console.log('  ok  '+m+' = '+a);};
const chart=v=>v.frets.map(x=>x===null?'x':x).join('');
const std=E.TUNINGS[0].midi;
const ch=id=>E.CHORDS.find(c=>c.id===id);
const shp=(id,pc,tun=std,mx=12)=>E.chordShapes(ch(id).deg,pc,tun,mx);

console.log('\n[A] VALIDADE: toda forma catalogada, em toda tonica, so toca notas do acorde');
let checked=0, bad=[];
E.CHORDS.forEach(c=>{
  if(!E.FORMS[c.id]) return;
  for(let pc=0;pc<12;pc++){
    const pcs=new Set(c.deg.map(p=>(pc+p[1])%12));
    shp(c.id,pc,std,22).forEach(v=>{
      checked++;
      for(let s=0;s<6;s++){
        if(v.frets[s]===null) continue;
        if(!pcs.has((std[s]+v.frets[s])%12)) bad.push(c.id+' '+pc+' '+chart(v));
      }
      const got=new Set(); v.frets.forEach((f,s)=>{if(f!==null)got.add((std[s]+f)%12);});
      if(!got.has(pc)) bad.push('sem tonica: '+c.id+' '+pc+' '+chart(v));
      c.deg.filter(p=>p[0]!==5).forEach(p=>{
        if(!got.has((pc+p[1])%12)) bad.push('sem tom essencial: '+c.id+' '+pc+' '+chart(v));
      });
    });
  }
});
eq(bad.slice(0,6),[], checked+' formas resolvidas, nenhuma nota errada');

console.log('\n[B] A PRIMEIRA FORMA e a que o violonista toca de verdade');
const first=(id,pc)=>{const l=shp(id,pc); return l.length?chart(l[0]):'(nada)';};
eq(first('maj',0),'x32010','C maior');
eq(first('maj',7),'320003','G maior');
eq(first('maj',2),'xx0232','D maior');
eq(first('maj',9),'x02220','A maior');
eq(first('maj',4),'022100','E maior');
eq(first('maj',5),'133211','F maior (pestana)');
eq(first('min',9),'x02210','A menor');
eq(first('min',4),'022000','E menor');
eq(first('min',2),'xx0231','D menor');
eq(first('min',7),'355333','G menor (pestana)');
eq(first('maj7',0),'x32000','Cmaj7');
eq(first('7',7),'320001','G7');
eq(first('7',4),'020100','E7');
eq(first('7',9),'x02020','A7');
eq(first('7',2),'xx0212','D7');
eq(first('m7',9),'x02010','Am7');
eq(first('m7',2),'xx0211','Dm7');
eq(first('m7',4),'020000','Em7');
eq(first('sus4',9),'x02230','Asus4');
eq(first('sus2',2),'xx0230','Dsus2');

console.log('\n[C] COBERTURA: toda qualidade em toda tonica tem forma em 12 casas');
const holes=[];
E.CHORDS.forEach(c=>{ for(let pc=0;pc<12;pc++) if(!shp(c.id,pc).length) holes.push(c.id+'/'+pc); });
eq(holes,[], '16 qualidades x 12 tonicas sem buraco');

console.log('\n[D] FALLBACK: acorde exotico do campo harmonico cai na busca');
const hf=E.harmonicField(E.SCALES.find(s=>s.id==='harmonica'),5,9,true);
const iii=hf[2];                                 // Cmaj7#5 — nao existe no catalogo
eq(iii.label,'Cmaj7♯5','grau III da menor harmonica');
eq(E.FORMS_BY_SIG[E.sigOf(iii.deg)]===undefined,true,'nao ha forma catalogada pra ele');
const vs=E.chordShapes(iii.deg,0,std,12);
eq(vs.length>0,true,'a busca achou '+vs.length+' forma(s)');
const pcsE=new Set(iii.deg.map(p=>(0+p[1])%12));
let bad2=[]; vs.forEach(v=>{for(let s=0;s<6;s++){if(v.frets[s]===null)continue;
  if(!pcsE.has((std[s]+v.frets[s])%12)) bad2.push(chart(v));}});
eq(bad2,[], 'formas da busca nao tem nota errada');
eq(chart(vs[0]).length,6,'primeira forma da busca: '+chart(vs[0]));

console.log('\n[E] AFINACAO ALTERNATIVA: CAGED invalido e descartado, nao aceito');
['dropd','dadgad','openg'].forEach(t=>{
  const tun=E.TUNINGS.find(x=>x.id===t).midi;
  let n=0,b=[];
  E.CHORDS.forEach(c=>{ for(let pc=0;pc<12;pc++){
    E.chordShapes(c.deg,pc,tun,12).forEach(v=>{ n++;
      const pcs=new Set(c.deg.map(p=>(pc+p[1])%12));
      for(let s=0;s<6;s++){ if(v.frets[s]===null)continue;
        if(!pcs.has((tun[s]+v.frets[s])%12)) b.push(t+' '+c.id+' '+chart(v)); }});
  }});
  eq(b.slice(0,3),[], t+': '+n+' formas, todas coerentes');
});

console.log('\n[F] SANIDADE: vao de mao e numero de notas');
let wide=[], thin=[];
E.CHORDS.forEach(c=>{ for(let pc=0;pc<12;pc++) shp(c.id,pc,std,22).forEach(v=>{
  const f=v.frets.filter(x=>x!==null&&x>0);
  if(f.length && Math.max(...f)-Math.min(...f)>3) wide.push(c.id+' '+chart(v));
  if(v.frets.filter(x=>x!==null).length<3) thin.push(c.id+' '+chart(v));
});});
eq(wide.slice(0,4),[], 'nenhuma forma exige vao maior que 4 casas');
eq(thin,[], 'nenhuma forma com menos de 3 notas');

console.log(fail? '\n>>> '+fail+' falha(s)' : '\n>>> todos passaram');
process.exit(fail?1:0);
