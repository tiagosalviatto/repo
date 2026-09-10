/* Le as cores direto do arquivo e mede o contraste do anel de foco.
   Se eu mexer na paleta e quebrar a visibilidade, este teste cai. */
const css=require('./_harness').html;
let fail=0;
const eq=(g,e,m)=>{const a=JSON.stringify(g),b=JSON.stringify(e);
  if(a!==b){fail++;console.log('  FALHOU '+m+'\n    esperado '+b+'\n    obtido   '+a);}else console.log('  ok  '+m+' = '+a);};
const varOf=n=>{const m=css.match(new RegExp('--'+n+':\\s*(#[0-9A-Fa-f]{6})'));return m&&m[1];};
const hex=h=>[1,3,5].map(i=>parseInt(h.substr(i,2),16));
const lin=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);};
const L=r=>0.2126*lin(r[0])+0.7152*lin(r[1])+0.0722*lin(r[2]);
const ratio=(a,b)=>{const x=L(a),y=L(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);};
const over=(fg,a,bg)=>fg.map((c,i)=>c*a+bg[i]*(1-a));
const ok3=v=>Math.round(v*100)/100>=3;

const bone=hex(varOf('bone')), wood1=hex(varOf('wood-1')), wood2=hex(varOf('wood-2'));
const bench=hex(varOf('bench')), panel=hex(varOf('panel')), ink=hex(varOf('ink'));

console.log('\n[X] O anel de foco do braço é visível nos dois fundos');
eq(!!bone && !!wood2 && !!bench, true, 'li a paleta do arquivo');
eq(/\.dot:focus-visible\{[^}]*outline:[^;]*var\(--bone\)/.test(css.replace(/\s+/g,'')
   .replace(/\.dot:focus-visible\{/,'.dot:focus-visible{')), true, 'existe regra .dot:focus-visible com anel claro');
eq(/\.dot:focus-visible::after/.test(css), true, 'existe a segunda camada, escura');
eq(/\.cell:has\(\.dot:focus-visible\)/.test(css), true, 'a casa em foco sobe de camada');

const claro = [['jacarandá claro',ratio(bone,wood1)],['jacarandá escuro',ratio(bone,wood2)]];
claro.forEach(([n,v])=> eq(ok3(v), true, 'camada clara vs '+n+': '+v.toFixed(2)+':1'));
const escuro = [['bancada',ratio(over(ink,.85,bench),bench)],['painel',ratio(over(ink,.85,panel),panel)]];
escuro.forEach(([n,v])=> eq(ok3(v), true, 'camada escura vs '+n+': '+v.toFixed(2)+':1'));

console.log('\n[Y] Cada fundo do braço tem pelo menos uma camada acima de 3:1');
[['madeira',wood2],['bancada (cordas soltas)',bench]].forEach(([n,bg])=>{
  const a=ratio(bone,bg), b=ratio(over(ink,.85,bg),bg);
  eq(ok3(Math.max(a,b)), true, n+': melhor camada dá '+Math.max(a,b).toFixed(2)+':1');
});
console.log('\n[ZA] O traço aceso do afinador vive sobre painel claro');
/* nenhum acento da paleta chega a 3:1 sobre o painel — o azul-petróleo dá
   2,67:1 — então o traço aceso é --ink e a cor entra só como reforço do que
   o texto embaixo do arco já diz por escrito. */
eq(ok3(ratio(ink,panel)), true, 'traço aceso em --ink sobre painel: '+ratio(ink,panel).toFixed(2)+':1');
eq(/\.arci\.on::before\{background:var\(--ink\)/.test(css.replace(/\s+/g,'')), true,
   'e a regra do arco usa mesmo var(--ink), não um acento');

console.log('\n[Z] O anel antigo, escuro sobre madeira, era de fato invisível');
eq(ratio(ink,wood2)<1.1, true, 'anel antigo dava '+ratio(ink,wood2).toFixed(2)+':1 — era isso que você via');
console.log(fail? '\n>>> '+fail+' falha(s)':'\n>>> todos passaram');
process.exit(fail?1:0);
