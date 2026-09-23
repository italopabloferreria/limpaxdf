# G13 — progresso do Release Gate

Data: 23/09/2026. Estado: **QA local ampliado e recuperação aprovados; validações remotas ainda pendentes**.

## Linha de base automatizada

- `npm run lint`: PASS, zero erros e zero avisos. `.sites-runtime/**` foi excluído por ser artefato gerado; nenhuma regra foi desligada globalmente.
- Oito suítes: PASS, 47/47 testes.
- `npx tsc --noEmit --incremental false`: PASS.
- `npm run build`: PASS.
- `npm run qa:crm-network`: PASS, 10/10 cenários sintéticos de rede do `CrmWorkspace`.
- `npm run qa:customer-network`: PASS, 5/5 cenários sintéticos de rede do `CustomerWorkspace`.
- `npm run qa:remote-checks`: PASS, 2/2 testes dos scripts remotos G13.
- `npm run qa:remote-evidence`: PASS, template sem achados no guardrail local.
- Smoke HTTP local: PASS para `/`, `/check`, `/crm` e `/crm/clientes`, todos com HTTP 200.
- `npm run qa:recovery`: PASS, 14 arquivos, 16 tabelas e contagens restauradas localmente.
- `npm run qa:preflight`: PASS para bindings e migrações; WARNING em comparação Git por `EPERM` no sandbox.
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

- Cobertura cruzada ampla de navegador e medição de produção.
- Validação remota de migrações, ambiente e deploy em etapa autorizada posterior.

## Preflight de release (somente leitura)

- `npm run qa:preflight`: PASS para bindings `DB`/`BUCKET`, journal e sequência das seis migrações D1 0000–0005; o relatório inclui SHA-256 de cada SQL para comparação futura.
- Git local: `origin/main` estava 7 commits atrás do HEAD local no ensaio inicial. Isso é comparação com upstream, não comprovação do commit publicado.
- Migrações remotas, backup, restauração e deploy permanecem `UNVERIFIED` no JSON. O comando não toca em dados remotos.
- `npm run qa:remote-readiness`: PASS de execução local fora do sandbox sem `FAIL`. Arquivos de estado, manifesto, journal, migrações, Node, npm, wrangler e Git passaram. HEAD `f86ecd05007ccf11f611060e4a7293b2fe29b71f`; `origin/main 0 9`. Os avisos restantes são árvore suja desta etapa e variáveis remotas ausentes. O comando não executa deploy, migração, DNS, importação ou leitura de dados reais.
- `.icbai/artifacts/REMOTE_G13_RUNBOOK.md`: criado para orientar a etapa remota com sequência segura, evidências obrigatórias, critérios de parada e estados finais possíveis. Não autoriza ação remota.
- `.icbai/artifacts/REMOTE_G13_EVIDENCE_TEMPLATE.md`: criado para coletar evidências remotas sem segredos, PII ou dumps. `.env.example` lista as variáveis remotas vazias necessárias para execução autorizada.
- `npm run qa:remote-evidence`: criado para varrer evidências remotas contra padrões óbvios de token, chave privada, e-mail, CPF, CNPJ e dump SQL antes de versionar ou compartilhar. Não substitui revisão humana.

## Identificação remota por leitura

- Sites: versão 3 publicada com status `succeeded`, commit `98c0bbf3590536b9b078f5ae0611302ae5fd8393` (16/09/2026); o HEAD local estava 11 commits à frente na consulta de 22/09/2026. Não houve novo deploy.
- D1 remoto `DB`: overview listou oito tabelas (`attachments`, `crm_tasks`, `events`, `lead_activities`, `leads`, `outbox`, `rate_limits`, `service_records`). Não foram lidas linhas nem dados de clientes.
- Esta evidência prova a diferença de versão e de estrutura visível; não prova quais migrações do journal foram aplicadas nem a integridade, backup ou capacidade de restauração remotos.

## QA autenticado — lote 1

- PASS: criação e conclusão de tarefa em atendimento sintético.
- PASS: criação de nota e atualização do histórico.
- PASS: criação de cliente sintético com contato e local.
- PASS: vínculo do atendimento ao cliente, contato e local; histórico exibiu o atendimento e seu deep link.
- Defeito corrigido: dois envios concorrentes podiam duplicar uma nota. Um guard síncrono de mutação foi adicionado e um clique duplo passou a gerar uma única ocorrência.
- PASS: `npm run qa:recovery` criou backup e restauração isolada, comparou hashes de 14 arquivos e aprovou `PRAGMA integrity_check` no banco restaurado, com 16 tabelas.
- PASS: navegação principal por teclado em `/crm` e `/crm/clientes`, abertura/fechamento do diálogo e validação obrigatória sem criação de registro.
- PASS: arquivar/restaurar no navegador com cliente sintético. A confirmação nativa foi substituída por diálogo acessível; cancelamento devolve o foco ao acionador e a restauração preservou contato, local e atendimento vinculado.

## QA local — contraste e tempo de resposta

- PASS local: varredura computada dos textos visíveis encontrou 0 falhas WCAG AA em 25 amostras de `/crm` e 29 de `/crm/clientes`, no viewport 818 × 912. Menor razão observada: 4,64:1.
- INFO local: em segunda rodada aquecida no servidor de desenvolvimento, `/`, `/check`, `/crm` e `/crm/clientes` responderam HTTP 200 entre 62 ms e 117 ms.
- Limite: a varredura não avalia pixels sobre imagens/gradientes nem estados fora do viewport; os tempos não são Core Web Vitals nem representam rede, cache e runtime de produção.

Esta evidência não autoriza deploy nem transforma o G13 em PASS.

## QA local — rede e retry do atendimento

- PASS local: falha de detalhe oferece retry e limpa o erro após recuperação.
- PASS local: falha de listagem oferece retry independente.
- PASS local: resposta perdida ao criar tarefa preserva título, data, responsável e reutiliza a mesma chave de idempotência no retry.
- PASS local: nota rejeitada preserva texto; refresh bem-sucedido de tarefa não apaga nota em edição.
- PASS local: resposta tardia de nota não limpa rascunho de outro atendimento selecionado.
- PASS local: payload editado e nova tarefa confirmada usam novas chaves.
- PASS local: texto editado durante envio de nota sobrevive ao refresh.
- PASS local: erro HTML/non-JSON exibe mensagem operacional sem apagar rascunho.
- PASS local: clicar novamente no mesmo atendimento com erro mantém o retry ativo.
- PASS local: voltar a um payload incerto de tarefa reutiliza a chave original.

Limite: o lote cobre `CrmWorkspace` com APIs interceptadas e dados sintéticos; ainda não valida rede real, banco remoto, autenticação remota nem Core Web Vitals de produção.

## QA local — rede e retry de clientes

- PASS local: falha de listagem oferece retry e mantém o detalhe atual.
- PASS local: falha de detalhe oferece retry; clicar no mesmo cliente não esconde o estado de erro.
- PASS local: falha ao criar contato preserva nome e telefone digitados.
- PASS local: falha ao criar local preserva identificação e endereço digitados.
- PASS local: erro HTML/non-JSON no modal de edição vira mensagem segura e preserva o rascunho.

Limite: o lote cobre `CustomerWorkspace` com APIs interceptadas e dados sintéticos; ainda não valida rede real, banco remoto, autenticação remota nem Core Web Vitals de produção.
