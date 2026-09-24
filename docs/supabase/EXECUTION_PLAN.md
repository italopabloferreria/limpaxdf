# Plano executavel Supabase

Estado atualizado em 23/09/2026: **baseline aplicada conforme registro anterior; CRM ainda em D1/R2**. A sequência abaixo é o plano original, não uma lista integral de pendências. Projeto São Paulo, health-check e aplicação da baseline já estão registrados ao final; não repetir criação nem SQL. Nesta retomada foram verificados somente arquivos, configuração local, TypeScript e testes.

## Objetivo da fase

Preparar uma homologacao Supabase reversivel, sem tocar em producao, sem apagar D1/R2 e sem importar dados reais.

## Sequencia

1. Criar projeto Supabase pertencente a empresa `[VALIDAR]`.
2. Definir ambiente: `supabase-dev`, `supabase-staging` ou equivalente `[VALIDAR]`.
3. Configurar Google Auth no Supabase e no Google Cloud:
   - origem local `http://localhost:5173`;
   - origem futura do dominio proprio `[VALIDAR]`;
   - callback Supabase do projeto real `[VALIDAR]`.
4. Criar schema em banco vazio usando migracao real gerada por CLI ou ferramenta aprovada.
5. Rodar advisors/security checks do Supabase.
6. Criar buckets privados previstos.
7. Criar politicas de Storage para admin/attendant.
8. Criar perfis internos:
   - dois admins: dono + tecnico;
   - uma atendente.
9. Executar dry run com dados sinteticos:
   - clientes;
   - contatos;
   - locais;
   - leads;
   - tarefas;
   - notas;
   - anexos ficticios.
10. Comparar contagens, vinculos e hashes entre origem sintetica e Supabase.
11. Testar exportacao manual de arquivo.
12. Testar backup completo e restauracao em ambiente limpo.
13. Implementar adapter da aplicacao em branch, mantendo D1 como default ate cutover aprovado.
14. Validar login Google, RLS e negacoes:
   - admin acessa;
   - atendente acessa apenas escopo permitido;
   - usuario autenticado sem perfil nao acessa.
15. Registrar evidencias antes de qualquer cutover.

## Comandos somente quando houver projeto real

Nao executar agora. Descobrir comandos pela CLI instalada no momento:

```powershell
supabase --help
supabase db --help
supabase migration --help
```

Se a CLI nao estiver instalada, decidir instalacao em tarefa propria e versionar lockfile quando houver dependencias npm.

## Aceite de homologacao

- Schema criado em ambiente Supabase nao produtivo.
- RLS habilitada em todas as tabelas do CRM.
- Politicas usam `TO authenticated` com verificacao de perfil interno.
- Nenhuma politica depende de `user_metadata`.
- `service_role` nao aparece no frontend nem em arquivo versionado.
- Buckets privados aceitam upload/download somente por perfil permitido.
- Exportacao manual gera arquivo sem formulas perigosas.
- Backup externo e restauracao passam com dados sinteticos.
- Cutover permanece bloqueado ate autorizacao explicita.

## Decisões do plano original (consultar atualizações abaixo)

Antes de implementar conexao real, decidir:

- nome do projeto Supabase;
- regiao;
- plano Free/Pro inicial;
- quem controla a organizacao;
- quais emails serao admin/atendente;
- destino externo de backup;
- se o dominio proprio ja apontara para esta homologacao.
## Homologacao local implementada em 2026-09-23

Projeto alvo vazio: `Limpax Brasil`, ref `lkamarbpjqlibxlmcico`, região `South America (São Paulo) / sa-east-1`.

Foi criada a primeira integração de código sem substituir o banco atual:

- `lib/supabase.ts`: leitura segura de configuração, inferência de project ref, cliente público Supabase e health-check Auth.
- `app/api/supabase/health/route.ts`: endpoint interno de diagnóstico que retorna status, project ref, região, host e disponibilidade REST sem expor chave.
- `scripts/check-supabase-local.mjs`: verificação local de `.env.local`, região São Paulo e ausência de `service_role`.
- `npm run qa:supabase-local`: script de QA local.

