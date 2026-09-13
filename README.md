# braço

Explorador de braço de violão. Um arquivo, sem dependência de runtime, sem build.

- Clique numa nota e todas as iguais acendem no braço inteiro.
- Escolha um acorde e veja **a forma que se toca**, não o arpejo espalhado. As outras formas ficam em botões, nomeadas pela corda que carrega a fundamental (CAGED).
- Monte um acorde clicando casa por casa e o topo **reconhece** o que você montou, inclusive inversões e leituras alternativas.
- Campo harmônico do tom, em tríades ou tétrades, com numeral romano.
- **Acordes do caderno**: clicar um grau mostra a digitação de duas folhas de campo harmônico, e não a que o CAGED deduz. Nas tétrades a diferença é grande — são vozes de quatro notas com cordas abafadas no meio. As formas geradas continuam nos botões ao lado.
- Som de corda pinçada por Karplus-Strong, sem nenhum arquivo de áudio.
- **Afinador** de corda solta: escolha a corda, toque ela e o arco mostra quantos cents falta. Os alvos saem da afinação escolhida, então Drop D e DADGAD valem igual. Sem microfone liberado, o botão de tom de referência toca a corda para você afinar de ouvido.
- Os textos de instrução recolhem num botão só (**explicações**, no topo), para quem já sabe como o app funciona e quer a tela inteira para o braço.
- **Cada seção recolhe pelo próprio cabeçalho**, que é o que torna o app usável de celular: dá para deixar só o braço e o campo harmônico abertos. No celular o afinador já chega recolhido, porque é outra tarefa.

## Rodar

Abrir `index.html` no navegador basta. Duas ressalvas:

- **A pré-visualização do app Arquivos do iPhone não executa JavaScript.** O braço aparece vazio e os dropdowns em branco. O arquivo detecta isso e explica na tela.
- Para servir na rede local: `npm run serve` e abrir `http://IP-DA-MÁQUINA:8000` no celular.
- **O afinador é a exceção ao "abrir o arquivo basta".** Captura de microfone exige contexto seguro, e isso significa HTTPS ou `localhost` — abrir do disco não serve, e servir na rede local por IP também não, porque `http://192.168.x.x` não conta como contexto seguro. No endereço do Pages funciona. O afinador diz isso na tela quando não consegue, e o tom de referência funciona em qualquer um dos casos.

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

412 asserções em dez suítes:

| suíte | o que cobre |
|---|---|
| `theory.test.js` | grafia por grau (F maior tem B♭, não A♯), rótulos de intervalo, campo harmônico das quatro espécies de tom |
| `shapes.test.js` | as 1077 formas resolvidas não têm nota errada; as 20 formas clássicas saem primeiro; cobertura de 16 qualidades × 12 tônicas; filtro de alcance de mão |
| `caderno.test.js` | as 126 digitações das folhas conferidas contra o motor do próprio app: cada uma só toca notas do acorde que o campo harmônico produz naquele grau, com fundamental presente e mão em quatro casas; e os cinco casos em que o caderno não vale |
| `recognize.test.js` | dicionário reverso de 46 estruturas; inversões; ida e volta contra o catálogo de formas |
| `build.test.js` | regra de uma casa por corda; toda forma do catálogo, montada a mão, se reconhece |
| `contrast.test.js` | contraste do anel de foco contra madeira e bancada, mínimo 3:1 da WCAG |
| `tuner.test.js` | o afinador em sinal sintético: seis cordas em duas taxas de amostragem, harmônicos sem fundamental, decaimento de nylon, ruído de sala, a mediana e o arco |
| `app.test.js` | o app rodando em jsdom: 139 asserções sobre cliques, teclas e o que aparece na tela, incluindo o acorde do caderno, o recolher por seção e a regressão do cache de formas |
| `mobile.test.js` | aritmética de largura por aparelho, alvos de toque, metas do iOS, ausência de `vh`, altura poupada ao recolher os textos e as seções |
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
- O afinador depende do microfone do aparelho, e o mi grave é o caso apertado: em 82 Hz a fundamental chega fraca. O detector foi feito para isso — acha o período certo só pelos harmônicos, e há teste para exatamente esse sinal —, mas se o microfone não captar nada em 82 Hz, nenhum algoritmo resolve. O Hz cru fica à vista no mostrador justamente para você conferir isso no seu aparelho.
- A camada de microfone do afinador (permissão, analisador, laço) não tem teste automático: o jsdom não implementa nenhuma das três. O que os testes cobrem é a detecção inteira, que é função pura, e o caminho de falha — sem microfone, o afinador tem de continuar utilizável pelo tom de referência.
- O Safari do iOS silencia Web Audio quando o interruptor lateral está no mudo.
- As folhas do caderno cobrem **nove dos doze tons** (faltam dó♯, fá♯ e lá♭ como tônica), só a **escala maior** e só a **afinação padrão**. Fora disso o app volta a mostrar a forma gerada, sem aviso na tela — o chip *do caderno* some, e essa ausência é a única pista.
- Nenhuma persistência: recarregar zera o estado, inclusive quais seções estavam recolhidas.
