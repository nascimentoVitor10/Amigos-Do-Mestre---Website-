# Guia rápido — Equipe dos Amigos do Mestre Álvaro

## Como editar o site

Depois que o responsável técnico publicar a versão v2 no Netlify e conectar o repositório GitHub ao Pages CMS:

1. Abra **https://app.pagescms.org/** e entre com a conta do GitHub que recebeu acesso ao repositório.
2. Escolha o projeto **Amigos do Mestre Álvaro**.
3. Clique em **Textos e imagens do site**.
4. Altere títulos, descrições, projetos ou fotos. Para adicionar uma foto, escolha o campo de imagem correspondente e envie o arquivo.
5. Salve. A alteração será registrada no GitHub e publicada automaticamente pelo Netlify após um novo deploy.

Dica: escreva legendas e descrições alternativas para fotos. Confirme que há permissão de uso das imagens e mantenha backups.

## Como agendar passeios e ações

**Se o Google Calendar público estiver configurado:** abra a agenda oficial, crie um evento com nome claro, descrição, data e horário, e salve. O site consulta essa agenda automaticamente, então não é necessário editar o HTML.

**Sem Google Calendar:** no Pages CMS, abra **Eventos cadastrados manualmente**, adicione uma data no formato `AAAA-MM-DD`, título e descrição e salve. O site mostrará a programação assim que o deploy terminar.

Não anuncie atividades não confirmadas. O calendário começa sem eventos inventados.

## Como receber mensagens

Entre no **Netlify → Forms → contato** para ver as mensagens. O e-mail institucional configurado em **Submission notifications** recebe um aviso a cada nova submissão. O aviso e a mensagem não são a mesma coisa: a equipe deve ler o conteúdo e responder ao remetente pelo e-mail informado.

Evite compartilhar submissões por grupos públicos e restrinja o acesso à equipe responsável.

## O que o projeto não faz sozinho

- Não cria contas no GitHub, Netlify, Google ou Pages CMS.
- Não escolhe o endereço de e-mail que receberá mensagens: a associação precisa cadastrá-lo nas notificações do Netlify.
- Não autoriza o Google Calendar sem a configuração da agenda pública e das duas variáveis de ambiente.
- Não confirma automaticamente a presença de visitantes nos passeios; isso é organizado pela equipe.

Para orientações técnicas detalhadas, leia o arquivo `README.md`.
