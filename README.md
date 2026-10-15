# braço

Explorador de braço de violão. O app inteiro é o `index.html`: sem dependência de runtime, sem build. Ao redor dele mora só o que um navegador precisa para instalá-lo como app — manifest, service worker, ícones e a fonte.

- Clique numa nota e todas as iguais acendem no braço inteiro.
- Escolha um acorde e veja **a forma que se toca**, não o arpejo espalhado. As outras formas ficam em botões, nomeadas pela corda que carrega a fundamental (CAGED).
- Monte um acorde clicando casa por casa e o topo **reconhece** o que você montou, inclusive inversões e leituras alternativas.
- Campo harmônico do tom, em tríades ou tétrades, com numeral romano.
- **Acordes do caderno**: clicar um grau mostra a digitação de duas folhas de campo harmônico, e não a que o CAGED deduz. Nas tétrades a diferença é grande — são vozes de quatro notas com cordas abafadas no meio. As formas geradas continuam nos botões ao lado.
- Som de corda pinçada por Karplus-Strong, sem nenhum arquivo de áudio.
- **Tema claro, escuro ou o do sistema**, e **quatro estilos de braço** — jacarandá, ébano, maple e traço. São dois eixos independentes: maple clara com tema escuro é combinação legítima, e as oito combinações têm o contraste do anel de foco provado em teste.
- **Afinador** de corda solta: escolha a corda, toque ela e o arco mostra quantos cents falta. Os alvos saem da afinação escolhida, então Drop D e DADGAD valem igual. Sem microfone liberado, o botão de tom de referência toca a corda para você afinar de ouvido.
- Os textos de instrução ficam atrás do botão **documentação**, no topo, e o app **abre com eles apagados** — quem voltou já sabe usar e quer a tela para o braço. O botão é aceso ou apagado, sem trocar de nome.
- O braço **abre com 9 casas**, que é o que cabe numa tela de celular sem rolagem lateral. Em 9 casas nem toda forma cabe: o C7, por exemplo, mostra três das cinco. Esticar para 12, 15 ou 22 no cartão Instrumento devolve as que faltavam.
- **Cada seção recolhe pelo próprio cabeçalho**, que é o que torna o app usável de celular: dá para deixar só o braço e o campo harmônico abertos. No celular o afinador chega recolhido, porque é outra tarefa.
- **Instala como app** no Android e **abre sem rede** depois da primeira vez.
- **Lembra como você ajustou** — tema, estilo, casas, afinação, grafia, rótulo, som, documentação, orientação, tríade ou tétrade, e quais cartões estão abertos. O que você está olhando (tom, acorde, montagem à mão) não volta: abrir o app no acorde de ontem parece bug.

## Rodar

Abrir `index.html` no navegador basta para usar. Três ressalvas:

- **Visualizador de arquivos não executa JavaScript** — o app de arquivos do celular, a pré-visualização de anexo. O braço aparece vazio e os dropdowns em branco; o arquivo detecta isso e explica na tela.
- Para servir na rede local: `npm run serve` e abrir `http://IP-DA-MÁQUINA:8000` no celular.
- **Afinador e modo offline exigem contexto seguro**, e isso significa HTTPS ou `localhost`. Abrir do disco não serve, e servir na rede local por IP também não, porque `http://192.168.x.x` não conta como contexto seguro. No endereço do Pages os dois funcionam. Sem eles o resto do app funciona igual; o afinador avisa na tela e o tom de referência continua valendo.

### Instalar no Android

1. Abrir `https://tiagosalviatto.github.io/repo/` **no Chrome** — não no navegador do fabricante. Quem gera o app instalado é o Chrome; outros navegadores criam um atalho simples, com barra de endereço.
2. Menu **⋮ ▸ Instalar app** (às vezes aparece como *Adicionar à tela inicial ▸ Instalar*, ou num aviso na parte de baixo da tela).
3. O ícone vai para a gaveta de apps. Ele abre em tela cheia, aparece em *Configurações ▸ Apps* como qualquer outro, e funciona sem rede depois da primeira abertura.

Atualizações chegam sozinhas: cada abertura com rede busca a página nova, e a próxima abertura já vem com ela. Não há nada para reinstalar.

No HyperOS/MIUI (Xiaomi, Poco, Redmi), se *Instalar app* parecer não fazer nada: *Configurações ▸ Apps ▸ Chrome ▸ Outras permissões ▸ Atalhos na tela inicial*.

## Publicar no GitHub Pages

1. `git init && git add . && git commit -m "braço"`
2. Criar o repositório e dar push. **No plano Free do GitHub, o Pages só funciona em repositório público** — repo privado exige Pro ou superior, e mesmo assim o site publicado continua público.
3. Settings ▸ Pages ▸ Source: *Deploy from a branch*, branch `main`, pasta `/ (root)`.
4. O arquivo se chama `index.html`, então a URL fica limpa: `https://USUÁRIO.github.io/REPO/`
5. No celular: Android, ver *Instalar no Android* acima; iPhone, Safari ▸ Compartilhar ▸ **Adicionar à Tela de Início**.

Para publicar na Google Play, o roteiro inteiro — o que já está pronto, o que falta, as armadilhas e a ordem — está em [`docs/publicar-na-play.md`](docs/publicar-na-play.md).

