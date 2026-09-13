/* Roda as suítes em processos separados: uma que estoure não derruba as outras. */
const { execFileSync } = require('child_process');
const path = require('path');

const SUITES = [
  ['teoria',        'theory.test.js',    'grafia de notas, graus, intervalos, campo harmônico'],
  ['formas',        'shapes.test.js',    'catálogo CAGED, busca, alcance de mão, cobertura'],
  ['caderno',       'caderno.test.js',   'as 126 digitações das folhas, conferidas contra o motor'],
  ['reconhecimento','recognize.test.js', 'dicionário reverso e leitura de inversões'],
  ['montagem',      'build.test.js',     'mesa de montagem: regra de clique e ida-e-volta'],
  ['contraste',     'contrast.test.js',  'visibilidade do anel de foco (WCAG 3:1)'],
  ['afinador',      'tuner.test.js',     'detecção de altura: harmônicos, fundamental fraca, ruído'],
  ['app',           'app.test.js',       'comportamento no DOM: 139 cliques e teclas'],
  ['celular',       'mobile.test.js',    'alvos de toque, metas do iOS, largura por aparelho'],
  ['sem-script',    'noscript.test.js',  'o aviso quando o JavaScript não roda']
];

let ok = 0, bad = 0, total = 0;
for (const [nome, arq, desc] of SUITES){
  let out = '', falhou = false;
  try {
    out = execFileSync(process.execPath, [path.join(__dirname, arq)], { encoding: 'utf8' });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || ''); falhou = true;
  }
  const n = (out.match(/^ {2}ok /gm) || []).length;
  total += n;
  if (falhou){ bad++; console.log(out); console.log(`✗ ${nome} — ${desc}`); }
  else { ok++; console.log(`✓ ${nome.padEnd(15)} ${String(n).padStart(3)} asserções  ${desc}`); }
}
console.log(`\n${total} asserções · ${ok} suíte(s) ok${bad ? ' · ' + bad + ' com falha' : ''}`);
process.exit(bad ? 1 : 0);
