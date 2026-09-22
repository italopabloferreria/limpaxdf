# G13 — progresso do Release Gate

Data: 22/09/2026. Estado: **parcial; QA local e recuperação aprovados, ciclo arquivar/restaurar e validações remotas ainda pendentes**.

## Linha de base automatizada

- `npm run lint`: PASS, zero erros e zero avisos. `.sites-runtime/**` foi excluído por ser artefato gerado; nenhuma regra foi desligada globalmente.
- Oito suítes: PASS, 47/47 testes.
- `npx tsc --noEmit --incremental false`: PASS.
- `npm run build`: PASS.
- `git diff --check`: PASS; somente avisos de normalização LF/CRLF do Git.

## Evidência visual já obtida

- `/crm` foi inspecionado em desktop e em 390 × 844 com dados sintéticos.
- A correção responsiva eliminou rolagem horizontal e manteve indicadores, lista e detalhe legíveis.
- Em `/crm`, o primeiro `Tab` alcança “Pular para o conteúdo”; após o salto, a ordem observada foi marca, Clientes, Ver site, busca, status e primeiro atendimento.
- `/crm/clientes` permaneceu legível em 390 × 844. O primeiro `Tab` também alcança o link de salto e a ordem segue marca, Atendimentos, Ver site e Novo cliente.
- “Novo cliente” abre por teclado com foco inicial em Tipo. `Escape` fecha o diálogo e devolve o foco ao acionador.
- Submeter o formulário vazio não chamou a API: a validação nativa mostrou “Preencha este campo.” e moveu o foco para Nome ou razão social.
- Em 390 × 844, `/crm/clientes` não apresentou overflow horizontal. O diálogo “Novo cliente” ocupou a largura disponível, manteve rolagem interna e permitiu alcançar Cancelar e Salvar cliente.

## Ainda pendente

- Ciclo arquivar/restaurar no navegador e validação visual do estado arquivado.
- Cobertura cruzada de navegador e medição de produção.
- Validação remota de migrações, ambiente e deploy em etapa autorizada posterior.

## QA autenticado — lote 1

- PASS: criação e conclusão de tarefa em atendimento sintético.
- PASS: criação de nota e atualização do histórico.
- PASS: criação de cliente sintético com contato e local.
- PASS: vínculo do atendimento ao cliente, contato e local; histórico exibiu o atendimento e seu deep link.
- Defeito corrigido: dois envios concorrentes podiam duplicar uma nota. Um guard síncrono de mutação foi adicionado e um clique duplo passou a gerar uma única ocorrência.
- PASS: `npm run qa:recovery` criou backup e restauração isolada, comparou hashes de 14 arquivos e aprovou `PRAGMA integrity_check` no banco restaurado, com 16 tabelas.
- PASS: navegação principal por teclado em `/crm` e `/crm/clientes`, abertura/fechamento do diálogo e validação obrigatória sem criação de registro.

## QA local — contraste e tempo de resposta

- PASS local: varredura computada dos textos visíveis encontrou 0 falhas WCAG AA em 25 amostras de `/crm` e 29 de `/crm/clientes`, no viewport 818 × 912. Menor razão observada: 4,64:1.
- INFO local: em segunda rodada aquecida no servidor de desenvolvimento, `/`, `/check`, `/crm` e `/crm/clientes` responderam HTTP 200 entre 62 ms e 117 ms.
- Limite: a varredura não avalia pixels sobre imagens/gradientes nem estados fora do viewport; os tempos não são Core Web Vitals nem representam rede, cache e runtime de produção.

Esta evidência não autoriza deploy nem transforma o G13 em PASS.
