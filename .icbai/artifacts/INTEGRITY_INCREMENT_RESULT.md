# A08 — integridade de status, tarefas e validações

Data: 2026-09-21. Estado: **PASS local do incremento**. G13 permanece FAIL.

## Resultado

- O endpoint legado `POST /api/crm/status` mantém autenticação bearer e escopo `live`, mas agora atualiza `updated_at` e grava a mudança no histórico do lead na mesma operação atômica.
- A criação de tarefas exige `Idempotency-Key` UUID. Repetir a mesma chave e conteúdo retorna a tarefa existente; reutilizar a chave com conteúdo diferente retorna 409. A interface gera uma chave por envio.
- A migração `0005_task_idempotency` acrescenta `idempotency_key`, `request_hash` e índice único por lead/chave, sem alterar tarefas existentes.
- Datas operacionais exigem ISO com fuso e rejeitam calendários impossíveis, como 30 de fevereiro.
- Documento fiscal vazio continua opcional; texto não vazio sem CPF/CNPJ válido deixa de ser convertido silenciosamente em ausência.

## Evidência

- TDD: teste novo falhou antes da implementação por ausência dos serviços; depois, 3/3 casos A08 passaram.
- Regressão: 47/47 testes passaram — negócio 16, acesso 15, deep link 2, seleção 2, vínculo 5, lifecycle 2, lifecycle de cliente 2 e integridade 3.
- `npx tsc --noEmit --incremental false`: PASS.
- Lint focalizado dos novos módulos de produção e rotas: PASS.
- `npm run build`: PASS.
- Preview local: migrações 0003–0005 aplicadas apenas ao D1 local; conta fictícia `seedy@sites.test` autorizada somente no banco local; `/crm/clientes` aberto como Administrador.

## Limites

- Nenhuma migração remota e nenhum deploy foram executados.
- Lint global, QA responsivo/teclado e ensaio de backup/restauração continuam pendentes no G13.
- Dados reais, retenção, contas reais e informações oficiais continuam sujeitos às confirmações já registradas.

## Próximo passo

Executar o incremento de Quality Gate: reduzir a dívida de lint que afeta os workspaces, validar o CRM autenticado em desktop/mobile/teclado e ensaiar migração/recuperação local antes de qualquer publicação.
