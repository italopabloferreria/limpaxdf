# Quality Gate — baseline da auditoria
Data: 2026-09-21. Resultado: **FAIL — não liberar nova versão como produção pronta**.
Escopo: site + CRM local até A06b; sem deploy novo.
PASS de teste unitário não equivale a PASS do fluxo operacional.

| Dimensão | Estado | Evidência / ação |
|---|---|---|
| Aceites funcionais | FAIL | A01–A08 passam localmente; QA operacional e demais módulos continuam pendentes |
| Testes existentes | PASS | 47/47: negócio 16, acesso 15, deep link 2, estado/concorrência de tela 2, vínculo 5, lifecycle 2, lifecycle de cliente 2 e integridade 3; não substitui QA no browser |
| TypeScript | PASS | tsc --noEmit --incremental false executado após correções; exit 0 |
| Build | PASS | npm run build executado após correções; exit 0. Wrapper da skill falhou na resolução do npm; comando do projeto aprovado |
| Lint | FAIL | A04b–A06b passam no lint focalizado. Workspaces e módulos legados mantêm erros preexistentes; corrigir sem ocultá-los |
| Erros/empty/retry | WARNING | Intake e criação idempotente de tarefa testados; formulários/concorrência no browser ainda não homologados por completo |
| Persistência/formulários | WARNING | Atomicidade intake e cadastros cobertos parcialmente; falta jornada UI→API→reabrir |
| Responsividade | WARNING | `/crm` autenticado validado em desktop e 390 × 844 após correção de overflow; `/crm/clientes` e formulários longos ainda pendentes |
| Navegadores/dispositivos | WARNING | Não há cobertura atual documentada para CRM |
| Acessibilidade | WARNING | Primeiro Tab de `/crm` alcança o skip link; jornada completa, dialogs, erros, contraste e `/crm/clientes` ainda pendentes |
| Segurança | WARNING | A01–A03 e autorização A06b testados localmente; falta homologação autenticada e não houve pentest |
| Performance | WARNING | Orçamento definido em PERFORMANCE_BUDGET; medições pendentes, build não mede experiência |
| SEO/AEO | WARNING | Noindex intencional para privado; ativação pública e dados/schema precisam validação |
| Analytics | WARNING | Consentimento/eventos presentes; métricas empresariais e reconciliação não implementadas |
| Privacidade | FAIL | Partição e arquivamento implementados localmente; retenção/expurgo e dados oficiais permanecem [VALIDAR] |
| Configuração de deployment | WARNING | Manifest/projeto existentes; aplicação remota 0003–0005 e ambiente live não comprovados |
| Monitoramento | WARNING | Health endpoint existente; agendamento/retries/alertas/operador não comprovados |
| Rollback e recuperação | WARNING | Rollback de versão não restaura dados; sem ensaio backup/restauração comprovado |
| Fiscal/pagamento externo | NOT-APPLICABLE | Nenhum emissor/gateway implementado neste incremento; fiscal continua requisito futuro |
| IA em runtime/WebGL | NOT-APPLICABLE | Não há recursos runtime dessa natureza; imagens IA são assets |

Não marcar WARNING como concluído. Cada linha precisa evidência nova quando o código correspondente mudar. Sem credenciais, PII ou logs integrais nesta matriz.

Lint focalizado novo (auth, páginas, gate, testes e runner): PASS. Rotas de contatos/locais e CustomerWorkspace preservam 10 erros anteriores (any, hooks e navegação). Lint global não foi certificado como aprovado; baseline anterior inclui gerados e não foi reexecutado nesta rodada. Sem supressão de regras.
