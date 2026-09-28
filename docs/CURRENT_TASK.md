# Tarefa ativa — S01 homologação Supabase Auth/RLS

## Autorização e pasta

Pasta oficial: `C:/Users/italo/Programação/Limpax`. A revisão AUDIT-CLEANUP-01 foi concluída e enviada ao GitHub no commit `3f3e410`. O usuário autorizou explicitamente em 24/09/2026 aceitar a política de dados das APIs Google, concluir o app OAuth de homologação em modo de testes, criar cliente web, salvar ID/secret somente no provedor Google do Supabase `lkamarbpjqlibxlmcico`, cadastrar callbacks, ativar o provedor e usar sua conta como usuária de teste, sem conceder acesso CRM automaticamente.

## Escopo

Concluir o login Google/Supabase isolado, validar login/logout e perfil ausente; preparar a matriz de perfis e RLS com identidades e fixtures sintéticas, sem ligar o adapter operacional.

Complemento solicitado em 28/09/2026: Ítalo deve ser o único superadministrador, com exclusividade para criar/promover administradores; administradores comuns cadastram atendentes. Fechar a permissão indevida na API Sites/D1 existente e disponibilizar cadastro de equipe no perfil do CRM. Preparar a política equivalente no Supabase sem ativar a gestão Supabase antes dos testes/autorização remotos.

D1/R2, APIs em uso, migrações existentes, fontes de mídia e histórico relevante são preservados. Não há deploy, importação real, alteração de DNS ou remoção da cópia alternativa nesta etapa.

## Resultado

Em 25/09/2026, app Google OAuth `Limpax CRM Homologação` criado em modo de testes, cliente web configurado com origin `http://localhost:5173` e callback `https://lkamarbpjqlibxlmcico.supabase.co/auth/v1/callback`. O Supabase aceita `http://localhost:5173/api/supabase/homologation/callback`; o provedor Google está ativo; a conta do proprietário foi cadastrada como usuária de teste. ID/secret ficaram no provedor, sem versionamento. A flag local ignorada pelo Git habilita o botão. Teste real no navegador: Google entrou, callback criou sessão, consulta retornou `no_profile`; logout retornou `signed_out` e permaneceu assim após recarregar. O primeiro erro de troca de código foi causado pela execução do servidor local sem acesso de rede; a repetição com rede passou. Primeiro gate incompleto continua G13_RELEASE_GATE.

## Próximo passo após concluir a revisão

A migração incremental `supabase/migrations/20260925135006_require_bound_crm_user_id.sql` foi aplicada no projeto remoto via SQL Editor em transação única após autorização do usuário. As funções/política agora exigem UUID; o helper por e-mail foi removido, perfis continuam 0 e o navegador confirmou `no_profile` após login real. Ver `docs/supabase/BOUND_USER_RLS_RUNBOOK.md`. Próximo: definir com o proprietário os papéis dos usuários de teste, criar perfis controlados e fixtures sintéticas somente com autorização específica, então executar matriz RLS positiva/negativa e Storage. `SUPABASE_DATA_MODE=disabled` até aceite completo.

Em 28/09, a revisão remota somente de leitura confirmou 1 usuário Auth, 0 perfis, 0 leads e grants SELECT para `authenticated` em leads/perfis; INSERT em leads não está concedido. Simulação de `authenticated` com o UUID real em transação retornou contagens visíveis 0/0, mas a tabela vazia não prova negação RLS. `docs/supabase/RLS_NEGATIVE_PROBE.sql` prepara a prova com lead sintético e `ROLLBACK`; não foi executado e requer autorização específica. Os checks locais de readiness e dry-run passaram. A definição do papel da conta do proprietário foi solicitada; nenhum perfil foi criado.

A hierarquia D1 foi implementada localmente: `CRM_SUPER_ADMIN_EMAIL` em `.env.local` ignorado pelo Git identifica a conta informada pelo proprietário; a API recusa que administrador comum crie/promova/edite administradores e protege a desativação do proprietário. `/crm/perfil` mostra o papel e permite cadastrar equipe conforme a permissão. No Supabase remoto, perfis seguem 0 e grants de perfis para `authenticated` continuam apenas SELECT; a migration de hierarquia e o bootstrap permanente do proprietário foram preparados localmente, mas não executados. O teste negativo com 0 perfis deve preceder o bootstrap. O navegador local mostrou o perfil do administrador de teste Sites; 18/18 testes de acesso, 16/16 testes gerais, TypeScript, lint e build passaram.

## Bloqueios externos e futuro

Papéis dos demais usuários de homologação, vínculo administrativo e lote sintético ainda precisam de definição. G13 depende de migrações, backup/restauração, configuração e desempenho remotos. Importador, comercial, documentos, agenda/OS, frota, financeiro e fiscal são fases futuras em `docs/ROADMAP.md`.
