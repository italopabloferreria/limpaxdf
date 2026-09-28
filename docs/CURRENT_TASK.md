# Tarefa ativa — S01 homologação Supabase Auth/RLS

## Autorização e pasta

Pasta oficial: `C:/Users/italo/Programação/Limpax`. A revisão AUDIT-CLEANUP-01 foi concluída e enviada ao GitHub no commit `3f3e410`. O usuário autorizou explicitamente em 24/09/2026 aceitar a política de dados das APIs Google, concluir o app OAuth de homologação em modo de testes, criar cliente web, salvar ID/secret somente no provedor Google do Supabase `lkamarbpjqlibxlmcico`, cadastrar callbacks, ativar o provedor e usar sua conta como usuária de teste, sem conceder acesso CRM automaticamente.

## Escopo

Concluir o login Google/Supabase isolado, validar login/logout e perfil ausente; preparar a matriz de perfis e RLS com identidades e fixtures sintéticas, sem ligar o adapter operacional.

Complemento confirmado em 28/09/2026: Ítalo é o único superadministrador, com exclusividade para criar/promover administradores; administradores comuns cadastram atendentes. A API Sites/D1 e `/crm/perfil` aplicam essa hierarquia. A política equivalente e o perfil do proprietário já foram aplicados no Supabase; a gestão de contas Supabase pela UI continua desativada até a matriz de testes e o desenho de provisionamento.

D1/R2, APIs em uso, migrações existentes, fontes de mídia e histórico relevante são preservados. Não há deploy, importação real, alteração de DNS ou remoção da cópia alternativa nesta etapa.

## Resultado

Em 25/09/2026, app Google OAuth `Limpax CRM Homologação` criado em modo de testes, cliente web configurado com origin `http://localhost:5173` e callback `https://lkamarbpjqlibxlmcico.supabase.co/auth/v1/callback`. O Supabase aceita `http://localhost:5173/api/supabase/homologation/callback`; o provedor Google está ativo; a conta do proprietário foi cadastrada como usuária de teste. ID/secret ficaram no provedor, sem versionamento. A flag local ignorada pelo Git habilita o botão. Teste real no navegador: Google entrou, callback criou sessão, consulta retornou `no_profile`; logout retornou `signed_out` e permaneceu assim após recarregar. O primeiro erro de troca de código foi causado pela execução do servidor local sem acesso de rede; a repetição com rede passou. Primeiro gate incompleto continua G13_RELEASE_GATE.

## Próximo passo após concluir a revisão

A migração incremental `supabase/migrations/20260925135006_require_bound_crm_user_id.sql` foi aplicada no projeto remoto via SQL Editor em transação única após autorização do usuário. As funções/política exigem UUID; o helper por e-mail foi removido. Na verificação de 25/09, havia 0 perfis e o navegador confirmou `no_profile`. Ver `docs/supabase/BOUND_USER_RLS_RUNBOOK.md`. O bootstrap de 28/09 mudou esse estado conforme registrado abaixo. `SUPABASE_DATA_MODE=disabled` até aceite completo.

Em 28/09, após confirmação específica do proprietário, `docs/supabase/RLS_NEGATIVE_PROBE.sql` passou com um lead sintético negado a `authenticated` sem perfil; `ROLLBACK` deixou 0 leads e 0 perfis. A migração de hierarquia foi aplicada no Supabase e auditada: coluna, índice, função e três policies presentes, `authenticated` com SELECT e sem escrita na tabela de perfis. O bootstrap criou um único perfil ativo de superadministrador, vinculado ao UUID Auth do proprietário; 0 outros perfis e 0 leads. Login Google real mostrou `Papel: Superadministrador` após recarga. O primeiro callback no processo local sem rede falhou; servidor reiniciado com rede passou.

A hierarquia D1 foi implementada localmente: `CRM_SUPER_ADMIN_EMAIL` em `.env.local` ignorado pelo Git identifica a conta informada pelo proprietário; a API recusa que administrador comum crie/promova/edite administradores e protege a desativação do proprietário. `/crm/perfil` mostra o papel e permite cadastrar equipe conforme a permissão. O ambiente de hosting ainda precisa da mesma configuração antes de usar esse fluxo publicado. O navegador local mostrou o perfil do administrador de teste Sites; 18/18 testes de acesso e 16/16 testes gerais passaram na etapa anterior. O endpoint isolado Supabase agora informa `super_admin` quando a flag protegida está presente.

## Bloqueios externos e futuro

Próximo: desenhar e testar provisionamento de Auth/perfis pela interface sob guardas de servidor, com papéis dos demais usuários de homologação [VALIDAR] e lote de leads 100% sintético. A validação remota de outros papéis e Storage depende de identidades de teste autorizadas. G13 depende de migrações, backup/restauração, configuração e desempenho remotos. Importador, comercial, documentos, agenda/OS, frota, financeiro e fiscal são fases futuras em `docs/ROADMAP.md`.
