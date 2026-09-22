# Mapeamento de gates — evidências herdadas
Escopo de aprovação: site existente e desenho dos lotes CRM, não implementação completa de módulos futuros.

| Fase/gate | Estado | Evidência e limites |
|---|---|---|
| Intake/G0 | passed | PROJECT_PROFILE: tipo, objetivo, resultado, restrições |
| Discovery/G1 | passed | docs/crm/00 e 01: problema planilhas, atores, objetivo/aceites; [VALIDAR] identifica hipóteses |
| Process/G1B | passed | docs/crm/01 e 03: atendente/dois admins, entrada→atendimento→operação, dores e fluxo alvo; detalhes fiscais futuros |
| Strategy/G2 | passed | docs/01, docs/crm/01: valor, escopo, CTA Check e limites |
| Product/G2B | passed | docs/crm/01,02,05: casos, entidades, lotes e aceites |
| Experience/G3 | passed | docs/02 e docs/crm/03: jornadas/sitemap/estados; aprovação herdada da direção existente, não QA das telas novas |
| Copy/G4 | passed | docs/01,02 e lib/content.ts: hierarquia, CTA, fatos e [VALIDAR] |
| Creative/G5 | passed | docs/01,02, tokens, componentes e assets existentes: direção visual/tipo/cor preservada; não solicitar novo design |
| Technical/G7 | passed | docs/03,04, package/hosting/schema: stack, componentes, fronteiras e deploy já implementados |
| Data/G8 | in-progress | Entidades/migrações existem; lifecycle dos novos cadastros/auditoria e isolamento review/live não fechados. PRIMEIRO gate incompleto |
| Security/G9 | in-progress | Regras em docs/crm/01; lacunas A01–A03 precisam modelo de auth/ameaças e verificações coerentes |
| Analytics/G10 | in-progress | Eventos/consentimento existentes; indicadores CRM reconciliáveis e exclusão de revisão incompletos |
| SEO/G10B | passed | Metadados, sitemap, serviços/intenção; noindex deliberado durante revisão, ativação pública condicionada a dados reais |
| Performance/G10C | ready | Otimizações presentes; falta orçamento mensurável e método documentados para CRM |
| Accessibility/G10D | ready | Semântica/motion existentes; completar estratégia CRM teclado/foco/contraste/erros antes do gate, depois testar |
| Plan/G11 | blocked | Plano incremental criado; depende dos pre-code pendentes, não libera código por existir arquivo |
| Implementation/G12 | blocked | Código pré-existente parcial; próximo incremento ainda sem G11 |
| Verification/G13 | blocked | Matriz preenchida, resultado FAIL; testes parciais não compensam P1 |
| Deployment/G14 | blocked | Deploy privado histórico não aprova nova release; falta migração/backup/smoke |
| Growth/G15 | deferred | Após lançamento e baseline |

“passed” de planejamento não significa “implementado/testado/publicado”. Manter proveniência dos resultados e reabrir somente gates afetados por mudança real de escopo.

## Revisão após continuação — 16/09/2026
A tabela acima é a fotografia da auditoria inicial. Estado atual: G8 passado por DATA_MODEL (relações, migrações, autorização e lifecycle); G9 por SECURITY_MODEL (fronteiras, regras, segredos, ameaças); G10 por ANALYTICS_PLAN (KPIs, eventos, conversão, privacidade); G10C por PERFORMANCE_BUDGET (metas, riscos, método); G10D por ACCESSIBILITY_PLAN (teclado/foco, contraste, movimento, semântica). Estes são passes de planejamento, não atestados de operação real.
G11 passou para o incremento A01/A02: dependências pre-code satisfeitas, tarefas e testes em ACCESS_INCREMENT/IMPLEMENTATION_PLAN, rollback sem schema. G12 desse incremento passou com 28 testes totais, TypeScript e build; dívida de lint preexistente registrada. G13 permanece FAIL. Próximo incremento A03, sem refazer fases herdadas.
