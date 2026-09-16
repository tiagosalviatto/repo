/* Lê as cores direto do arquivo e mede contraste. Se eu mexer na paleta e
   quebrar a visibilidade, este teste cai.

   Com tema e estilo de braço, isto deixou de ser uma paleta e virou uma
   matriz: 4 braços x 2 temas. O anel de foco tem duas camadas, e cada uma
   responde por UM fundo — --ring-wood pela madeira, que vem do estilo, e
   --ring-bench pela bancada, que vem do tema. A promessa é que em qualquer
   das oito combinações a casa em foco apareça, e é isso que se mede aqui. */
const css=require('./_harness').html;
let fail=0;
const eq=(g,e,m)=>{const a=JSON.stringify(g),b=JSON.stringify(e);
  if(a!==b){fail++;console.log('  FALHOU '+m+'\n    esperado '+b+'\n    obtido   '+a);}else console.log('  ok  '+m+' = '+a);};
const lin=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);};
const L=r=>0.2126*lin(r[0])+0.7152*lin(r[1])+0.0722*lin(r[2]);
const ratio=(a,b)=>{const x=L(a),y=L(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);};
const over=(fg,bg)=>fg.map((c,i)=>c*fg[3]+bg[i]*(1-fg[3]));   // alfa embutido
const acima=(v,min)=>Math.round(v*100)/100>=min;

/* aceita #RRGGBB e rgba(r,g,b,a); devolve [r,g,b,alfa] */
function cor(txt){
  const t = String(txt).trim();
  if (t[0] === '#') return [1,3,5].map(i=>parseInt(t.substr(i,2),16)).concat(1);
  const m = t.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(',').map(Number);
  return [p[0],p[1],p[2], p.length>3 ? p[3] : 1];
}
/* separa o par de light-dark(claro, escuro) respeitando os parênteses de
   dentro, que é onde moram os rgba */
function par(valor){
  const m = String(valor).match(/light-dark\((.*)\)\s*$/);
  if (!m) return [valor, valor];
  let d=0, corte=-1, s=m[1];
  for (let i=0;i<s.length;i++){
    if (s[i]==='(') d++;
    else if (s[i]===')') d--;
    else if (s[i]===',' && d===0){ corte=i; break; }
  }
  return corte<0 ? [s,s] : [s.slice(0,corte), s.slice(corte+1)];
}
/* último valor declarado de um token dentro de um bloco — é o que o
   navegador usa, e é onde mora o light-dark() */
function token(bloco, nome){
  const re = new RegExp('--'+nome+'\\s*:([^;}]+)', 'g');
  let m, ult=null;
  while ((m = re.exec(bloco))) ult = m[1];
  return ult && ult.trim();
}
const blocoRaiz = css.match(/:root\{[\s\S]*?\n\}/)[0];
const temaDe = nome => par(token(blocoRaiz,nome)).map(cor);
const bracoDe = id => {
  const b = css.match(new RegExp('\\.board\\[data-neck="'+id+'"\\]\\{[\\s\\S]*?\\}'));
  return b && (n => cor(token(b[0],n)));
};

const TEMAS = ['claro','escuro'];
const BRACOS = ['jacaranda','ebano','maple','traco'];
const bench = temaDe('bench'), panel = temaDe('panel');
const ink = temaDe('ink'), inkSoft = temaDe('ink-soft');
const ringBench = temaDe('ring-bench');

console.log('\n[X] A paleta se deixa ler, nos dois eixos');
eq(TEMAS.map((t,i)=>!!bench[i]&&!!panel[i]&&!!ink[i]&&!!ringBench[i]),[true,true],
   'os dois temas têm bancada, painel, tinta e anel');
eq(BRACOS.map(b=>{const g=bracoDe(b); return !!g&&!!g('wood-1')&&!!g('wood-2')&&!!g('ring-wood');}),
   [true,true,true,true],'os quatro braços têm madeira e anel próprio');
eq(/\.dot:focus-visible\{[^}]*outline:[^;]*var\(--ring-wood\)/.test(css.replace(/\s+/g,'')),true,
   'a camada de fora do anel é a do braço');
