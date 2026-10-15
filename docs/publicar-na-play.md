# Publicar o braço na Google Play

Roteiro para a sessão que for fazer isto — escrito para quem pega o projeto sem o contexto da conversa em que foi decidido, inclusive o Claude. Estado em **15/10/2026**.

> **Antes de qualquer passo:** as regras da Play mudam. Os números daqui (taxa, testadores, dias, nível de API) são do que se sabia em meados de 2026. Reconfira cada um na Play Console no dia, e corrija este arquivo se algo mudou.

---

## 1. Onde estamos

**Etapa A — app instalável: pronta.** O dono instala pelo Chrome do próprio celular, sem loja. Nela já existe tudo de que a loja também precisa:

| peça | arquivo | conferido por |
|---|---|---|
| manifest (`id`/`start_url`/`scope` relativos) | `manifest.webmanifest` | `tests/pwa.test.js` [PA] |
| ícones any 192/512 e maskable 512 | `icone-*.png`, gerados por `tools/gera-icones.py` | [PB] |
| fonte local (Archivo, OFL junto) | `fonts/` | [PC] |
| service worker: página rede-primeiro, resto cache-primeiro, `VERSAO` carimbada | `sw.js` | [PD] e [PE], que **executa** o sw.js |
| preferências no `localStorage`, validadas na leitura | `index.html`, `lerPrefs`/`salvarPrefs` | `tests/prefs.test.js` |

**Etapa B — Play Store: não começou.** Depende de decisões e ações do dono (seções 3 e 4).

**Contexto que não está no código:**
- Endereço atual: `https://tiagosalviatto.github.io/repo/`
- O dono usa um **Poco X8 Pro** (Android, HyperOS). Não usa mais iPhone — o que é específico de iOS no app (apple-touch-icon, metas `apple-*`) fica, porque não custa nada, mas não é mais prioridade.
- App **gratuito**, sem anúncio, sem conta, sem coleta de dado.
- Custo combinado: US$25 da conta, uma vez. Domínio próprio é opcional (seção 3).

## 2. A rota: TWA pelo PWABuilder

