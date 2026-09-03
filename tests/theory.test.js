const T=require('./_harness').engine();
let fail=0;
const eq=(got,exp,msg)=>{const g=JSON.stringify(got),e=JSON.stringify(exp);
  if(g!==e){fail++;console.log('  FALHOU '+msg+'\n    esperado '+e+'\n    obtido   '+g);}else console.log('  ok  '+msg+' = '+g);};

function names(rootPc, acc, set){
  const m=(acc==='b'?T.FLAT_MAP:T.SHARP_MAP)[rootPc];
  return set.deg.map(([d,s])=>T.spell(m[0],rootPc,d,s).name);
}
const sc=id=>T.SCALES.find(s=>s.id===id);
const ch=id=>T.CHORDS.find(c=>c.id===id);

console.log('\n[1] grafia de escalas (letra pelo grau, acidente pelo semitom)');
eq(names(0,'#',sc('maior')),['C','D','E','F','G','A','B'],'C maior');
eq(names(5,'#',sc('maior')),['F','G','A','B♭','C','D','E'],'F maior tem B♭, nao A♯');
eq(names(6,'#',sc('maior')),['F♯','G♯','A♯','B','C♯','D♯','E♯'],'F♯ maior tem E♯');
eq(names(6,'b',sc('maior')),['G♭','A♭','B♭','C♭','D♭','E♭','F'],'G♭ maior tem C♭');
eq(names(9,'#',sc('menor')),['A','B','C','D','E','F','G'],'A menor natural');
eq(names(8,'#',sc('harmonica')),['G♯','A♯','B','C♯','D♯','E','F♯♯'],'G♯ harmonica: 7a maior = F♯♯');
/* estas escalas saíram do app, mas o motor de grafia é genérico:
   passo a lista de graus na mão pra continuar cobrindo os casos */
eq(names(0,'#',{deg:[[1,0],[3,3],[4,5],[5,6],[5,7],[7,10]]}),
   ['C','E♭','F','G♭','G','B♭'],'C blues (lista de graus inline)');
eq(names(0,'#',{deg:[[1,0],[2,2],[3,4],[4,6],[5,7],[6,9],[7,11]]}),
   ['C','D','E','F♯','G','A','B'],'C lídio (inline)');

console.log('\n[2] graus e semitons dos acordes');
eq(names(0,'#',ch('maj7')),['C','E','G','B'],'Cmaj7');
eq(names(0,'#',ch('m7b5')),['C','E♭','G♭','B♭'],'Cm7♭5');
eq(names(0,'#',ch('dim7')),['C','E♭','G♭','B♭♭'],'C°7 tem B♭♭ (7a diminuta)');
eq(names(2,'#',ch('7')),['D','F♯','A','C'],'D7');
eq(ch('maj7').deg.map(p=>T.ivShort(...p)),['T','3','5','7'],'rotulos maj7');
eq(ch('m7b5').deg.map(p=>T.ivShort(...p)),['T','♭3','♭5','♭7'],'rotulos m7♭5');
eq([[1,0],[2,2],[3,4],[4,6],[5,7],[6,9],[7,11]].map(p=>T.ivShort(...p)),
   ['T','2','3','♯4','5','6','7'],'rotulos de grau com 4a aumentada');
eq([1,3,5,7,2,4,6,9].map(T.fnOf),['root','third','fifth','seventh','other','other','seventh','other'],'cores por funcao');
eq(T.ivName(3,3),'terça menor','nome 3m'); eq(T.ivName(7,9),'sétima diminuta','nome 7dim');

console.log('\n[3] campo harmonico');
const triC=T.harmonicField(sc('maior'),0,0,false);
eq(triC.map(c=>c.num+' '+c.label),['I C','ii Dm','iii Em','IV F','V G','vi Am','vii° B°'],'C maior, triades');
const tetC=T.harmonicField(sc('maior'),0,0,true);
eq(tetC.map(c=>c.label),['Cmaj7','Dm7','Em7','Fmaj7','G7','Am7','Bm7♭5'],'C maior, tetrades');
const tetA=T.harmonicField(sc('menor'),T.SHARP_MAP[9][0],9,true);
eq(tetA.map(c=>c.num+' '+c.label),['i Am7','iiø Bm7♭5','♭III Cmaj7','iv Dm7','v Em7','♭VI Fmaj7','♭VII G7'],'A menor natural, tetrades');
const tetH=T.harmonicField(sc('harmonica'),T.SHARP_MAP[9][0],9,true);
eq(tetH.map(c=>c.label),['Am(maj7)','Bm7♭5','Cmaj7♯5','Dm7','E7','Fmaj7','G♯°7'],'A harmonica, tetrades');
eq(T.harmonicField({deg:[[1,0],[2,2],[3,3],[4,5],[5,7],[6,9],[7,10]]},T.SHARP_MAP[2][0],2,true)
   .map(c=>c.label),['Dm7','Em7','Fmaj7','G7','Am7','Bm7♭5','Cmaj7'],'D dorico inline, tetrades');
eq(T.harmonicField(sc('melodica'),T.SHARP_MAP[9][0],9,true).map(c=>c.label),
   ['Am(maj7)','Bm7','Cmaj7♯5','D7','E7','F♯m7♭5','G♯m7♭5'],'A menor melodica, tetrades');
eq(T.harmonicField({deg:[[1,0],[2,2],[3,4],[5,7],[6,9]]},0,0,false).length,0,
   'escala de 5 notas nao gera campo harmonico');
eq(T.SCALES.map(x=>x.id),['maior','menor','harmonica','melodica'],
   'o app guarda so as 4 especies de tom, todas de 7 notas');
eq(T.SCALES.every(x=>x.deg.length===7),true,'todas de 7 notas, entao toda uma gera campo');

console.log('\n[4] intervalos internos dos acordes do campo (usados pra pintar o braco)');
eq(tetC[6].deg.map(p=>T.ivShort(...p)),['T','♭3','♭5','♭7'],'vii de C maior pintado como m7♭5');
eq(tetC[4].deg.map(p=>T.ivShort(...p)),['T','3','5','♭7'],'V de C maior pintado como 7');
eq(tetH[2].deg.map(p=>T.ivShort(...p)),['T','3','♯5','7'],'III de A harmonica = maj7♯5');
eq(names(0,'#',{deg:tetC[6].deg}).length,4,'grafia do acorde do campo nao explode');

console.log('\n[5] posicoes no braco (afinacao padrao)');
const std=T.TUNINGS[0].midi;
const nm=pc=>T.LETTERS[T.SHARP_MAP[pc][0]]+T.accStr(T.SHARP_MAP[pc][1]);
eq(nm((std[0]+3)%12),'G','corda 6, casa 3');
eq(nm((std[1]+3)%12),'C','corda 5, casa 3');
eq(nm((std[3]+2)%12),'A','corda 4, casa 2');
eq(nm((std[4]+1)%12),'C','corda 2, casa 1');
eq(std.map(m=>nm(m%12)),['E','A','D','G','B','E'],'cordas soltas');
eq(std.map(m=>nm((m+12)%12)),['E','A','D','G','B','E'],'casa 12 = mesma nota');
eq((440*Math.pow(2,(std[1]-69)/12)).toFixed(2),'110.00','A2 = 110 Hz');

console.log(fail? '\n>>> '+fail+' falha(s)':'\n>>> todos passaram');
process.exit(fail?1:0);