eq(/\.dot:focus-visible::after\{[^}]*border:[^;]*var\(--ring-bench\)/.test(css.replace(/\s+/g,'')),true,
   'e a de dentro é a do tema');
eq(/\.cell:has\(\.dot:focus-visible\)/.test(css), true, 'a casa em foco sobe de camada');

console.log('\n[Y] Anel da madeira: 4 braços x 2 pontas do degradê');
BRACOS.forEach(b=>{
  const g = bracoDe(b);
  const anel = g('ring-wood');
  [['clara','wood-1'],['escura','wood-2']].forEach(([lado,w])=>{
    const bg = g(w);
    const v = ratio(over(anel,bg), bg);
    eq(acima(v,3), true, b+', ponta '+lado+': '+v.toFixed(2)+':1');
  });
});

console.log('\n[YB] Anel da bancada: 2 temas');
TEMAS.forEach((t,i)=>{
  const v = ratio(over(ringBench[i],bench[i]), bench[i]);
  eq(acima(v,3), true, 'tema '+t+': '+v.toFixed(2)+':1');
});

console.log('\n[YC] As oito combinações: a casa em foco aparece nos dois fundos');
BRACOS.forEach(b=>{
  const g = bracoDe(b);
  TEMAS.forEach((t,i)=>{
    /* madeira só enxerga o anel do braço; bancada só enxerga o do tema.
       A outra camada pode sumir naquele fundo — some por cima de algo que
       não é o que você está olhando. */
    const naMadeira = ratio(over(g('ring-wood'),g('wood-2')), g('wood-2'));
    const naBancada = ratio(over(ringBench[i],bench[i]), bench[i]);
    eq(acima(Math.min(naMadeira,naBancada),3), true,
       b+' + '+t+': madeira '+naMadeira.toFixed(1)+':1, bancada '+naBancada.toFixed(1)+':1');
  });
});

console.log('\n[YD] Texto legível nos dois temas (AA pede 4,5:1)');
TEMAS.forEach((t,i)=>{
  eq(acima(ratio(ink[i],panel[i]),4.5), true,
     'tinta sobre cartão, tema '+t+': '+ratio(ink[i],panel[i]).toFixed(2)+':1');
  /* a tinta fraca carrega dica, legenda e subtítulo — texto pequeno de
     verdade, então não vale a régua frouxa de texto grande */
  eq(acima(ratio(inkSoft[i],panel[i]),4.5), true,
     'tinta fraca sobre cartão, tema '+t+': '+ratio(inkSoft[i],panel[i]).toFixed(2)+':1');
  eq(acima(ratio(ink[i],bench[i]),4.5), true,
     'tinta sobre bancada, tema '+t+': '+ratio(ink[i],bench[i]).toFixed(2)+':1');
});

console.log('\n[ZA] O traço aceso do afinador segue a tinta do tema');
/* nenhum acento da paleta chega a 3:1 sobre o painel claro — o azul-petróleo
   dá 2,67:1 — então o traço aceso é --ink, que vira claro no tema escuro
   junto com todo o resto. A cor entra só como reforço do que o texto diz. */
TEMAS.forEach((t,i)=>
  eq(acima(ratio(ink[i],panel[i]),3), true,
     'traço aceso sobre cartão, tema '+t+': '+ratio(ink[i],panel[i]).toFixed(2)+':1'));
eq(/\.arci\.on::before\{background:var\(--ink\)/.test(css.replace(/\s+/g,'')), true,
   'e a regra do arco usa mesmo var(--ink), não um acento');

console.log('\n[Z] O anel antigo, escuro sobre madeira, era de fato invisível');
const jac = bracoDe('jacaranda');
eq(ratio(ink[0],jac('wood-2'))<1.1, true,
   'anel antigo dava '+ratio(ink[0],jac('wood-2')).toFixed(2)+':1 — era isso que você via');
console.log(fail? '\n>>> '+fail+' falha(s)':'\n>>> todos passaram');
process.exit(fail?1:0);