**TWA (Trusted Web Activity)**: o app Android é uma casca que abre o site do Pages em tela cheia, dentro do Chrome. Gerado em [pwabuilder.com](https://www.pwabuilder.com) a partir da URL, sem Android Studio.

Escolhida contra **Capacitor** (HTML empacotado no APK) por um motivo só: **com TWA, atualizar o app continua sendo `git push`.** No Capacitor, toda mudança de interface vira build, upload e revisão da Play — num projeto que muda toda semana, é o caminho errado.

Consequências da TWA que importam:
- O afinador funciona: o microfone é pedido pelo Chrome **para o site**. O APK não declara `RECORD_AUDIO`, então não há declaração de permissão sensível na Play.
- **Ficam gravados no `.aab`**: nome, ícone, cores, URL inicial, domínio. Mudar qualquer um desses exige gerar e subir um `.aab` novo. Conteúdo do site não.
- Se a verificação de domínio (seção 5, passo 2) falhar, o app abre **com barra de endereço** em cima. É o sintoma número um de que algo está errado com o `assetlinks.json`.

## 3. Decisões pendentes do dono

Nenhuma pode ser tomada por quem implementa. Peça antes de começar.

1. **Domínio próprio ou não.** O `assetlinks.json` precisa estar na **raiz da origem**: `https://ORIGEM/.well-known/assetlinks.json`. Em `tiagosalviatto.github.io/repo/`, a raiz é `tiagosalviatto.github.io/`, que pertence a outro repositório — que o dono não tem.
   - **(a) domínio próprio** (~R$40/ano num `.com.br`) — *recomendado*. Resolve a raiz, e o app deixa de depender do nome de usuário do GitHub e do nome do repo (`repo`, hoje). Custo: as preferências de quem já instalou pelo Chrome recomeçam do zero uma vez, porque é outra origem.
   - **(b) criar o repo `tiagosalviatto.github.io`** só para servir `.well-known/`. Grátis, mas amarra dois repos, e renomear este repo um dia quebra o app.
2. **Nome do pacote.** **Permanente**: trocar é publicar outro app, do zero. Convenção: domínio invertido + nome, ASCII — `br.com.DOMINIO.braco`, ou `io.github.tiagosalviatto.braco` na opção (b).
3. **Título na loja** (até 30). Rascunhos conferidos:
   - `braço: acordes e escalas` (24)
   - `braço — acordes no violão` (25)
   - `braço — violão sem mistério` (27)
4. **E-mail de contato.** Fica **público** na página da loja. Sugira um e-mail dedicado, não o pessoal nem o do trabalho.
5. **A arte do violão.** `tools/violao-fonte.png` veio de uma imagem que o dono mandou, **de origem e licença desconhecidas**. Para uso pessoal tanto faz; numa loja pública é risco de violação de propriedade intelectual. Antes de publicar: confirmar a licença, ou redesenhar (uma silhueta simples, desenhada do zero, resolve — o `gera-icones.py` só precisa de branco sobre preto).

## 4. Do lado do dono, em ordem

As esperas estão marcadas — é por elas que o cronograma anda.

- [ ] **Criar a conta de desenvolvedor** em play.google.com/console: US$25 uma vez, cobrados em dólar (entra IOF), conta **pessoal**, documento com foto. ⏳ Verificação de horas a dias.
- [ ] **Verificar o aparelho**: o app Play Console num Android físico. O Poco serve.
- [ ] **Registrar o domínio**, se for a opção (a), e passar o nome.
- [ ] **Recrutar 12 testadores com Android** (contas Google distintas). Cada um entra pelo link do teste e **continua inscrito por 14 dias seguidos**. ⏳ É o maior atraso: comece a juntar nomes antes de tudo. Combine um canal de retorno (grupo, formulário) — o pedido de produção pergunta o que os testadores disseram e o que foi corrigido.
- [ ] **Gerar o pacote no PWABuilder** com as opções da seção 5, passo 4. Ele cria a **chave de upload**: guarde o arquivo `.keystore` e as senhas num gerenciador de senhas. Perder é recuperável pelo suporte do Google, mas demorado.
- [ ] **Subir o `.aab` no teste fechado** e passar a **impressão digital SHA-256 da chave de assinatura do Google Play** (Play Console ▸ o app ▸ Integridade do app ▸ Assinatura do app). *Não* é a chave que o PWABuilder criou.
- [ ] **Preencher "Conteúdo do app"** com as respostas da seção 7.
- [ ] **Montar a ficha da loja** com os textos e imagens da seção 6.
- [ ] Depois dos 14 dias: **pedir acesso à produção**. ⏳ Revisão do pedido, depois revisão da primeira versão.

## 5. Do lado de quem implementa

Quando o dono disser "vamos para a Play", nesta ordem:

**1. Origem.**
- Opção (a): arquivo `CNAME` na raiz com o domínio; dono configura o DNS e marca *Enforce HTTPS* em Settings ▸ Pages. Atualizar a URL no README. O manifest não muda — `id`, `start_url` e `scope` já são relativos de propósito.
- Opção (b): o dono cria o repo; os passos 2 e 3 vão **para lá**, não para este.

**2. `.nojekyll` + `.well-known/assetlinks.json`** na raiz da origem.

O Pages roda Jekyll, e o Jekyll ignora em silêncio toda pasta que começa com ponto. Sem `.nojekyll`, a `.well-known` simplesmente não é publicada.

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "PACOTE",
    "sha256_cert_fingerprints": [
      "SHA-256 DA CHAVE DE ASSINATURA DO GOOGLE PLAY",
      "SHA-256 DA CHAVE DE UPLOAD"
    ]
  }
}]
```

As **duas** impressões digitais: a do Google Play vale para quem instala pela loja; a de upload vale para um `.apk` instalado direto no Poco para teste. Só com a de upload, o app da loja abre com barra de endereço.

Conferir depois do deploy, pela API do Google — tem de devolver a declaração:
```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://ORIGEM&relation=delegate_permission/common.handle_all_urls
```

**3. Página de privacidade** — `privacidade.html`, em pt-BR, linkada no app (no glossário ou no rodapé) e com a URL entregue ao dono. Conteúdo, que tem de ser verdade:
- nenhum dado pessoal é coletado, vendido ou compartilhado;
- preferências ficam guardadas **só no aparelho** (`localStorage`);
- o áudio do microfone é processado **no aparelho**, em tempo real, e nunca sai dele nem é gravado;
- sem anúncio, sem analytics, sem conta;
- a hospedagem (GitHub Pages) registra endereço IP de quem acessa, sob a política de privacidade do GitHub — linkar;
- e-mail de contato (decisão 4).

**4. Opções do PWABuilder** (o dono clica, mas passe a lista pronta):
- Package ID: o da decisão 2.
- App name: o título; Launcher name: `braço`.
- App version `1.0.0`, version code `1`. Só sobem quando o `.aab` muda (nome, ícone, cores, domínio) — conteúdo do site não conta.
- Host / start URL: da origem decidida.
- Display: standalone. Cores e ícones: os do manifest (ele lê sozinho).
- Notification delegation **desligado**, location delegation **desligado**, Play Billing **desligado** — cada um acrescenta permissão ou formulário sem uso.
- Fallback: Custom Tabs.
- Signing key: *criar nova* (vira a chave de upload).

**5. Imagens da loja.**
- Ícone 512×512: a Play pede **PNG de 32 bits**. O `icone-512.png` é RGB de 24 bits — gerar uma variante RGBA (alfa 255 em tudo) no `gera-icones.py` em vez de converter na mão.
- Gráfico de destaque 1024×500, PNG de 24 bits ou JPEG, **sem** transparência.
- Screenshots de celular: 2 a 8, proporção 9:16, lados entre 320 e 3840 px. **Não** usar o painel de navegador do Claude Code para isso — ele captura em resolução baixa. Usar Chromium headless (Puppeteer) num viewport de 412×732 com `deviceScaleFactor` 2,625, que dá 1081×1921; ajustar para 1080×1920. Telas sugeridas: braço com um acorde aceso; campo harmônico em tétrades; o afinador marcando uma corda; tema escuro com maple; a mesa de montagem reconhecendo um acorde.

**6. Testes novos**, no espírito do resto do repo:
- `assetlinks.json` é JSON válido, o pacote bate com uma constante única, cada impressão digital tem o formato `AA:BB:...` com 32 pares;
- `.nojekyll` existe;
- `privacidade.html` existe, está linkada a partir do `index.html` e menciona microfone e `localStorage`;
- com domínio: `CNAME` existe e tem uma linha só.

**7. Verificação final, no Poco, com o build do teste fechado:**
- abre **sem barra de endereço** (com barra = `assetlinks` ou impressão digital errada);
- modo avião: abre e funciona;
- afinador: pede o microfone, lê ~82 Hz na 6ª corda solta;
- botão voltar do Android fecha o app, não navega para uma página em branco;
- `npm test` verde.

## 6. Ficha da loja — rascunhos

Contagens conferidas com `len()`, não na mão.

**Descrição curta** (até 80):
- `Onde cada nota mora no braço, a forma de cada acorde e um afinador de bolso.` (76)
- `Veja cada nota no braço, a forma de cada acorde e afine o violão. Sem anúncio.` (78)
- `Notas, acordes, campo harmônico e afinador para violão. Sem anúncio, offline.` (77)

**Descrição longa** (até 4000):

> O braço mostra o violão do jeito que ele é: seis cordas, as casas, e onde cada nota mora.
>
> • Toque numa nota e veja todas as iguais acenderem no braço inteiro.
> • Escolha um acorde e veja a forma que se toca — não um arpejo espalhado. As outras posições ficam a um toque, nomeadas pela corda da fundamental.
> • Monte um acorde casa por casa e o app diz o que você montou, inclusive inversões.
> • Campo harmônico de qualquer tom, maior ou menor, em tríades ou tétrades, com numeral romano.
> • Afinador de corda solta, com tom de referência para afinar de ouvido.
> • Afinação padrão, Drop D, DADGAD, Open G e meio tom abaixo.
> • Tema claro ou escuro e quatro estilos de braço.
>
> Funciona sem internet depois da primeira abertura. Sem anúncio, sem cadastro, e nada do que você faz sai do seu celular — o microfone do afinador é processado no próprio aparelho.

**Categoria:** Música e áudio.

**Política da Play sobre a ficha:** nada de "melhor", "nº 1", emoji ou lista de palavras-chave no título ou na descrição — é motivo de reprovação.

## 7. "Conteúdo do app" — respostas preparadas

| formulário | resposta |
|---|---|
| Política de privacidade | URL da `privacidade.html` |
| Anúncios | não contém |
| Acesso ao app | todas as funções sem restrição, sem login |
| Classificação de conteúdo | categoria utilitário/outros; não a tudo (violência, sexo, apostas, interação entre usuários, localização, compras). Esperado: **Livre** |
| Público-alvo | **13 anos ou mais**. Incluir menores de 13 ativa a política de Famílias, que tem exigências próprias — só se for a intenção do dono |
| Segurança dos dados | **não coleta nem compartilha** dado. Microfone processado no aparelho, preferências no aparelho. Releia as definições do formulário no dia: elas tratam "coleta" como o que sai do aparelho |
| Apps de notícias, governo, finanças, saúde | não |

## 8. Armadilhas já conhecidas

1. `assetlinks.json` precisa estar na raiz da **origem**, não do app. `github.io/repo/` não é raiz.
2. O Jekyll do Pages engole `.well-known` sem `.nojekyll`.
3. A impressão digital certa é a da **chave de assinatura do Google Play**, não a de upload. Ponha as duas.
4. Nome do pacote é para sempre. Gratuito é para sempre (dá para vender dentro do app, nunca o download).
5. Nome, ícone, cores e domínio estão dentro do `.aab`: mudar exige `.aab` novo e, para domínio, `assetlinks.json` na origem nova.
6. Trocar fonte, ícone ou manifest exige trocar a `VERSAO` do `sw.js` — o `pwa.test.js` falha e diz o valor. Sem isso, os celulares ficam com o arquivo velho para sempre.
7. Mudar de origem zera as preferências de quem já usa.
8. Licença da arte do violão (decisão 5).
9. Testadores: precisam **instalar** pela loja, não só aceitar o convite; e sair do teste antes dos 14 dias pode zerar a contagem — confirmar a regra no dia.
10. O e-mail de contato é público.

## 9. Caminho crítico

```
semana 1     conta, verificação, domínio, 12 nomes │ implementação: passos 1, 3, 5, 6
semana 1–2   PWABuilder → teste fechado → SHA-256  │ implementação: passo 2, verificação do passo 7
semanas 2–4  14 dias de teste fechado
semanas 4–5  pedido de produção → revisão → no ar
```

O código cabe na primeira semana. Quem define a data é o relógio do teste fechado.
