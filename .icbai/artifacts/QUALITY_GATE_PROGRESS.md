# G13 — progresso do Release Gate

Data: 22/09/2026. Estado: **parcial; lint concluído, QA autenticado ainda pendente**.

## Linha de base automatizada

- `npm run lint`: PASS, zero erros e zero avisos. `.sites-runtime/**` foi excluído por ser artefato gerado; nenhuma regra foi desligada globalmente.
- Oito suítes: PASS, 47/47 testes.
- `npx tsc --noEmit --incremental false`: PASS.
- `npm run build`: PASS.
- `git diff --check`: PASS; somente avisos de normalização LF/CRLF do Git.

## Evidência visual já obtida

- `/crm` foi inspecionado em desktop e em 390 × 844 com dados sintéticos.
- A correção responsiva eliminou rolagem horizontal e manteve indicadores, lista e detalhe legíveis.
- O primeiro `Tab` alcança “Pular para o conteúdo”.
- `/crm/clientes` permaneceu legível em 390 × 844.
- O diálogo “Novo cliente” recebeu foco inicial; `Escape` fechou e devolveu o foco ao acionador.

## Ainda pendente

- Jornada completa por teclado e mensagens de erro.
- Ciclo arquivar/restaurar no navegador e validação visual do estado arquivado.
- Validação remota de migrações, ambiente e deploy em etapa autorizada posterior.

## QA autenticado — lote 1

- PASS: criação e conclusão de tarefa em atendimento sintético.
- PASS: criação de nota e atualização do histórico.
- PASS: criação de cliente sintético com contato e local.
- PASS: vínculo do atendimento ao cliente, contato e local; histórico exibiu o atendimento e seu deep link.
- Defeito corrigido: dois envios concorrentes podiam duplicar uma nota. Um guard síncrono de mutação foi adicionado e um clique duplo passou a gerar uma única ocorrência.
- PASS: `npm run qa:recovery` criou backup e restauração isolada, comparou hashes de 14 arquivos e aprovou `PRAGMA integrity_check` no banco restaurado, com 16 tabelas.

Esta evidência não autoriza deploy nem transforma o G13 em PASS.
