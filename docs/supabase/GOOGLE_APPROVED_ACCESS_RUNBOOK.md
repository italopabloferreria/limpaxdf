# S01 — acesso Google apenas para pessoas aprovadas

Estado em 28/09/2026: migração incremental `20260928055505_crm_google_approved_access.sql` aplicada no projeto `lkamarbpjqlibxlmcico` via SQL Editor após autorização específica; hook `Before User Created` ativo. Não reaplicar por `supabase db push`: o histórico remoto das migrações anteriores foi criado pelo SQL Editor e ainda não foi reconciliado. O CRM operacional continua em D1/R2 e `SUPABASE_DATA_MODE=disabled`.

## Comportamento

1. O superadministrador pode aprovar administradores e atendentes; administradores comuns podem aprovar atendentes. A tabela `crm_google_approvals` usa RLS e grants de coluna; e-mail e autor da aprovação não podem ser alterados pelo cliente.
2. O hook `public.crm_before_user_created` aceita somente um e-mail ativo previamente aprovado e provedor Google. Ele roda como `supabase_auth_admin`, sem privilégios de API pública. A função retorna `403` para os demais; o trigger em `auth.users` reforça o bloqueio e vincula o UUID novo ao perfil CRM em uma única transação.
3. A desativação e a mudança de papel de uma aprovação atualizam o perfil vinculado. O superadministrador existente não depende dessa tabela e não pode ser alterado pelo trigger.
4. O callback local recusa sessões sem perfil ativo, encerra a sessão e mostra “Usuário não registrado”. A checagem de perfil por UUID e as policies de RLS permanecem exigidas em cada operação.

## Aplicação e validação remotas

1. Executar `GOOGLE_APPROVALS_PREFLIGHT.sql` somente para leitura no projeto `lkamarbpjqlibxlmcico`: esperar 1 usuário Auth, 1 perfil, 1 superadministrador ativo vinculado, 0 leads e `false` para os três objetos novos. Verificar no Dashboard que não há hook `Before User Created` conflitante e registrar a configuração atual de Auth para reversão.
2. Com autorização específica para alterar o projeto, executar a migração completa em uma transação no SQL Editor. Verificar RLS, grants, policies, funções e triggers. Nenhum usuário ou aprovação é criado pela migração.
3. Com autorização específica para o teste sintético remoto, executar `GOOGLE_APPROVALS_PROBE.sql`. O teste simula `authenticated` para inserções pelo proprietário, executa a função do hook como `postgres`, insere apenas e-mails `.invalid` e termina em `ROLLBACK`; confirmar 0 aprovações e 1 perfil após a execução. O SQL Editor não permite `SET ROLE supabase_auth_admin` (erro 42501); por isso o teste não comprova o caminho interno do Auth. Verificar o grant por leitura e validar o hook após ativação no Dashboard.
4. Em Authentication → Hooks, ativar **Before User Created** como função Postgres `public.crm_before_user_created`. Testar novamente o login Google do proprietário; ele já existe e deve continuar mostrando Superadministrador. Habilitar `SUPABASE_GOOGLE_APPROVALS_ENABLED=true` apenas no ambiente local de homologação após esses checks.
5. Para testar o primeiro login de outra pessoa, é preciso uma conta de teste aprovada e também incluída na audiência de testes do Google Cloud. Não criar/convidar contas reais ou publicar o app OAuth sem autorização separada.

## Parada e reversão

Se a migração ou o hook falhar, não habilitar a interface de aprovações. Para desfazer a etapa de Auth, desativar primeiro o hook no Dashboard; manter a tabela e a migração versionadas para análise, sem apagar perfis/usuários. O CRM D1/R2 não depende desta mudança. O teste sintético é reversível pelo próprio `ROLLBACK`.

Fontes: [Before User Created Hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook), [Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks), [User Management](https://supabase.com/docs/guides/auth/managing-user-data).

## Evidência de execução em 28/09/2026

- Preflight somente leitura: 1 usuário Auth, 1 perfil ativo superadministrador vinculado, 0 leads, nenhum objeto de aprovação preexistente e nenhum hook configurado.
- Migração executada como uma transação completa; SQL Editor retornou `Success. No rows returned`. Pós-validação: RLS ativo, 4 policies, `authenticated` com SELECT e UPDATE da coluna de papel, sem DELETE, e 0 aprovações.
- Primeira versão do probe parou em `permission denied to set role "supabase_auth_admin"`; o editor não pode assumir esse papel interno. A transação foi revertida: 0 aprovações, 1 perfil, 0 auditorias de aprovação. A versão ajustada testou bloqueio de não aprovado e de provedor não Google, aprovação sintética de atendente e administrador pelo superadministrador, e retornou `Success` com `ROLLBACK`. Contagens finais permaneceram 0/1/0. Grants de EXECUTE e SELECT ao papel interno foram confirmados por consulta somente leitura.
- Dashboard Auth Hooks mostrou `Before User Created hook` **ENABLED**, tipo Postgres, schema `public`, função `crm_before_user_created`. Login Google real do proprietário retornou `Perfil CRM ativo — Superadministrador`; tela de gestão de acessos mostrou lista vazia. A flag foi ligada apenas na `.env.local` ignorada pelo Git.
- Ainda não há conta adicional para testar um primeiro login aprovado ou uma recusa OAuth real. O teste SQL da função não substitui esses cenários. Nenhum usuário, convite, lead ou dado real foi criado; G13 continua aberto.