### Ícones

Cada sistema tira o ícone de um lugar e corta de um jeito:

| arquivo | quem usa | como corta |
|---|---|---|
| `icone-180.png` | iOS, via `<link rel="apple-touch-icon">` | arredonda o canto sozinho |
| `icone-192.png`, `icone-512.png` | Chrome e o manifest, "any" | idem |
| `icone-maskable-512.png` | launcher do Android, "maskable" | círculo, gota ou quadrado, a gosto do launcher |

Regras que não dá para descobrir testando no desktop:

- **PNG, nunca SVG.** O iOS ignora vetor aqui.
- **Opaco.** Transparência vira preto no iOS. A arte já vem com fundo: o `--wood-2` da paleta, com o violão na cor dos marcadores.
- **Sem arredondar o canto.** A máscara é do sistema; canto redondo na arte vira canto duplo.
- **No maskable, só o círculo central de 80% é garantido.** O violão é diagonal, então o que limita não é a caixa da arte, é o pixel mais distante do centro.

Todos saem de `tools/gera-icones.py`, a partir de `tools/violao-fonte.png`. O script desenha 6× maior e reduz por último, que é o que evita serrilhar as cordas, e se recusa a gravar o maskable se algum pixel cair fora do círculo seguro.

**O iOS guarda o ícone na hora em que você adiciona o atalho e nunca mais olha.** Trocar a imagem no site não muda um atalho que já existe: é preciso apagar e adicionar de novo. No Android, o app instalado atualiza o ícone sozinho, mas pode levar dias.

### Offline

O `sw.js` tem duas regras:

- **A página vai para a rede primeiro.** É ela que muda a cada push. Servir a página do cache primeiro congelaria cada aparelho na versão do dia da instalação, sem o usuário ter como perceber. Se a rede não responder em 3 segundos, serve a cópia guardada, e a resposta da rede, quando chegar, atualiza a cópia.
- **Fontes, ícones e manifest vêm do cache primeiro.** Eles só mudam junto com a `VERSAO` do `sw.js` — que não é um número para lembrar de subir: é um carimbo do conteúdo desses arquivos. Mudou um ícone ou a fonte, o `npm test` falha e diz o valor novo para colar.

## Testes

```
npm install
npm test
```

516 asserções em doze suítes:

| suíte | o que cobre |
|---|---|
| `theory.test.js` | grafia por grau (F maior tem B♭, não A♯), rótulos de intervalo, campo harmônico das quatro espécies de tom |
| `shapes.test.js` | as 1077 formas resolvidas não têm nota errada; as 20 formas clássicas saem primeiro; cobertura de 16 qualidades × 12 tônicas; filtro de alcance de mão |
| `caderno.test.js` | as 126 digitações das folhas conferidas contra o motor do próprio app: cada uma só toca notas do acorde que o campo harmônico produz naquele grau, com fundamental presente e mão em quatro casas; e os cinco casos em que o caderno não vale |
| `recognize.test.js` | dicionário reverso de 46 estruturas; inversões; ida e volta contra o catálogo de formas |
| `build.test.js` | regra de uma casa por corda; toda forma do catálogo, montada a mão, se reconhece |
| `contrast.test.js` | a matriz de 4 braços × 2 temas: o anel de foco em cada fundo, mínimo 3:1 da WCAG, e o texto em 4,5:1 nos dois temas |
| `tuner.test.js` | o afinador em sinal sintético: seis cordas em duas taxas de amostragem, harmônicos sem fundamental, decaimento de nylon, ruído de sala, a mediana e o arco |
| `app.test.js` | o app rodando em jsdom: 160 asserções sobre cliques, teclas e o que aparece na tela, incluindo o acorde do caderno, o recolher por seção e a regressão do cache de formas |
| `prefs.test.js` | o que o app lembra de uma abertura para a outra, o que não lembra de propósito, e o que recusa: JSON cortado, valores inválidos, navegador que nega armazenamento |
| `pwa.test.js` | manifest, ícones e fonte local conferidos contra os arquivos, e o `sw.js` **rodando** num mundo de mentira: instalar, ficar offline, rede lenta, push novo chegando, carimbo da versão |
| `mobile.test.js` | aritmética de largura por aparelho, alvos de toque, metas do iOS, o ícone do atalho (existe, é PNG, 180×180 e opaco), ausência de `vh`, altura poupada ao recolher os textos e as seções |
| `noscript.test.js` | o mesmo arquivo com script ligado e desligado |

### Por que os testes leem o HTML

Não há build: os motores de teoria, de formas e de reconhecimento vivem dentro do `index.html`, entre marcadores `/*==nome-start==*/`. O `tests/_harness.js` recorta esses blocos e os avalia como módulo. Assim os testes exercitam **exatamente** o código que roda no navegador, em vez de uma cópia que pode divergir dele. O `sw.js` segue a mesma ideia: o `pwa.test.js` executa o arquivo real, não uma imitação dele.

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
- **A primeira abertura precisa de rede.** O modo offline começa depois que o service worker guardou os arquivos, e ele só se instala com o app aberto online uma vez.
- **As preferências moram no endereço.** Se o app um dia mudar de `github.io` para um domínio próprio, o navegador trata como outro app: reinstala, e os ajustes começam do zero uma vez.
