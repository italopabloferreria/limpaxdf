# Autenticação Supabase para homologação do CRM

Estado em 28/09/2026: Google OAuth/Supabase Auth está em modo de testes. O teste transitório negou ao usuário sem perfil a leitura de um lead sintético e terminou em `ROLLBACK`. A migração de hierarquia e o bootstrap do único superadministrador foram aplicados no projeto de homologação; o login Google real mostrou esse papel após recarga. O CRM publicado usa a identidade atual do Sites e perfis D1; D1/R2 continuam sendo a fonte operacional. A matriz completa de RLS e Storage ainda antecede qualquer leitura Supabase operacional.

## Escolha de implementação

Usar Google como provedor do Supabase Auth no ambiente de homologação, com fluxo PKCE iniciado pela aplicação e callback no mesmo origin. A implementação local usa `@supabase/ssr`, que guarda a sessão em cookies `SameSite=Lax` e `Secure` em HTTPS, mas acessíveis a JavaScript (`HttpOnly=false`) porque o cliente de navegador precisa gerenciar o fluxo. Não registrar tokens nem colocá-los em query string ou `localStorage`. O callback troca o código por sessão no servidor; a rota de status valida a identidade com `auth.getUser` e consulta `crm_user_profiles` por `user_id`. Cada futura rota CRM Supabase protegida precisa repetir a verificação do perfil ativo; este protótipo isolado ainda não protege nem substitui as rotas operacionais. Logout encerra a sessão Supabase e remove seus cookies.

Até o corte aprovado, preservar a autenticação Sites nas rotas operacionais D1. Não converter o e-mail Sites em JWT Supabase e não aceitar o JWT Supabase como autorização para mutações D1. A experiência de homologação deve ficar isolada da operação e usar somente dados sintéticos.

## Fluxo de entrada e vínculo

1. A aplicação apresenta entrada de homologação somente no ambiente configurado. O início do OAuth usa `signInWithOAuth({provider:"google"})`, retorno relativo validado por allowlist e proteção de estado/PKCE da biblioteca.
2. O Google retorna ao callback configurado no Supabase; o Supabase retorna à aplicação. O callback processa um único código de autorização, impede redirecionamento para origin externo e troca o código por sessão no servidor.
3. O servidor chama `auth.getUser` com o access token recém-obtido. Para acesso CRM, exige linha ativa em `crm_user_profiles` com `user_id = user.id` e papel conhecido. E-mail é usado para conferência humana e auditoria, não para criar autorização automática.
4. Perfil ausente ou desativado resulta em acesso negado; autenticação Google bem-sucedida sozinha não autoriza o CRM. O sistema pode mostrar instrução neutra de contato com administrador sem revelar listas de usuários.
5. O servidor usa o JWT do usuário nas consultas Supabase para que RLS aplique as políticas; nunca usa `service_role` como sessão de CRM.
6. Ao expirar ou revogar a sessão, a chamada seguinte falha fechada ou renova pelo fluxo previsto. Ao sair, a sessão Supabase é encerrada e o cookie apagado.

## Bootstrap administrativo

Regra confirmada pelo proprietário em 28/09/2026: Ítalo é o único superadministrador; só ele pode criar ou promover administradores. Administradores comuns podem cadastrar atendentes, mas não administradores nem alterar o superadministrador. O perfil `admin` ativo tem `is_super_admin=true` e `user_id` ligado ao UUID real de `auth.users`; um índice permite apenas um. Clientes autenticados têm apenas `SELECT` nessa tabela, sem grant para alterar a coluna. Não derivar esse privilégio apenas de e-mail, `user_metadata` ou da sessão do Dashboard. Registrar quem fez cada vínculo e testar alteração de papel, desativação e proteção do proprietário antes de automatizar gestão Supabase pela UI. Os demais usuários de homologação ainda estão [VALIDAR].

A migração `supabase/migrations/20260928050106_restrict_crm_admin_management.sql` foi aplicada remotamente em transação única, após o teste negativo com 0 perfis. A auditoria confirmou coluna, índice, função, três policies e apenas `SELECT` para `authenticated`. O bootstrap `docs/supabase/SUPER_ADMIN_BOOTSTRAP.sql` criou um perfil único vinculado ao UUID verificado; não criou outro usuário Auth. A interface operacional `/crm/perfil` ainda usa a identidade Sites/D1 e uma configuração local controlada; não cria contas Supabase Auth.

