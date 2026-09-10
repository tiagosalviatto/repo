# braço

Explorador de braço de violão. Um arquivo, sem dependência de runtime, sem build.

- Clique numa nota e todas as iguais acendem no braço inteiro.
- Escolha um acorde e veja **a forma que se toca**, não o arpejo espalhado. As outras formas ficam em botões, nomeadas pela corda que carrega a fundamental (CAGED).
- Monte um acorde clicando casa por casa e o topo **reconhece** o que você montou, inclusive inversões e leituras alternativas.
- Campo harmônico do tom, em tríades ou tétrades, com numeral romano.
- Som de corda pinçada por Karplus-Strong, sem nenhum arquivo de áudio.
- Os textos de instrução recolhem num botão só (**explicações**, no topo), para quem já sabe como o app funciona e quer a tela inteira para o braço.

## Rodar

Abrir `index.html` no navegador basta. Duas ressalvas:

- **A pré-visualização do app Arquivos do iPhone não executa JavaScript.** O braço aparece vazio e os dropdowns em branco. O arquivo detecta isso e explica na tela.
- Para servir na rede local: `npm run serve` e abrir `http://IP-DA-MÁQUINA:8000` no celular.

## Publicar no GitHub Pages

1. `git init && git add . && git commit -m "braço"`
2. Criar o repositório e dar push. **No plano Free do GitHub, o Pages só funciona em repositório público** — repo privado exige Pro ou superior, e mesmo assim o site publicado continua público.
3. Settings ▸ Pages ▸ Source: *Deploy from a branch*, branch `main`, pasta `/ (root)`.
4. O arquivo se chama `index.html`, então a URL fica limpa: `https://USUÁRIO.github.io/REPO/`
5. No iPhone: abrir no Safari ▸ Compartilhar ▸ **Adicionar à Tela de Início**. Os metatags de web-app fazem ele abrir em tela cheia, sem barra de navegador.

Depois de cada push, o Safari pode servir a versão em cache. Recarregar com a página aberta resolve; se estiver salvo na tela de início, apagar o ícone e adicionar de novo.

## Testes

```
npm install
npm test
```

295 asserções em oito suítes:

| suíte | o que cobre |
|---|---|
| `theory.test.js` | grafia por grau (F maior tem B♭, não A♯), rótulos de intervalo, campo harmônico das quatro espécies de tom |
| `shapes.test.js` | as 1077 formas resolvidas não têm nota errada; as 20 formas clássicas saem primeiro; cobertura de 16 qualidades × 12 tônicas; filtro de alcance de mão |
| `recognize.test.js` | dicionário reverso de 46 estruturas; inversões; ida e volta contra o catálogo de formas |
| `build.test.js` | regra de uma casa por corda; toda forma do catálogo, montada a mão, se reconhece |
| `contrast.test.js` | contraste do anel de foco contra madeira e bancada, mínimo 3:1 da WCAG |
| `app.test.js` | o app rodando em jsdom: 106 asserções sobre cliques, teclas e o que aparece na tela |
| `mobile.test.js` | aritmética de largura por aparelho, alvos de toque, metas do iOS, ausência de `vh`, altura poupada ao recolher os textos |
| `noscript.test.js` | o mesmo arquivo com script ligado e desligado |

### Por que os testes leem o HTML

Não há build: os motores de teoria, de formas e de reconhecimento vivem dentro do `index.html`, entre marcadores `/*==nome-start==*/`. O `tests/_harness.js` recorta esses blocos e os avalia como módulo. Assim os testes exercitam **exatamente** o código que roda no navegador, em vez de uma cópia que pode divergir dele.

O preço é que os marcadores fazem parte do contrato: renomear ou remover um quebra o harness, com mensagem explícita.

## Estrutura interna

Notas não são strings. Todo conjunto — escala, acorde, forma — é uma lista de pares `[grau, semitons]`: o **grau** escolhe a letra (grafia) e o **semitom** escolhe a casa (som). O acidente é a diferença entre os dois. É isso que faz `F` maior sair com `B♭` e `C°7` sair com `B♭♭`, o que uma tabela cromática não conseguiria.

As formas são deslocamentos relativos à casa da fundamental, não acordes fixos: uma entrada serve as doze tônicas. Toda forma é validada em tempo de execução contra a definição do acorde — nota que soa tem de pertencer ao acorde, fundamental presente, terça e sétima presentes, quinta dispensável, e vão de dedo de no máximo quatro casas.

O reconhecimento indexa por assinatura de classes de altura, derivada dos próprios pares. Chave e estrutura não podem discordar, porque uma é calculada da outra.

## Limitações conhecidas

- Sem numeração de dedo nas formas. É o único dado aqui que não tem teste automático possível.
- O Safari do iOS silencia Web Audio quando o interruptor lateral está no mudo.
- Nenhuma persistência: recarregar zera o estado.