O D1/Cloudflare continua sendo o backend padrão do CRM. Na etapa de health-check ainda não havia schema aplicado; a seção seguinte registra a aplicação posterior da baseline. Supabase não deve ser considerado produção.

Nota de chave Supabase atual: sb_publishable_* deve ser enviada no header apikey. Não usar Authorization: Bearer sb_publishable_*; o Bearer fica reservado para JWT de usuário autenticado.

Health-check de homologação usa /auth/v1/health, que valida conectividade do projeto sem depender de tabelas. /rest/v1/ pode retornar 401 no projeto vazio sem chave secreta/admin e não deve ser usado como critério de falha nesta etapa.
## Migration aplicada em 2026-09-23

A migration `supabase/migrations/202609230001_limpax_crm_baseline.sql` foi aplicada no projeto `Limpax Brasil`, ref `lkamarbpjqlibxlmcico`, região `sa-east-1`, pelo SQL Editor do Supabase Dashboard. Nenhum dado real foi importado.

Resultado da verificação `supabase/verification/verify_limpax_crm_baseline.sql`:

- `public_tables`: 14
- `rls_enabled`: 14
- `policies`: 50
- `storage_buckets`: 5

Observação operacional: a migration cria policies com nomes fixos e deve ser aplicada uma vez em projeto vazio. Uma segunda execução parcial pode retornar erro de policy já existente; isso não indica falha da primeira aplicação.

## Readiness Auth/RLS para adapter de leitura

O adapter local de leitura (`SUPABASE_DATA_MODE=read_only`) depende de duas camadas no Supabase:

- Data API grants: `authenticated` precisa de `SELECT` nas tabelas lidas, hoje `public.leads` e `public.crm_user_profiles`.
- RLS/policies: o JWT deve pertencer a um usuario com perfil ativo em `crm_user_profiles`; usuario autenticado sem perfil deve receber zero linhas.

A baseline aplicada nao deve ser editada. Em 23/09/2026, após autorização explícita do usuário, os grants mínimos abaixo foram aplicados pelo Supabase SQL Editor no projeto `lkamarbpjqlibxlmcico`:

```sql
grant select on public.leads to authenticated;
grant select on public.crm_user_profiles to authenticated;
```

A verificacao remota de metadata confirmou `SELECT` para `authenticated` nas duas tabelas, RLS ligado em `public.leads` e `public.crm_user_profiles`, e policies `leads_member_select` e `crm_user_profiles_read_own_or_admin` vinculadas a `authenticated`. Essa etapa nao ativou o adapter, nao usou `service_role`, nao leu dados reais, nao convidou usuarios e nao fez deploy/cutover.

O check local `npm run qa:supabase-auth-readiness` valida o plano e a presenca das policies/grants esperados nos arquivos; ele nao substitui a validacao real de Auth/RLS com JWT de usuario Supabase perfilado.

Atualização 24/09/2026: `AUTH_HOMOLOGATION_DESIGN.md` detalha como produzir a sessão de homologação e vinculá-la a `crm_user_profiles.user_id`. O verificador local agora exige esse vínculo e um lote de fixtures sintéticas identificado por `SUPABASE_HOMOLOGATION_BATCH`; sua leitura de leads retorna somente contagem do lote. O fluxo OAuth e os casos RLS negativos continuam sem validação remota.

Referencias atuais Supabase:

- Data API grants sao avaliados antes de RLS; erro `42501` indica permissao de tabela ausente, nao policy negando linha.
- `authenticated` e `anon` sao roles Postgres diferentes; policy `TO authenticated` deve continuar combinada com predicado de perfil interno.
- `service_role` nao deve ser usado para compensar ausencia de sessao de usuario.
