/* Ponte entre os testes e o arquivo único.
   O app não tem build: os motores vivem dentro do index.html, delimitados
   por marcadores. O harness recorta esses blocos e os avalia como módulo,
   para que os testes exercitem exatamente o código que roda no navegador —
   não uma cópia que pode divergir. */
const fs = require('fs');
const path = require('path');

const HTML_PATH = process.env.BRACO_HTML || path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(HTML_PATH, 'utf8');

function block(name){
  const a = `/*==${name}-start==*/`, b = `/*==${name}-end==*/`;
  if (!html.includes(a)) throw new Error('bloco não encontrado no HTML: ' + name);
  return html.split(a)[1].split(b)[0];
}

/* tudo que os blocos declaram e que os testes usam */
const EXPORTS = [
  'LETTERS','LETTER_PC','MAJ','SOLF','SHARP_MAP','FLAT_MAP','accStr','pcOf','spell',
  'ivShort','IV_NAMES','ivName','fnOf','SCALES','CHORDS','TUNINGS',
  'TRIAD_NAMES','TETRA_NAMES','harmonicField','degreeFromStack',
  'FORMS','sigOf','FORMS_BY_SIG','chordShapes','valid','searchShapes','rank',
  'RECOGNIZE','REC_BY_SIG','identify',
  'hzOfMidi','centsBetween','tuneTargets','rmsOf','ncorr','detectNear','medianOf',
  'arcIndex','TUNE_SPAN_CENTS','TUNE_OK_CENTS','TUNE_MIN_RMS','TUNE_MIN_CLARITY',
  'TUNE_ATTACK_MS','TUNE_HIST','TUNE_SEGMENTS','TUNE_ARC_SPAN'
];

let cache = null;
function engine(){
  if (cache) return cache;
  const code = ['theory','voicing','recog','tuner'].map(block).join('\n')
             + '\nmodule.exports = {' + EXPORTS.join(',') + '};';
  const m = { exports: {} };
  new Function('module', 'console', code)(m, console);
  cache = m.exports;
  return cache;
}

/* CSS sem comentário: um comentário que fala de vh não é declaração de vh */
function css(strip){
  const raw = html.split('<style>')[1].split('</style>')[0];
  return strip ? raw.replace(/\/\*[\s\S]*?\*\//g, '') : raw;
}

/* jsdom com AudioContext removido — o jsdom não implementa Web Audio */
function dom(opts){
  const { JSDOM } = require('jsdom');
  const errs = [];
  const scripts = !opts || opts.scripts !== false;
  const cfg = { pretendToBeVisual: true };
  if (scripts){
    cfg.runScripts = 'dangerously';
    cfg.beforeParse = w => {
      w.AudioContext = undefined; w.webkitAudioContext = undefined;
      w.addEventListener('error', e => errs.push(String(e.error || e.message)));
    };
  }
  const d = new JSDOM(html, cfg);
  return { window: d.window, document: d.window.document, errors: errs };
}

module.exports = { html, block, engine, css, dom, HTML_PATH };
