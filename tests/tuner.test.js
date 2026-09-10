/* Afinador: o detector inteiro é função pura de um buffer de números, então
   dá para exercitá-lo com sinal sintético — sem microfone, sem aparelho, sem
   depender de eu ter um violão na mão na hora de rodar o teste.

   Os sinais aqui não são senóides bonitas de laboratório: têm harmônicos,
   fundamental fraca, envelope de decaimento e ruído, porque é isso que o
   microfone entrega. O caso que mais importa é o do mi grave com a
   fundamental quase ausente — é o que faria um afinador ingênuo dizer
   "si, afinado" quando você tocou um mi. */
const E = require('./_harness').engine();
let fail=0;
const eq=(g,e,m)=>{const a=JSON.stringify(g),b=JSON.stringify(e);
  if(a!==b){fail++;console.log('  FALHOU '+m+'\n    esperado '+b+'\n    obtido   '+a);}else console.log('  ok  '+m+' = '+a);};
const near=(g,e,tol,m)=>{const d=Math.abs(g-e);
  if(!(d<=tol)){fail++;console.log('  FALHOU '+m+'\n    '+g.toFixed(3)+' longe de '+e+' (tolerância '+tol+')');}
  else console.log('  ok  '+m+' = '+g.toFixed(2)+' (±'+tol+' de '+e+')');};

const STD = [40,45,50,55,59,64];          // mi lá ré sol si mi
const NOMES = ['mi grave','lá','ré','sol','si','mi agudo'];
const N = 4096;                            // a mesma janela que o app usa

/* aleatório com semente: teste que passa ou falha por sorte não é teste, e
   ruído é justamente onde isso morde */
let seed = 20260910;
const rnd = ()=>{ seed = (seed*1664525 + 1013904223) >>> 0; return seed/4294967296; };

/* soma de parciais, com fase aleatória: se o detector dependesse de fase,
   este gerador denunciaria */
function gen(sr, n, parts, decay){
  const b = new Float32Array(n);
  const ph = parts.map(()=>rnd()*Math.PI*2);
  for (let i=0;i<n;i++){
    let v=0;
    parts.forEach(([hz,amp],k)=>{ v += amp*Math.sin(2*Math.PI*hz*i/sr + ph[k]); });
    b[i] = decay ? v*Math.exp(-i/(sr*decay)) : v;
  }
  return b;
}
const detune=(hz,cents)=>hz*Math.pow(2,cents/1200);
const serie=(f0,amps)=>amps.map((a,k)=>[f0*(k+1),a]);

console.log('\n[TA] Aritmética de altura');
near(E.hzOfMidi(69),440,1e-9,'midi 69 é o lá de 440');
near(E.hzOfMidi(40),82.4069,1e-3,'midi 40 é o mi grave em 82,41 Hz');
near(E.hzOfMidi(64),329.6276,1e-3,'midi 64 é o mi agudo em 329,63 Hz');
near(E.centsBetween(880,440),1200,1e-9,'uma oitava são 1200 cents');
near(E.centsBetween(440,440),0,1e-12,'a nota contra ela mesma dá zero');
near(E.centsBetween(E.hzOfMidi(41),E.hzOfMidi(40)),100,1e-9,'um semitom são 100 cents');
/* o 3º harmônico do mi grave contra o si: é esta coincidência de 2 cents
   que obriga um afinador automático a ter regra de desempate */
near(E.centsBetween(3*E.hzOfMidi(40),E.hzOfMidi(59)),1.955,0.01,
     '3º harmônico do mi grave está a 2 cents do si — a colisão que o alvo conhecido evita');
near(E.centsBetween(4*E.hzOfMidi(40),E.hzOfMidi(64)),0,1e-9,
     'e o 4º harmônico do mi grave É o mi agudo, exato');

console.log('\n[TB] Os alvos saem da afinação, não de constante fixa');
const T = E.tuneTargets(STD);
eq(T.length,6,'seis alvos');
eq(T.map(t=>t.str),[6,5,4,3,2,1],'numeradas como o violonista conta: 6ª é a grave');
near(T[0].hz,82.4069,1e-3,'6ª corda mira 82,41 Hz');
near(T[5].hz,329.6276,1e-3,'1ª corda mira 329,63 Hz');
eq(E.tuneTargets([38,45,50,55,59,64])[0].midi,38,'Drop D vem de graça: 6ª corda em ré');
eq(E.tuneTargets([38,45,50,55,57,62]).map(t=>t.midi),[38,45,50,55,57,62],'DADGAD também');

