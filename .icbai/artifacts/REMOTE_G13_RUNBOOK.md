# G13 remoto — runbook de validacao

Data: 2026-09-22. Estado: **preparado localmente; execucao remota bloqueada por ambiente e autorizacao**.

Este runbook existe para fechar o G13 sem improviso quando houver credenciais e ambiente remoto confirmados. Ele nao autoriza deploy, migracao, DNS, importacao de dados reais ou leitura de PII.

## Antes de qualquer acao remota

Rodar localmente:

```powershell
npm run qa:remote-readiness
npm run qa:remote-evidence
git status --short --branch
```

Conferir que:

- arquivos de estado, manifesto e journal estao presentes;
- `DB` e `BUCKET` continuam como bindings esperados;
- as migracoes `0000` a `0005` existem localmente;
- Git mostra o HEAD que sera validado;
- `CF_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` estao disponiveis apenas no ambiente de execucao, nunca no repositorio;
- `LIMPAX_REMOTE_ENV` identifica explicitamente `staging`, `production` ou outro ambiente aprovado;
- `LIMPAX_RELEASE_OPERATOR` identifica o responsavel pela validacao;
- `LIMPAX_ROLLBACK_PLAN_CONFIRMED=yes` so deve ser usado depois de revisar backup e rollback.

## Evidencia obrigatoria

Registrar em `.icbai/artifacts/QUALITY_GATE_PROGRESS.md`, `.icbai/artifacts/RELEASE_MATRIX.md`, `.icbai/PROJECT_STATE.json`, `docs/AI_HANDOFF.md` e `docs/CURRENT_TASK.md`:

- commit local validado;
- commit publicado antes da mudanca;
- tabelas remotas existentes antes da mudanca;
- backup gerado e local de guarda fora do repositorio;
- resultado da restauracao isolada;
- migracoes remotas aplicadas ou pendentes;
- smoke autenticado com dados sinteticos;
- metricas de performance no dominio final;
- decisao PASS, FAIL ou WARNING por dimensao da matriz G13.

Nao registrar segredos, tokens, certificados, planilhas reais, PII ou dumps integrais.

Use `.icbai/artifacts/REMOTE_G13_EVIDENCE_TEMPLATE.md` como rascunho controlado para coletar a evidencia antes de consolidar o estado do gate.

Antes de versionar ou compartilhar uma evidencia preenchida, rode:

```powershell
npm run qa:remote-evidence
```

Esse comando procura padrões obvios de token, chave privada, e-mail, CPF, CNPJ e dump SQL. Ele e apenas uma protecao inicial; revisao humana continua obrigatoria.

## Sequencia segura

1. Identificar o deploy atual e o commit publicado.
2. Conferir estado remoto do D1 sem ler dados reais de clientes.
3. Gerar backup remoto e guardar fora do repositorio.
4. Restaurar o backup em ambiente isolado.
5. Conferir integridade, contagens e vinculos no ambiente isolado.
6. Comparar migracoes remotas com o journal local.
7. Aplicar migracoes somente se o backup e a restauracao isolada passaram.
8. Executar smoke autenticado com registros sinteticos e papeis de administrador/atendimento.
9. Medir Core Web Vitals no dominio final ou ambiente aprovado.
10. Atualizar matriz G13 com evidencia e manter `G13` em FAIL se qualquer item critico falhar.

## Criterios de parada

Parar antes de migrar ou publicar se ocorrer qualquer item abaixo:

- backup ausente, incompleto ou sem local de guarda conhecido;
- restauracao isolada nao executada;
- commit publicado desconhecido;
- divergencia de schema sem explicacao;
- credencial compartilhada em chat, log ou arquivo;
- necessidade de ler dados reais para provar funcionamento;
- smoke autenticado impossivel de executar com dados sinteticos;
- rollback sem responsavel, comando ou janela operacional.

## Resultado esperado

Ao fim da etapa remota, o G13 pode ter apenas um destes estados:

- `PASS`: migracao/configuracao remota, recuperacao, smoke, performance e rollback possuem evidencia suficiente.
- `FAIL`: pelo menos um item critico falhou ou ficou sem evidencia.
- `WARNING`: apenas itens nao bloqueantes permanecem, com risco aceito por escrito em `.icbai/PROJECT_STATE.json`.

Enquanto backup, restauracao, migracao remota, smoke autenticado e performance de producao nao forem verificados, o CRM nao deve ser chamado de producao.
