# Retomada incremental — sem reescrita
Status: planejamento pre-code concluído para acesso; G11 aprovado no ACCESS_INCREMENT. A01/A02 implementados e verificados localmente; continuar por A03. Não interpretar isso como conclusão do CRM.
Não começar pelo importador enquanto acessos e cadastros estiverem inconsistentes.

## Etapa 0 — concluir planejamento técnico pendente
1. DATA_MODEL: acrescentar ao modelo existente lifecycle por entidade, arquivamento/expurgo, vínculos, auditoria e separação revisão/live; prazo de retenção permanece [VALIDAR].
2. SECURITY_MODEL: uma política servidor SSR/API, DB como fonte de revogação, bootstrap controlado por ambiente, negativa em erro; admin versus atendente e invariante de último admin.
3. ANALYTICS_PLAN: métricas operacionais derivadas de dados consistentes, eventos sem PII e sem contaminar por revisão.
4. PERFORMANCE_BUDGET e ACCESSIBILITY_PLAN: limites mensuráveis/método, teclado/foco/erros/contraste/reduced-motion.
Conferir critérios G8–G10D; então revisar e liberar G11. Não repetir UX, marca ou arquitetura.

## Etapa 1 — autorização coerente (A01)
Unificar acesso às duas páginas e APIs, antes de consultas de PII; diferenciar não autenticado, negado e indisponibilidade.
Testes relevantes: usuário apenas DB; ambiente+inativo; papel rebaixado; perfil inválido; DB falha; sem identidade; atendente/admin; ausência de perfil sob bootstrap documentado. Nenhum dado carregado antes da autorização.
Rollback: diff pequeno de auth/duas páginas/testes, sem schema; não usar rollback para reexpor dados — manter CRM indisponível se necessário.

## Etapa 2 — permissões e invariantes (A02/A03)
Restringir exclusões segundo matriz; assegurar que sempre reste admin elegível mesmo sob concorrência. Alinhar bootstrap antes da contagem de perfis.
Testar negativas sem mutação, histórico, dois requests concorrentes, alteração do próprio e de outro admin.
Se schema necessário, criar migração nova; não editar migrações publicadas. Backup antes da aplicação remota, ensaio local, recuperação documentada.

## Etapa 3 — jornadas (A04/A05)
Consumir selected na abertura do CRM com busca autorizada por ID, inclusive fora da página inicial. Implementar seletor de vínculo reutilizando APIs. Evitar stale responses e recalcular listagem/totais após mutações.
Testar navegação cliente→lead, vincular/desvincular, pesquisa vazia/erro, requests atrasados e troca de seleção.

## Etapa 4 — integridade e lifecycle (A06/A08)
Aplicar política de dados da etapa 0; compatibilidade do endpoint status com histórico; idempotência tarefas onde necessário; validação de datas/documentos sem perda silenciosa.
Dados sintéticos; testar referências e retries. Não executar expurgo em dados reais durante desenvolvimento.

## Etapa 5 — Quality Gate (G13)
Rodar testes relevantes + tsc + build + lint de escopo definido. QA autenticado desktop/mobile/teclado, RBAC negativo, migrar banco local vazio e upgrade, verificar anexos/consentimento.
Medir performance, testar estados de rede/erro, preparar backup/restauração e monitoramento. Atualizar RELEASE_MATRIX com evidência; pendências críticas mantêm FAIL.
Deployment apenas depois do gate; usar mesmo projeto/audiência e não presumir publicação pública autorizada pelo fim do lote.

## Demais lotes preservados
Excel/CSV → comercial/WhatsApp → contratos → agenda/OS → financeiro/gestão → fiscal confirmado/homologado → lançamento.
Critérios completos permanecem em docs/crm/05-PLANO-E-STATUS.md. Não prometer entrega desses módulos pela conclusão das etapas de correção acima.

## Regra de economia de contexto
Cada etapa registra arquivos, testes/resultados, pendências e próximo passo no PROJECT_STATE e no plano CRM. Conferir diff desde baseline antes de reutilizar evidência. Reabrir somente arquivos necessários, sem reler conversas ou reconstruir specs por rotina.
