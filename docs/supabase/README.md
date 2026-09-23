# Supabase — pacote de preparacao

Estado: **rascunho tecnico; nenhuma migracao executada**.

Este diretorio prepara a migracao futura para Supabase sem conectar projeto real, sem credenciais e sem alterar D1/R2. Os arquivos aqui servem para revisao, dry run e criacao posterior de migrations reais com Supabase CLI ou ferramenta aprovada.

## Arquivos

- `SCHEMA_RLS_DRAFT.sql`: rascunho PostgreSQL com tabelas, tipos, indices, RLS e politicas iniciais.
- `MAPPING_D1_TO_SUPABASE.md`: mapeamento entre D1/R2 atual e Supabase PostgreSQL/Storage.
- `EXECUTION_PLAN.md`: sequencia operacional para criar projeto, testar Auth Google, migrar dados sinteticos, validar backup/exportacao e planejar cutover.

## Fontes oficiais consultadas

- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage Access Control: https://supabase.com/docs/guides/storage/security/access-control
- Supabase Google Auth: https://supabase.com/docs/guides/auth/social-login/auth-google

## Regras

- Nao aplicar este SQL em producao.
- Nao copiar dados reais para este diretorio.
- Nao salvar `service_role`, URL secreta, tokens Google ou credenciais Cloudflare/Supabase.
- Criar migrations reais somente depois de escolher projeto Supabase, ambiente e estrategia de schema.
- Toda tabela exposta precisa de RLS antes de qualquer uso por cliente autenticado.
- `service_role` fica somente no servidor e em tarefas administrativas controladas.
- Buckets de CRM, contratos, importacoes e backups devem ser privados.
- A autorizacao de administrador deve usar tabela propria (`crm_user_profiles`), nao metadados editaveis do usuario.