A baseline permitia correspondência de perfil por e-mail nas funções `is_crm_member` e `is_crm_admin` e na leitura de perfis. A migração incremental `supabase/migrations/20260925135006_require_bound_crm_user_id.sql` foi aplicada via SQL Editor em 25/09/2026 após autorização específica; agora exige `user_id = auth.uid()` para perfis ativos. O teste negativo transitório e a leitura positiva do próprio perfil com login real passaram. A matriz de RLS para outros papéis e fixtures sintéticas ainda precisa de testes separados antes de ativar o adapter.

## Matriz mínima de aceite

| Sessão | Perfil | Resultado esperado |
| --- | --- | --- |
| Sem login | nenhum | CRM protegido nega acesso |
| Google válido | nenhum | login concluído; CRM nega acesso |
| Google válido | inativo, mesmo `user_id` | CRM nega acesso |
| Google válido | atendente ativo, mesmo `user_id` | somente ações permitidas à atendente |
| Google válido | admin ativo, mesmo `user_id` | ações administrativas previstas, com auditoria |
| Google válido | superadministrador ativo, mesmo `user_id` e marca administrativa | pode criar/promover administradores após a gestão Supabase ser habilitada |
| Google válido | admin comum tenta criar/promover admin ou alterar superadmin | negado |
| Google válido | perfil ativo de outro `user_id` visível ao admin | não substitui o próprio perfil |
| Token expirado/revogado | qualquer | acesso negado ou renovação válida; nenhuma elevação de papel |

RLS deve ser testada com usuário sem perfil e usuário inativo, incluindo leitura negada em `leads` e em tabelas relacionadas. Testar Storage com buckets privados e arquivos sintéticos em etapa separada. Uma consulta SQL Editor como dono do banco não serve como teste RLS de usuário.

## Verificador existente

`scripts/validate-supabase-homologation.mjs` conserva dry-run como padrão. Para `--remote`, exige autorização via variável local, JWT Supabase de usuário, perfil ativo ligado ao UUID retornado por `auth.getUser`, e `SUPABASE_HOMOLOGATION_BATCH=homologation-...`. Faz apenas uma consulta de contagem (`head:true`) de leads com `origin=homologation` e `import_batch` igual ao lote informado; lote vazio dá resultado incompleto. O comando não prova o fluxo OAuth no navegador nem os casos de negação; esses são gates separados. O JWT temporário não deve ser salvo em arquivo versionado ou enviado no chat.

## Arquivos previstos na etapa de implementação

- Entrada e callback de homologação: novas rotas em `app/` com retorno relativo validado, sessão por cookie seguro e erros neutros.
- Cliente/guard de servidor: `lib/supabase.ts` e novo módulo de sessão para validar Auth e perfil, com cache somente se respeitar revogação e atualização de papéis.
- Proteção do CRM: `lib/crm.ts` e rotas afetadas somente quando a migração de autenticação for decidida; manter explicitamente o caminho Sites/D1 até lá.
- Interface: componentes de login/logout e estado de sessão, usando os cookies geridos por `@supabase/ssr` sem exibir tokens na página.
- QA: testes sintéticos de callback, redirecionamento, perfil ausente/inativo, refresh, logout, RLS de usuário sem perfil e matriz de papéis.
- Migração incremental: somente se a revisão das policies ou do vínculo exigir mudança de schema; nunca alterar a baseline aplicada.

## Configuração externa pendente

O origin `http://localhost:5173`, os callbacks, o projeto Google Cloud e o cliente OAuth de testes foram configurados e usados com sucesso. Para ampliar a matriz, definir os endereços e a titularidade dos demais usuários de teste [VALIDAR]. Criar seus perfis e fixtures sintéticas em lote identificado apenas após preparação e autorização específicas para essas operações remotas. Não usar dados reais nesta validação.

## Critério de passagem

O fluxo completo entra e sai sem manipulação manual de JWT; a matriz acima passa usando sessões reais; cada consulta retorna apenas o escopo RLS permitido; o lote sintético é reconciliável; e nenhuma rota combina uma listagem Supabase com detalhes mutáveis de D1 sem experiência isolada. O resultado deve ser registrado com projeto, ambiente e commit, sem tokens ou dados pessoais.
