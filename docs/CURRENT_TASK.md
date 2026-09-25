# Tarefa ativa — S01 homologação Supabase Auth/RLS

## Autorização e pasta

Pasta oficial: `C:/Users/italo/Programação/Limpax`. A revisão AUDIT-CLEANUP-01 foi concluída e enviada ao GitHub no commit `3f3e410`. O usuário autorizou explicitamente em 24/09/2026 aceitar a política de dados das APIs Google, concluir o app OAuth de homologação em modo de testes, criar cliente web, salvar ID/secret somente no provedor Google do Supabase `lkamarbpjqlibxlmcico`, cadastrar callbacks, ativar o provedor e usar sua conta como usuária de teste, sem conceder acesso CRM automaticamente.

## Escopo

Concluir o login Google/Supabase isolado, validar login/logout e perfil ausente; preparar a matriz de perfis e RLS com identidades e fixtures sintéticas, sem ligar o adapter operacional.

D1/R2, APIs em uso, migrações existentes, fontes de mídia e histórico relevante são preservados. Não há deploy, importação real, alteração de DNS ou remoção da cópia alternativa nesta etapa.

## Resultado

Em 25/09/2026, app Google OAuth `Limpax CRM Homologação` criado em modo de testes, cliente web configurado com origin `http://localhost:5173` e callback `https://lkamarbpjqlibxlmcico.supabase.co/auth/v1/callback`. O Supabase aceita `http://localhost:5173/api/supabase/homologation/callback`; o provedor Google está ativo; a conta do proprietário foi cadastrada como usuária de teste. ID/secret ficaram no provedor, sem versionamento. A flag local ignorada pelo Git habilita o botão. Teste real no navegador: Google entrou, callback criou sessão, consulta retornou `no_profile`; logout retornou `signed_out` e permaneceu assim após recarregar. O primeiro erro de troca de código foi causado pela execução do servidor local sem acesso de rede; a repetição com rede passou. Primeiro gate incompleto continua G13_RELEASE_GATE.

## Próximo passo após concluir a revisão

Revisar a migração incremental local `supabase/migrations/20260925135006_require_bound_crm_user_id.sql` e o runbook `docs/supabase/BOUND_USER_RLS_RUNBOOK.md`. O SQL remove a autorização por e-mail da baseline e exige UUID vinculado; não foi aplicado remotamente. Obter autorização específica e confirmar backup/definições remotas antes de aplicar. Em seguida validar negação RLS com a conta sem perfil; só depois definir perfis controlados e fixtures sintéticas. `SUPABASE_DATA_MODE=disabled` até aceite completo.

## Bloqueios externos e futuro

Papéis dos demais usuários de homologação, vínculo administrativo e lote sintético ainda precisam de definição. G13 depende de migrações, backup/restauração, configuração e desempenho remotos. Importador, comercial, documentos, agenda/OS, frota, financeiro e fiscal são fases futuras em `docs/ROADMAP.md`.
