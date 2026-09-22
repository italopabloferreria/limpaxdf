# Roadmap real do LIMPAX

Este roadmap organiza dependências; não promete prazo. `docs/CURRENT_TASK.md` contém sempre uma única tarefa executável.

| Ordem | Fase | Dependência e saída |
| --- | --- | --- |
| **Estamos aqui** | G13 — base existente | Lint confiável, QA autenticado, migrações locais/upgrade, backup e restauração. Saída: Release Gate da base com evidência. |
| 1 | Plano de migração Supabase | Depende da base estável. Mapeamento D1→Postgres e R2→Storage, RLS, adapters, dry run, reconciliação, rollback e custo. |
| 2 | Migração reversível | Projeto Supabase da empresa, schema/RLS/Storage testados, cópia de dados sintéticos, dual-read controlado se necessário, cutover só após aceite. |
| 3 | Google Login e papéis | Supabase Auth, allowlist/perfis internos, dois admins e atendente; revogação e último admin testados. |
| 4 | Shell e sidebar | Navegação compacta por permissão; dashboard, atendimentos e clientes primeiro. Não criar links falsos para módulos inexistentes. |
| 5 | Importador Excel/CSV/Sheets | Amostra anonimizada, mapeamento, preview, deduplicação, lote idempotente, relatório e rollback. |
| 6 | Comercial e orçamentos | Oportunidades, funil, próxima ação, propostas versionadas, ganho/perda e WhatsApp `wa.me`. |
| 7 | Contratos e documentos | Modelos DOCX, variáveis, revisão, versões, PDF e cópias opcionais no Drive. |
| 8 | Agenda e operação | Compromissos, OS, equipes, veículos LXP-01–03, conflitos, fotos e execução. |
| 9 | Google Calendar, Maps e Gmail | Agenda CRM→Calendar, endereços/rotas/ETA e envio de documentos com histórico. Bidirecional fica posterior. |
| 10 | Frota e rastreamento | Cadastro/alocação → mapa → posição/ETA → histórico/geofence. Avaliar Life360/API, celular dedicado e GPS físico sem rastreamento improvisado. |
| 11 | Financeiro | Contas a receber, parcelas, parcial, estorno, inadimplência e métricas reconciliáveis. PIX/gateway é decisão posterior. |
| 12 | Fiscal | Somente após identificar emissor, município, certificado, contador e homologação. |
| 13 | Produção e monitoramento | Domínio próprio, backups, alertas, runbooks, treinamento, smoke real e rollback. |

## Por que essa ordem

G13 evita transportar defeitos e estados ambíguos. Supabase precede módulos densos para que Auth, RLS, Storage e PostgreSQL sejam a base desses módulos. Login precede sidebar por permissão. Importação precede comercial porque revela a estrutura real dos dados. Operação depende de clientes/comercial/documentos; integrações Google dependem da agenda e dos documentos internos. Financeiro e fiscal ficam depois por exigirem regras empresariais e maior risco.

O site institucional pode continuar evoluindo de forma independente quando houver tarefa própria, mas não deve interromper a sequência operacional acima.
