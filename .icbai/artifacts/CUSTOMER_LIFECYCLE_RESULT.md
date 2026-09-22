# Incremento A06b — arquivamento e restauração de clientes

Data: 21/09/2026
Gate: G12_INCREMENT_VERIFIED
Estado: PASS local

## Entrega

- Administradores podem arquivar e restaurar clientes sem excluir contatos, locais, vínculos ou histórico.
- Cada transição grava auditoria com ação, autor e momento.
- Repetir a mesma transição retorna conflito e não duplica auditoria.
- Atendentes e requisições com origem inválida são recusados antes da mutação.
- A tela de clientes separa “Ativos” e “Arquivados”; a visão arquivada é exclusiva de administradores.
- Cadastros arquivados ficam somente para consulta até serem restaurados.
- A listagem operacional usa o modo `review/live` calculado no servidor.

## Evidência

- TDD vermelho observado antes da implementação.
- Testes de lifecycle de cliente: PASS 2/2.
- Suíte de acesso ampliada: PASS 15/15.
- Regressão consolidada: PASS 44/44.
- TypeScript: PASS `npx tsc --noEmit`.
- Lint focalizado do novo serviço, rota, página e testes: PASS.
- Build de produção: PASS `npm run build`.

## Limites

- A migração 0004 permanece local; nenhum banco remoto foi alterado.
- QA autenticado no browser, mobile e teclado ainda está pendente.
- Débitos de lint anteriores permanecem em `customer-workspace.tsx`, `crm-workspace.tsx`, `lib/crm-customers.ts` e partes legadas.
- Prazo de retenção e expurgo continuam [VALIDAR]; nenhum dado real foi apagado.

## Próximo passo

A08: compatibilizar endpoints legados com o histórico atual, reforçar idempotência de tarefas e validar datas/documentos sem perda silenciosa.
