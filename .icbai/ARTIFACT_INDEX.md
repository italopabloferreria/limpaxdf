# Índice e ordem de leitura
1. PROJECT_PROFILE.json — escopo, classificação e restrições.
2. PROJECT_STATE.json — gates, bloqueios e próxima ação.
3. artifacts/AUDIT.md — estado real, inventário, classificação e problemas.
4. artifacts/GATE_EVIDENCE.md — critérios reaproveitados e lacunas.
5. artifacts/IMPLEMENTATION_PLAN.md — incrementos ordenados e verificações.
6. artifacts/RELEASE_MATRIX.md — evidência de qualidade; lançamento reprovado.
7. FLOW.md, DECISIONS.md e OPEN_QUESTIONS.md — fluxo e decisões.
8. ../AGENTS.md, ../docs/AI_HANDOFF.md e ../docs/CURRENT_TASK.md — protocolo multiagente e tarefa única.
9. ../docs/ROADMAP.md e ../docs/SUPABASE_MIGRATION_PLAN.md — dependências futuras e transição alvo.
10. ../docs/AGENT_RESUME_PROMPT.md — prompt copiável para Codex, Copilot, Antigravity e outros agentes.

## Fontes existentes preservadas
- ../docs/01-brand-source-of-truth.md: marca e identidade.
- ../docs/02-product-experience-spec.md: experiência, jornadas e sitemap.
- ../docs/03-codex-master-implementation-brief.md: implementação, requisitos e arquitetura.
- ../docs/04-operacao-apis-crm.md: APIs/integrações/operação; alguns trechos históricos precisam atualização.
- ../docs/05-validacao.md: verificações anteriores do site, não certificação do CRM novo.
- ../docs/crm/01-ESCOPO-E-PERMISSOES.md: papéis, módulos e aceites.
- ../docs/crm/02-DADOS-E-MIGRACAO.md: modelo e migração planejados.
- ../docs/crm/03-FLUXOS-E-INTERFACE.md: UX operacional e estados.
- ../docs/crm/04-DOCUMENTOS-E-INTEGRACOES.md: contratos, WhatsApp e fiscal.
- ../docs/crm/05-PLANO-E-STATUS.md: lotes e histórico; auditoria atual prevalece quanto ao estado comprovado.
- ../docs/crm/06-HANDOFF-ANTIGRAVITY.md: histórico da transferência; não ponto de partida atual.

Não duplicar as specs existentes em dezenas de documentos vazios. Os gates herdados apontam para essas fontes. Alterações de produto exigem atualizar a fonte correspondente e este estado.

## Complementos da retomada
- artifacts/DATA_MODEL.md, SECURITY_MODEL.md, ANALYTICS_PLAN.md, PERFORMANCE_BUDGET.md e ACCESSIBILITY_PLAN.md: evidência pre-code.
- artifacts/ACCESS_INCREMENT.md: escopo A01/A02 e revisão G11.
- artifacts/ACCESS_INCREMENT_RESULT.md: reprodução, correção e testes; próximo A03.
- artifacts/ADMIN_INVARIANT_RESULT.md: invariante atômica do último administrador.
- artifacts/CRM_SELECTION_RESULT.md: deep link e proteção contra respostas atrasadas.
- artifacts/LEAD_CUSTOMER_LINK_RESULT.md: busca, vínculo e desvínculo de cliente no atendimento.
- artifacts/LIFECYCLE_PARTITION_RESULT.md: classificação review/live, origem e bloqueio de vínculos cruzados.
- artifacts/CUSTOMER_LIFECYCLE_RESULT.md: arquivamento/restauração auditáveis e visões ativas/arquivadas.
- artifacts/INTEGRITY_INCREMENT_RESULT.md: compatibilidade de status, idempotência de tarefas e validações estritas da A08.
- artifacts/QUALITY_GATE_PROGRESS.md: QA autenticado desktop/mobile/teclado, correção responsiva e pendências do G13.
- ../scripts/test-crm-network.mjs e ../tests/crm-network-fixture.tsx: QA sintético de rede/retry do `CrmWorkspace` em navegador local, sem dados reais.
- ../scripts/test-customer-network.mjs e ../tests/customer-network-fixture.tsx: QA sintético de rede/retry do `CustomerWorkspace` em navegador local, sem dados reais.
- artifacts/REMOTE_G13_RUNBOOK.md: sequência segura para validação remota, backup, restauração, smoke, performance e rollback do G13.
- artifacts/REMOTE_G13_EVIDENCE_TEMPLATE.md: template para registrar evidências remotas sem segredos ou dados reais.
- artifacts/HANDOFF_AUDIT_2026-09-22.md: auditoria de retomada, divergências e evidência atual.

## Preparação Supabase
- ../docs/supabase/README.md: pacote de preparação Supabase; nenhuma migração executada.
- ../docs/supabase/MAPPING_D1_TO_SUPABASE.md: mapeamento D1/R2 para Supabase PostgreSQL/Storage.
- ../docs/supabase/EXECUTION_PLAN.md: sequência segura de homologação, backup/exportação e cutover.
- ../docs/supabase/SCHEMA_RLS_DRAFT.sql: rascunho PostgreSQL/RLS/Storage para revisão, não produção.
