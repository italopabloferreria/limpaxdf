# Tarefa ativa

## ID

`S01-SUPABASE-PREP-01`

## Objetivo

Preparar a migração futura do CRM Limpax para Supabase PostgreSQL, Auth Google, RLS, Storage privado, backup externo e exportação de dados, sem conectar projeto real e sem alterar o D1/R2 atual.

## Motivo

O G13 local do CRM está pronto para validação remota, mas o usuário definiu Supabase como direção alvo para tirar a empresa de planilhas e evoluir o CRM. Antes de qualquer credencial, migração ou cutover, o projeto precisa de um pacote seguro de preparação para evitar gasto de tokens e decisões improvisadas.

## Escopo permitido

- documentar mapeamento D1/R2 → Supabase PostgreSQL/Storage;
- rascunhar schema PostgreSQL, papéis, RLS e políticas de Storage;
- registrar plano de execução, backup, exportação, rollback e validação;
- atualizar handoff, estado `.icbai/` e roadmap;
- manter Cloudflare/D1/R2 intactos até cutover futuro aprovado.

## Fora do escopo

- criar projeto Supabase;
- salvar URL, anon key, service role, tokens Google ou credenciais reais;
- aplicar SQL em banco remoto;
- migrar dados reais;
- habilitar login Google no app;
- trocar o adapter do CRM;
- alterar DNS, domínio, deploy ou ambiente publicado.

## Critérios de aceite

- pacote `docs/supabase/` contém README, mapeamento, plano operacional e rascunho SQL;
- todo dado não confirmado continua como `[VALIDAR]` ou decisão pendente;
- RLS fica planejado para todas as tabelas expostas;
- `service_role` permanece proibido no cliente;
- Storage privado, backup/exportação e rollback ficam explícitos;
- G13 continua aberto e separado da preparação Supabase.

## Estado

`prepared-docs-only` — pacote Supabase preparado em documentação e rascunho técnico. Nenhuma conexão, migration, deploy, credential ou dado real foi usado.

## Próximo passo

Escolher projeto/região/plano Supabase, confirmar e-mails dos administradores, confirmar callbacks Google, decidir destino externo de backup e só então criar um ambiente de homologação vazio para transformar o rascunho em migrations reais.
