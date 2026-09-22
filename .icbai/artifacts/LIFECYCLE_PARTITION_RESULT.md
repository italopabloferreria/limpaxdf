# Incremento A06a — partição review/live e origem

Data: 17/09/2026
Gate: G12_INCREMENT_VERIFIED
Estado: PASS local

## Entrega

- Migração `0004_faulty_thanos.sql` adiciona classificação `source_mode`, `origin` e `import_batch` aos clientes e origem/lote aos leads.
- Clientes existentes recebem apenas os defaults conservadores `review/unknown`; nenhum registro é promovido para `live`.
- Novos leads do formulário usam origem `public_check`; novos clientes manuais usam origem `manual` e o modo operacional calculado no servidor.
- Busca do vinculador filtra clientes pelo mesmo modo do atendimento.
- API de vínculo rejeita mistura entre dados `review` e `live`, além das validações de pertencimento já existentes.
- Índices de modo/origem foram incluídos para filtros e métricas futuras.

## Evidência

- TDD vermelho observado: 2/2 falhas antes da política e da migração.
- Testes A06a: PASS 2/2.
- Regressão consolidada: PASS 41/41.
- TypeScript: PASS `npx tsc --noEmit`.
- Lint focalizado do novo código e endpoints alterados: PASS. `lib/crm-customers.ts` conserva dívida anterior fora das linhas A06a.
- Build de produção: PASS `npm run build`.

## Limites

- Migração gerada localmente, sem aplicação remota.
- Política de prazo de retenção permanece [VALIDAR]; nenhum expurgo foi executado.
- Arquivamento operacional de cliente, idempotência adicional e compatibilidade dos endpoints legados ainda fazem parte de A06/A08.
- QA autenticado no browser, recuperação e lint global continuam pendentes para G13.

## Próximo passo

A06b: completar o lifecycle de cliente com arquivamento/restauração auditáveis e garantir que consultas operacionais excluam revisão onde apropriado, antes de avançar para o importador.
