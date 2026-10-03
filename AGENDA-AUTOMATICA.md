# Versão 6 — robô com navegador e aviso de atualização

O robô usa Playwright/Chromium no GitHub Actions para abrir as páginas públicas, esperar o catálogo carregar e selecionar eventos por Ladies, Meninas, Rosa, Mulher, Diva, Feminina, Women e Pink. Aceita eventos mistos, sem anunciá-los como exclusivos para mulheres. Confere inscrições abertas e o botão de inscrição antes de enviar os eventos ao backend. Até 20 candidatos são conferidos por execução; a busca não cobre necessariamente todo o catálogo porque os resultados são paginados.

Se houver bloqueio, CAPTCHA, erro de navegação ou instalação do navegador, a rotina informa uma falha ao backend. Não tenta resolver CAPTCHA nem contornar controles. Uma busca parcialmente concluída é descartada: não renova eventos antigos. O frontend mostra exatamente **Dados não atualizados**. O status e a última atualização bem-sucedida ficam no PostgreSQL, mesmo após reiniciar o backend. O mesmo aviso aparece se o status não puder ser consultado ou se a última atualização bem-sucedida tiver mais de 48 horas. Se o GitHub não conseguir comunicar a falha ao Render, o aviso por desatualização continua funcionando após esse prazo.

Os registros continuam guardados, mas eventos automáticos deixam de aparecer como inscrição aberta após 48 horas sem conferência. Eventos manuais têm validade de sete dias. Um botão de inscrição não garante que existam vagas em todas as categorias: a pessoa deve confirmar no organizador.

## Ativar na publicação existente

1. Envie os arquivos deste pacote ao repositório, substituindo a versão anterior. Inclua `.github/workflows/eventos.yml`, a pasta `scripts`, `package.json` e `package-lock.json`, além de backend e frontend.
2. No Render, mantenha o `EVENT_SYNC_TOKEN` que você já cadastrou. Defina `TICKETSPORTS_SYNC_ENABLED=false`: o navegador agora é executado pelo GitHub, não pelo Render. Mantenha DATA_MODE, DATABASE_URL e CORS_ORIGIN existentes.
3. Faça o deploy do Render. O build deve continuar como `npm ci --include=dev && npm run build --workspace backend && npm run db:setup --workspace backend`. Esse último comando cria a tabela de status. O start continua `npm run start --workspace backend`.
4. Publique o frontend atualizado no Netlify para que o aviso apareça. Mantenha a URL da API atual.
5. Depois que os dois deploys terminarem, no GitHub vá a **Actions → Atualizar agenda Ticket Sports → Run workflow**. O secret `EVENT_SYNC_TOKEN` existente deve continuar igual ao do Render; não precisa criar outro.
6. A rotina instala o navegador, busca os eventos e informa o resultado. A primeira execução pode levar vários minutos. Se ficar vermelha, abra **Buscar eventos e atualizar o banco** para ver a mensagem. O resultado também é salvo no artefato `resultado-robo`.

Agendamento diário: 06:17 no horário de Brasília (09:17 UTC). O arquivo deve estar no branch principal, com Actions habilitado. Agendamentos podem atrasar; repositórios públicos inativos por 60 dias podem ter agendamentos desativados. O pacote prepara a automação, mas não publica arquivos nem altera sua conta automaticamente.

Status: https://heraiasports.onrender.com/api/integrations/ticketsports/status

A rota antiga `/sync` agora instrui a executar o workflow atualizado. O navegador envia um relatório para `/report`, protegido pelo token. O backend valida campos, IDs, palavras-chave e links oficiais; um relatório de sucesso só é salvo por completo, em transação.

## Verificação e limitações

Builds do frontend e backend e testes de parser, autenticação, recebimento do relatório, duplicidade e preservação das conferências em caso de falha. O download do Chromium foi bloqueado/truncado no ambiente de desenvolvimento; por isso a navegação real desta versão ainda precisa ser testada na primeira execução do GitHub. Não foi comprovado que a Ticket Sports aceitará o navegador automatizado. Se bloquear, o aviso aparecerá quando o relatório da falha chegar ao Render.

Não é uma API oficial nem uma integração autorizada da Ticket Sports. Páginas e políticas podem mudar, exigindo manutenção.

Referência de instalação do navegador no GitHub: https://playwright.dev/docs/ci-intro
