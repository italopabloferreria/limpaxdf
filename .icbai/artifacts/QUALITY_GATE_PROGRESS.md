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
- Fluxos mutáveis autenticados: tarefas, notas, vínculo/desvínculo e ciclo de clientes.
- Ensaio local de backup/restauração.
- Validação remota de migrações, ambiente e deploy em etapa autorizada posterior.

Esta evidência não autoriza deploy nem transforma o G13 em PASS.
