# Agenda automática da Heraia — versão 5

O backend busca o catálogo público da Ticket Sports por Ladies, Meninas, Rosa, Mulher, Diva, Feminina, Women e Pink. Aceita eventos mistos cujo nome contenha essas palavras. Não afirma que são exclusivos para mulheres. Confere data futura, status de inscrições abertas, identidade do evento e botão de inscrição na página oficial. Descarta páginas de teste e encerradas. Até 20 candidatos são conferidos por execução; a busca pode não cobrir todos os eventos porque os resultados são paginados.

Dados salvos no PostgreSQL: nome, data, cidade, estado, fonte, link, status e horário da conferência. Identificadores estáveis evitam duplicatas. Eventos automáticos sem nova conferência em 48 horas deixam de aparecer; os eventos anteriormente cadastrados manualmente continuam com validade de sete dias. Uma falha da fonte não apaga o banco nem renova conferências antigas.

## Como ativar na sua publicação existente

1. Envie os arquivos atualizados deste pacote ao GitHub, incluindo `.github/workflows/eventos.yml`. As pastas backend e frontend substituem as versões anteriores; mantenha as variáveis já existentes do Render e Netlify.
2. No Render, entre no serviço **heraiasports → Environment** e adicione `TICKETSPORTS_SYNC_ENABLED` com valor `true`.
3. Crie uma senha aleatória de pelo menos 32 caracteres para a sincronização. Pode gerar no terminal com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. No Render, salve como `EVENT_SYNC_TOKEN`. Não coloque essa senha em arquivos, frontend ou screenshots.
4. No GitHub, abra **Settings → Secrets and variables → Actions → New repository secret**. Nome: `EVENT_SYNC_TOKEN`. Valor: exatamente a mesma senha do Render.
5. Faça o deploy do Render com o comando de build já configurado: `npm ci --include=dev && npm run build --workspace backend && npm run db:setup --workspace backend`.
6. No GitHub, abra **Actions → Atualizar agenda Ticket Sports → Run workflow** para testar a primeira atualização. O arquivo precisa estar no branch principal e Actions habilitado. Depois a execução fica agendada diariamente às 09:17 UTC (06:17 de Brasília). Agendamentos do GitHub podem sofrer atrasos; em repositórios públicos inativos por 60 dias podem ser desativados.
7. Publique o frontend atualizado no Netlify. A API continua em `https://heraiasports.onrender.com/api`.

O backend também tenta atualizar ao iniciar e a cada 24 horas enquanto estiver em execução. Serviços que adormecem não executam temporizadores, por isso incluí a rotina do GitHub. Não foi criado nenhum agendamento na sua conta por este pacote: ele entra em funcionamento após a publicação e configuração acima.

Status: https://heraiasports.onrender.com/api/integrations/ticketsports/status . `never` significa que não executou desde o início do servidor; `ok` mostra quantos candidatos foram encontrados e quantos eventos foram atualizados; `error` informa a falha. Esse resumo fica em memória e reinicia com o servidor; os eventos persistem no PostgreSQL.

## Sobre a API gratuita

A Ticket Sports anuncia API aberta, mas a documentação encontrada é voltada a organizadores e exige autenticação. Não foi confirmado acesso gratuito e anônimo ao catálogo completo. Esta implementação lê páginas públicas, sem chave de API, e não utiliza endpoints privados. Não é uma integração oficial nem garantia de disponibilidade: alterações no HTML, bloqueios ou mudanças de acesso podem exigir manutenção.

Fontes consultadas em 03/10/2026:
- https://www.ticketsports.com.br/funcionalidades
- https://www.postman.com/ticketsports/ticket-sports-api/overview
- https://produto.ticketsports.com.br/Calendario/?termo=mulher
- https://www.ticketsports.com.br/Evento/87764/Cadastro

Verificação: o parser foi exercitado com HTML real do catálogo e da página oficial de inscrição, além de testes de seleção, duplicidade, encerramento e autenticação. A sincronização completa precisa ser conferida no Render após ativação, onde o backend acessa a fonte.
