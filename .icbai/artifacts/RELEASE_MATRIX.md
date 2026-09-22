# Quality Gate — baseline da auditoria
Data: 2026-09-21. Resultado: **FAIL — não liberar nova versão como produção pronta**.
Escopo: site + CRM local até A06b; sem deploy novo.
PASS de teste unitário não equivale a PASS do fluxo operacional.

| Dimensão | Estado | Evidência / ação |
|---|---|---|
| Aceites funcionais | PASS local | A01–A08 e as jornadas operacionais do incremento passam localmente; módulos futuros e validação remota não fazem parte deste aceite local |
| Testes existentes | PASS | 47/47: negócio 16, acesso 15, deep link 2, estado/concorrência de tela 2, vínculo 5, lifecycle 2, lifecycle de cliente 2 e integridade 3; não substitui QA no browser |
| TypeScript | PASS | tsc --noEmit --incremental false executado após correções; exit 0 |
| Build | PASS | npm run build executado após correções; exit 0. Wrapper da skill falhou na resolução do npm; comando do projeto aprovado |
| Lint | PASS | `npm run lint` termina com zero erros e zero avisos; somente artefatos gerados são ignorados |
| Erros/empty/retry | WARNING | Intake e tarefa idempotente testados; clique duplo de nota foi reproduzido, corrigido e revalidado; formulário vazio direciona foco e exibe mensagem nativa; falhas de rede e retry ainda pendentes |
| Persistência/formulários | PASS local | Tarefa, nota, cliente, vínculo, arquivamento e restauração passaram no navegador com dados sintéticos e relações preservadas |
| Responsividade | PASS local | `/crm` e `/crm/clientes` autenticados validados em desktop e 390 × 844; sem overflow horizontal, e o formulário longo mantém rolagem interna e ações alcançáveis |
| Navegadores/dispositivos | WARNING | Fluxos autenticados validados no navegador local integrado; cobertura cruzada de navegador permanece pendente |
| Acessibilidade | WARNING | Teclado passou em `/crm` e `/crm/clientes`; varredura local encontrou 0 falhas AA em 54 textos visíveis, mínimo 4,64:1; imagens/gradientes, estados fora do viewport e auditoria manual completa permanecem pendentes |
| Segurança | WARNING | A01–A03 e autorização A06b testados localmente; falta homologação autenticada e não houve pentest |
| Performance | WARNING | Servidor local aquecido respondeu quatro rotas em 62–117 ms; orçamento definido em PERFORMANCE_BUDGET; faltam Core Web Vitals e medição do ambiente publicado |
| SEO/AEO | WARNING | Noindex intencional para privado; ativação pública e dados/schema precisam validação |
| Analytics | WARNING | Consentimento/eventos presentes; métricas empresariais e reconciliação não implementadas |
| Privacidade | FAIL | Partição e arquivamento implementados localmente; retenção/expurgo e dados oficiais permanecem [VALIDAR] |
| Configuração de deployment | WARNING | Manifest/projeto existentes; aplicação remota 0003–0005 e ambiente live não comprovados |
| Monitoramento | WARNING | Health endpoint existente; agendamento/retries/alertas/operador não comprovados |
| Rollback e recuperação | WARNING | Backup/restauração local aprovado com hashes e integridade SQLite; recuperação remota e rollback de deploy permanecem pendentes |
| Fiscal/pagamento externo | NOT-APPLICABLE | Nenhum emissor/gateway implementado neste incremento; fiscal continua requisito futuro |
| IA em runtime/WebGL | NOT-APPLICABLE | Não há recursos runtime dessa natureza; imagens IA são assets |

Não marcar WARNING como concluído. Cada linha precisa evidência nova quando o código correspondente mudar. Sem credenciais, PII ou logs integrais nesta matriz.

Lint global certificado em 22/09/2026: PASS, zero erros e zero avisos, sem supressão global de regras.
