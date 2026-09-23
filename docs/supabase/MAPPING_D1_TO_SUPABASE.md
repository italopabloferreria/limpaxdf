# Mapeamento D1/R2 para Supabase

Estado: **planejado; nao executado**.

## Decisao alvo

| Atual | Alvo Supabase | Observacao |
| --- | --- | --- |
| D1/SQLite | PostgreSQL | Converter `integer` timestamps para `bigint` inicialmente, preservando semantica atual em milissegundos. Avaliar `timestamptz` em etapa posterior. |
| R2 privado | Supabase Storage privado | Buckets separados por finalidade. Caminhos e metadados ficam em tabelas do CRM; arquivos continuam privados. |
| Identidade Sites + allowlist | Supabase Auth Google + `crm_user_profiles` | Google autentica; perfil interno autoriza. Usuario autenticado sem perfil ativo nao entra. |
| `crm_user_profiles.email` | `crm_user_profiles.user_id` + `email` | `user_id` referencia `auth.users(id)` quando a conta for vinculada. `email` continua para bootstrap e auditoria. |
| APIs atuais | APIs preservadas com adapter | A UI deve falar com contratos existentes durante a transicao. Nao trocar tudo por chamadas diretas do browser. |
| Exportacao atual | Exportacao admin controlada | CSV/JSON/XLSX futuro com neutralizacao de formulas e trilha de auditoria. |

## Tabelas da base atual

| D1 | Supabase | Migracao |
| --- | --- | --- |
| `leads` | `public.leads` | Preservar UUID, sequencia, payload JSON, status, modo, origem, upload e idempotencia. |
| `outbox` | `public.outbox` | Preservar tentativas, lease, erro e entrega. Pode virar fila/cron depois. |
| `attachments` | `public.attachments` + Storage | `object_key` passa a apontar para bucket privado Supabase. |
| `rate_limits` | `public.rate_limits` | Pode continuar server-side; nao expor no browser. |
| `events` | `public.events` | Agregados sem PII; manter RLS restrita a admin/attendant. |
| `service_records` | `public.service_records` | Base futura para recorrencia/OS. |
| `lead_activities` | `public.lead_activities` | Historico operacional. |
| `crm_tasks` | `public.crm_tasks` | Manter idempotencia por lead + key. |
| `crm_user_profiles` | `public.crm_user_profiles` | Autoridade interna de papeis. |
| `customers` | `public.customers` | Cadastro mestre. |
| `customer_contacts` | `public.customer_contacts` | Contatos por cliente. |
| `service_locations` | `public.service_locations` | Locais de atendimento. |
| `lead_customer_links` | `public.lead_customer_links` | Vinculo atendimento -> cliente/contato/local. |
| `crm_audit_log` | `public.crm_audit_log` | Auditoria append-only. |

## Buckets privados previstos

| Bucket | Conteudo | Observacao |
| --- | --- | --- |
| `lead-uploads` | Fotos opcionais do Limpax Check | Substitui R2 para anexos de leads. |
| `imports` | Planilhas Excel/CSV de importacao | Retencao curta e relatorio de erros. |
| `templates` | Modelos DOCX de contrato/documento | Acesso admin. |
| `generated-documents` | PDFs/DOCX gerados | Vinculados a cliente/oportunidade futura. |
| `backups` | Exportacoes e snapshots operacionais | Destino definitivo e retencao `[VALIDAR]`; pode ser storage externo fora do Supabase. |

## Politica de acesso alvo

| Papel CRM | Leitura | Escrita |
| --- | --- | --- |
| `admin` | Tudo do CRM | Tudo, exceto operacoes destrutivas sem auditoria. |
| `attendant` | Leads, clientes, contatos, locais, tarefas e historico operacional | Mutacoes de atendimento e cadastro operacional; sem deletar definitivo, usuarios ou configuracoes. |
| sem perfil ativo | Nenhum dado CRM | Nenhuma mutacao. |

## Pontos que exigem validacao

- Regiao do projeto Supabase `[VALIDAR]`.
- Conta/organizacao proprietaria do Supabase `[VALIDAR]`.
- Plano Free/Pro para producao `[VALIDAR]`.
- Destino externo de backup completo `[VALIDAR]`.
- Periodicidade de backup e retencao `[VALIDAR]`.
- Dominios e callbacks Google `[VALIDAR]`.
- Se D1/R2 ficam como fallback temporario apos cutover `[VALIDAR]`.
