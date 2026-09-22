# Modelo de dados — complemento G8
16/09/2026. Decisão de engenharia para evolução incremental; implementação destas regras é verificada por lote, não por existência deste documento.

## Entidades e relações
Preservar db/schema.ts, drizzle/0000–0003 e docs/crm/02-DADOS-E-MIGRACAO.md. Leads → atividades/tarefas/anexos/outbox; cliente → contatos/locais; lead_customer_links liga demanda a cliente e opcionais contato/local; profiles identifica papel/ativo; audit registra ações. Não criar outro banco nem reimportar leads.

## Ciclo de vida por grupo
| Dados | Regra de evolução |
|---|---|
| Leads, tarefas, atividades e anexos | Preservar retenção configurada e relações; futura exclusão deve apagar PII em D1/R2 com retomada idempotente e log mínimo de resultado |
| Clientes, contatos e locais | Arquivar/restaurar cliente mantém histórico, exige admin e gera auditoria; cliente arquivado bloqueia novos vínculos e fica somente para consulta. Exclusão definitiva permanece condicionada à análise de referências. Não tratar arquivar como atender pedido de expurgo |
| Vínculos | Confirmar pertencimento de contato/local; remoção do vínculo não apaga lead nem cliente |
| Profiles | Desativação preserva identidade do autor. Perfil existente prevalece sobre ambiente; ausência pode usar allowlist explícita. Não excluir perfil para revogar acesso |
| Auditoria | Guardar identificador, ação, autor e momento; minimizar snapshots com PII. Expurgo futuro deve pseudonimizar dados pessoais conforme política aprovada sem apagar rastreabilidade operacional necessária |
| Outbox | Manter idempotência; não reenviar dados depois de expurgo. Falhas de R2/D1 precisam recuperação |
| Events/rate_limits | Agregados sem identidade e buckets expiráveis; sem documentos/telefones em eventos |

Prazo por categoria, exceções documentais e responsável: [VALIDAR] antes de operação real. Não inferir prazo legal. Até lá, revisão privada com dados sintéticos; este incremento não executa expurgo.

## Origem e ambientes
Migração 0004 implementa classificação explícita review/live e origem/import_batch. Existentes sem evidência ficam review/unknown e nunca são promovidos em massa a live. O vínculo impede mistura review/live e o seletor filtra pelo modo do atendimento. Métricas reais ainda precisam excluir revisão e histórico importado como novas conversões; aplicação remota da migração e essas consultas permanecem bloqueios de lançamento.

## Autorização e migrações
D1 sem RLS: toda consulta de negócio após autorização servidor. Contas compartilham dados de uma empresa; não é multi-tenant.
Migração aplicada é imutável. Incremento A01/A02 não altera schema: exige tabela profiles já criada pela 0003. Banco sem tabela retorna indisponibilidade; nunca fallback por erro.
Para futuras migrações: testar banco vazio e upgrade com fixtures, backup antes de remoto, verificar FK/contagens, restauração ensaiada. Não há migração remota autorizada como efeito colateral.
G8 planejamento satisfeito; A06a e A06b implementados localmente. Integridade A08, aplicação remota da migração e política operacional [VALIDAR] permanecem backlog e bloqueio G13.