console.log('\n[TC] Corda afinada, nas seis cordas e nas duas taxas usuais');
[44100,48000].forEach(sr=>{
  T.forEach((t,i)=>{
    const buf = gen(sr, N, serie(t.hz,[1,.5,.3,.15]));
    const d = E.detectNear(buf, sr, t.hz);
    if (!d){ fail++; console.log('  FALHOU '+NOMES[i]+' a '+sr+' Hz não detectou nada'); return; }
    near(d.cents,0,1.5,NOMES[i]+' afinada a '+sr+' Hz');
  });
});

console.log('\n[TD] Corda desafinada: o número tem de ser o certo, com sinal certo');
[[-40,'40 cents abaixo'],[-20,'20 abaixo'],[-7,'7 abaixo'],
 [7,'7 acima'],[20,'20 acima'],[40,'40 acima']].forEach(([c,nome])=>{
  const sr=48000, t=T[0];
  const d = E.detectNear(gen(sr,N,serie(detune(t.hz,c),[1,.5,.3])), sr, t.hz);
  near(d ? d.cents : NaN, c, 2, 'mi grave '+nome);
});
/* na corda aguda um erro de uma amostra de lag já vale 12,9 cents, então
   este bloco só passa porque existe interpolação sub-amostra */
[[-9,'9 abaixo'],[3,'3 acima'],[15,'15 acima']].forEach(([c,nome])=>{
  const sr=48000, t=T[5];
  const d = E.detectNear(gen(sr,N,serie(detune(t.hz,c),[1,.4,.2])), sr, t.hz);
  near(d ? d.cents : NaN, c, 2.5, 'mi agudo '+nome+' (quantização crua seria ±12,9)');
});

console.log('\n[TE] O caso que decide a feature: fundamental fraca ou ausente');
/* o microfone do celular corta abaixo de ~100 Hz. O que chega do mi grave
   é quase só harmônico — e a autocorrelação ainda acha o período da
   fundamental, porque a série inteira se repete nele. */
const sr=48000, e2=T[0].hz;
let d = E.detectNear(gen(sr,N,[[e2,0.08],[2*e2,1],[3*e2,.7],[4*e2,.5]]), sr, e2);
near(d ? d.cents : NaN, 0, 2, 'mi grave com fundamental a 8% ainda lê 82,41 Hz');
d = E.detectNear(gen(sr,N,[[2*e2,1],[3*e2,.7],[4*e2,.5],[5*e2,.3]]), sr, e2);
near(d ? d.cents : NaN, 0, 2, 'mi grave SEM fundamental nenhuma: idem');
/* e o outro lado da mesma moeda: esse sinal não pode se passar por si nem
   por mi agudo, que é onde os harmônicos 3 e 4 caem */
eq(E.detectNear(gen(sr,N,serie(e2,[1,.6,.6,.5])), sr, T[4].hz), null,
   'mi grave tocado com a 2ª corda selecionada: não finge que é si');
eq(E.detectNear(gen(sr,N,serie(e2,[1,.6,.6,.5])), sr, T[5].hz), null,
   'nem que é mi agudo, apesar do 4º harmônico bater exato');

console.log('\n[TF] Nylon: decai rápido, e ainda assim');
[[0.35,'decaimento de 350ms'],[0.2,'decaimento de 200ms']].forEach(([tau,nome])=>{
  const d = E.detectNear(gen(sr,N,serie(e2,[1,.5,.3]),tau), sr, e2);
  near(d ? d.cents : NaN, 0, 2, 'mi grave com '+nome);
});

console.log('\n[TFB] Ruído de sala: é a mediana que compra a estabilidade');
/* ~12 dB de SNR, que é pessimista para uma corda tocada perto do aparelho.
   Um quadro sozinho erra vários cents — o número está medido aqui embaixo.
   É exatamente por isso que o mostrador não mostra quadro: mostra a mediana
   de sete, e este bloco é a prova de que ela paga o próprio custo. */
