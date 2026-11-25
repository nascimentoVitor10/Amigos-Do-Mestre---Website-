# Amigos do Mestre Álvaro — v2 (administrável)

Website institucional responsivo com **Pages CMS + GitHub**, publicação no **Netlify**, formulário **Netlify Forms**, agenda **Google Calendar** (leitura pública via função serverless) e animação 3D CSS sem dependências.

## Como funciona (sem necessidade de banco de dados)

- **Conteúdo da página**: `site/data/site.json`, com a capa, quem somos, atuação, projetos, fotos e redes sociais.
- **Eventos manuais (alternativa)**: `site/data/events.json`.
- **Painel editorial**: arquivo `.pages.yml` configura as telas do [Pages CMS](https://app.pagescms.org/); administradores autenticados com GitHub atualizam os arquivos do repositório.
- **Site**: Netlify conecta-se ao GitHub e publica a pasta `site/` automaticamente quando o conteúdo muda.
- **Google Calendar**: `netlify/functions/calendar.mjs` consulta eventos públicos com credenciais guardadas no ambiente da Netlify.
- **Mensagens**: Netlify Forms armazena as submissões e envia alertas após você ativar notificações por e-mail.

As alterações não são instantâneas: dependem do commit no GitHub e do término da nova implantação na Netlify.

## 1. Publicar o projeto no GitHub

1. Crie um repositório GitHub privado ou público sob a conta da associação (por exemplo, `amigos-do-mestre-site`). Se for privado, confirme que o CMS poderá receber permissão ao repositório e que o plano Netlify permite vinculá-lo.
2. Envie **todo o conteúdo desta pasta**, mantendo a estrutura (inclusive `.pages.yml`, `netlify.toml`, `site/` e `netlify/`). Não envie somente o diretório `site/` ao GitHub.
3. Conceda permissão de edição apenas a responsáveis indicados. Ative autenticação de dois fatores nas contas.

## 2. Ativar o painel para a associação

1. Entre em **https://app.pagescms.org/** e acesse com o GitHub autorizado.
2. Instale/autorize o GitHub App do Pages CMS **somente** para o repositório escolhido.
3. Abra o repositório no painel. O Pages CMS reconhecerá `.pages.yml` automaticamente.
4. Clique em **Textos e imagens do site** para editar capa, apresentação, pilares, projetos e fotografias.
5. Clique em **Eventos cadastrados manualmente** para cadastrar datas sem integração Google.
6. Salve as alterações. O CMS fará commits no GitHub, acionando a nova implantação do Netlify.

**Segurança:** Pages CMS é uma ferramenta externa hospedada; não existe um formulário de login caseiro dentro do website. Controle os editores pela conta/organização GitHub. Se a associação preferir fluxo de aprovação, configure um processo por pull request em vez de dar escrita direta para qualquer voluntário.

## 3. Hospedar no Netlify

1. Entre em **https://app.netlify.com/**, adicione novo site e escolha **Import from Git**.
2. Conecte o GitHub e selecione o repositório da associação.
3. Em configuração de build, deixe o projeto na **raiz do repositório**, sem comando de build; `netlify.toml` já define `publish = "site"` e `functions = "netlify/functions"`.
4. Faça a implantação. A página estática funcionará sem credenciais; o calendário estará vazio até que existam eventos manuais ou Google Calendar configurado.
5. Se quiser, conecte um domínio próprio em **Domain management**. O domínio é um custo opcional e independente da hospedagem.

**Não use deploy manual por ZIP se quiser que as atualizações do CMS sejam automáticas.** Conecte o repositório GitHub ao Netlify.

## 4. Conectar a agenda do Google (sincronização automática)

1. A associação cria ou seleciona uma **agenda separada, destinada exclusivamente a eventos públicos** no [Google Calendar](https://calendar.google.com/). **Não use a agenda pessoal dos voluntários.**
2. Em **Configurações → Configurações das minhas agendas → [Agenda pública] → Permissões de acesso para eventos**, habilite a visibilidade pública adequada para divulgar detalhes de eventos. Confira que as informações dessa agenda podem ser vistas por qualquer pessoa.
3. Em **Integrar agenda**, copie o **ID da agenda** (pode parecer um endereço de e-mail ou terminar em `@group.calendar.google.com`). Não é necessário compartilhar senha nem chave privada.
4. Em [Google Cloud Console](https://console.cloud.google.com/), crie um projeto (se necessário), ative a **Google Calendar API** e crie uma **API key** em **APIs e serviços → Credenciais**.
5. Nas restrições da chave, limite seu uso à **Google Calendar API**; avalie cotas e alertas de consumo. Como a consulta ocorre no lado servidor com execução dinâmica, uma restrição por referenciador HTTP do navegador não seria apropriada; proteja a chave como segredo de ambiente.
6. No site do Netlify, em **Project configuration → Environment variables**, crie:
   - `GOOGLE_CALENDAR_ID`: ID copiado no passo 3;
   - `GOOGLE_CALENDAR_API_KEY`: chave criada no passo 4.
   Selecione o escopo **Functions** (ou **All scopes**) e o ambiente de produção; essas variáveis **não** devem ser colocadas no `netlify.toml`, `.pages.yml` ou JavaScript público.
7. Faça novo deploy para que a função utilize as variáveis atualizadas.
8. Teste `https://SEU-SITE.netlify.app/.netlify/functions/calendar?month=2026-12` (ajuste para o mês de algum evento confirmado). O retorno deverá incluir `"configured":true` e `"source":"google"`.
9. Crie/edite um evento público na agenda do Google e atualize a página do site após alguns minutos (o endpoint pode manter cache por até cinco minutos).

**Regra de prioridade:** quando a integração Google estiver ativa, o calendário visual mostra a agenda pública do Google. Caso não esteja configurada ou esteja indisponível, mostra eventos manuais cadastrados pelo CMS; uma falha de sincronização é indicada na página. Não duplicamos automaticamente eventos nas duas fontes.

**Privacidade:** a integração é intencionalmente de leitura para uma agenda pública, sem OAuth. Para consultar uma agenda privada, seria necessário um fluxo de autorização diferente e uma análise de acesso; não insira dados pessoais na agenda pública.

## 5. Receber mensagens do site por e-mail

1. Depois do primeiro deploy, abra o site no painel Netlify, vá a **Forms** e clique **Enable form detection** se a opção não estiver ativa. Faça novo deploy para detectar o formulário HTML `contato`.
2. Verifique se o formulário `contato` apareceu. Ele utiliza `data-netlify="true"`, `form-name`, envio `application/x-www-form-urlencoded`, campo invisível contra bots e consentimento obrigatório.
3. Em **Forms → Submission notifications → Add notification**, escolha **Email notification**, o formulário `contato` e o endereço de e-mail institucional no qual deseja receber avisos.
4. Envie uma mensagem real de teste pelo endereço público `https://...netlify.app`, confirme a submissão no painel **Forms**, e confira a entrega do aviso por e-mail (inclusive pasta de spam).
5. As respostas aos remetentes são feitas pela própria associação, a partir do e-mail informado na mensagem. **Este projeto não envia resposta automática** ao usuário.
6. Atribua acesso de leitura às submissões somente às pessoas responsáveis pelo atendimento. Verifique no painel os limites e custos do seu plano.

As notificações de e-mail dependem de configuração manual na conta Netlify. O código não pode definir o destinatário por conta própria e não deve expor endereços privados.

## 6. Testar localmente

Com Node 18+ e [Netlify CLI](https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/) instalado:

```bash
npx netlify dev
```

Abre o site e executa as funções da Netlify. Para testar só o HTML, sem backend (galeria, conteúdo e eventos manuais):

```bash
cd site
python -m http.server 8000
# acessar http://localhost:8000
```

O envio de formulário é intencionalmente desabilitado em pré-visualização local, para não mostrar sucesso falso.

## 7. Atualização das fotografias e projetos

No Pages CMS, selecione uma imagem em **Capa**, **Projetos** ou **Galeria**. O arquivo será adicionado à pasta `site/assets/` e a referência será salva no JSON. Use arquivos `.webp` sempre que possível, comprima fotos grandes e escreva texto alternativo para acessibilidade. A associação é responsável por confirmar autorização de uso de imagens das pessoas retratadas, especialmente crianças.

## 8. Custos, manutenção e responsabilidade

- O site não possui servidor permanente ou banco de dados próprio. GitHub, Pages CMS e Netlify são serviços externos; planos gratuitos e limites podem mudar.
- As consultas de agenda usam uma função serverless e a Google Calendar API, sujeitas a cotas e eventuais cobranças conforme consumo/plano.
- Verifique periodicamente o consumo dos serviços e mantenha uma cópia do repositório.
- O arquivo `site/privacidade.html` é um **texto-base**, que precisa ser validado/completado pela associação (responsáveis, prazos de retenção, canal adequado para titulares) antes do lançamento oficial.
- Este projeto não fornece painel unificado para mensagens: são consultadas no Netlify Forms, enquanto o conteúdo é administrado no Pages CMS e os eventos no Google Calendar (ou, alternativamente, no Pages CMS).

## Arquivos principais

```text
.pages.yml                        # painel editorial do Pages CMS
netlify.toml                      # configurações de publicação
netlify/functions/calendar.mjs    # consulta segura à agenda pública
site/index.html                   # página institucional
site/styles.css                   # identidade visual, mobile e montanha 3D CSS
site/script.js                    # interações, conteúdo, agenda, formulário
site/data/site.json               # dados administráveis do site
site/data/events.json             # eventos administráveis sem Google
site/privacidade.html             # texto-base de privacidade
site/assets/                     # fotografias e marca
```