const quadroSujo = ()=>{
  const b = gen(sr,N,serie(e2,[1,.5,.3]));
  for (let i=0;i<N;i++) b[i] += (rnd()*2-1)*0.35;
  return E.detectNear(b,sr,e2);
};
const leituras=[]; for (let i=0;i<E.TUNE_HIST;i++){ const d=quadroSujo(); if(d) leituras.push(d.cents); }
eq(leituras.length,E.TUNE_HIST,'sete quadros ruidosos, sete leituras: o gate não descartou nenhuma');
const pior = Math.max(...leituras.map(Math.abs));
const med = Math.abs(E.medianOf(leituras));
eq(pior>3,true,'o pior quadro sozinho errou '+pior.toFixed(1)+' cents — quadro cru não serve de mostrador');
eq(med<pior/2,true,'a mediana dos sete errou '+med.toFixed(1)+', menos da metade do pior');
near(E.medianOf(leituras), 0, 3, 'e cai dentro de 3 cents, que é meio traço do arco');

console.log('\n[TG] Quando NÃO há nota, o ponteiro não pode mexer');
eq(E.detectNear(new Float32Array(N), sr, e2), null, 'silêncio absoluto');
eq(E.detectNear(gen(sr,N,serie(e2,[1,.5])).map(v=>v*0.002), sr, e2), null,
   'corda quase inaudível fica abaixo do gate de nível');
const ruido = new Float32Array(N);
for (let i=0;i<N;i++) ruido[i] = rnd()*2-1;
eq(E.detectNear(ruido, sr, e2), null, 'ruído branco não vira nota');
eq(E.detectNear(gen(sr,N,serie(detune(e2,400),[1,.5,.3])), sr, e2), null,
   'nota 400 cents fora da janela: não é esta corda');
eq(E.detectNear(gen(sr,1024,serie(e2,[1,.5])), sr, e2), null,
   'janela curta demais para três períodos do mi grave: recusa em vez de chutar');

console.log('\n[TH] Mediana ignora o quadro ruim, média não');
eq(E.medianOf([11,10,12,90,11]),11,'mediana de cinco leituras com um outlier');
eq(E.medianOf([10,12]),11,'par: média dos dois do meio');
eq(E.medianOf([7]),7,'uma leitura só');
eq(E.medianOf([]),null,'sem leitura, sem número');
const comOutlier=[11,10,12,90,11];
const media=comOutlier.reduce((a,b)=>a+b,0)/comOutlier.length;
eq([E.medianOf(comOutlier),Math.round(media)],[11,27],
   'o mesmo conjunto: mediana 11, média 27 — é por isso que é mediana');

console.log('\n[TI] O arco: 21 traços, 5 cents cada, centro é afinado');
eq(E.TUNE_SEGMENTS,21,'21 traços');
eq(E.arcIndex(0),10,'afinado acende o do meio');
eq([E.arcIndex(-50),E.arcIndex(50)],[0,20],'±50 cents são os extremos');
eq([E.arcIndex(-999),E.arcIndex(999)],[0,20],'fora da escala satura, não estoura');
eq([E.arcIndex(-5),E.arcIndex(5)],[9,11],'5 cents move exatamente um traço');
eq([E.arcIndex(-2),E.arcIndex(2)],[10,10],'2 cents ainda é o traço do meio — não mostro precisão que não tenho');
/* uma régua só: "afinada" tem de valer exatamente enquanto o traço do meio
   está aceso, senão o texto e o ponteiro discordam na cara do usuário */
eq(E.TUNE_OK_CENTS, E.TUNE_ARC_SPAN/((E.TUNE_SEGMENTS-1)/2)/2,
   'a tolerância de afinada ('+E.TUNE_OK_CENTS+' cents) é meio traço, por construção');
eq([E.arcIndex(E.TUNE_OK_CENTS-0.01),E.arcIndex(-(E.TUNE_OK_CENTS-0.01))],[10,10],
   'no limite de dentro, o traço aceso ainda é o do meio');
eq([E.arcIndex(E.TUNE_OK_CENTS+0.01),E.arcIndex(-(E.TUNE_OK_CENTS+0.01))],[11,9],
   'um centésimo de cent para fora e o ponteiro já saiu do centro');

console.log(fail? '\n>>> '+fail+' falha(s)':'\n>>> todos passaram');
process.exit(fail?1:0);
