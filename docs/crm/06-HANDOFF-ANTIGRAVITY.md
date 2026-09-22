# Continuidade Limpax — Antigravity e revisão no Codex

Pausa solicitada em 16/09/2026. Este arquivo prevalece sobre descrições antigas de status; os requisitos de produto continuam nos documentos 00–05. Não chamar o produto de completo nem considerar testes de unidade como validação de todos os fluxos.

## Checkout e publicação

- Abrir a raiz `C:/Users/italo/Documents/Codex/2026-09-11/referenced-chatgpt-conversation-this-is-an/outputs/limpax` no IDE.
- Último commit publicado: `98c0bbf3590536b9b078f5ae0611302ae5fd8393` (Lote 0, versão 3).
- Site privado: https://limpax-fluindo.italopablo.chatgpt.site ; CRM `/crm`.
- Lote 1 está salvo em arquivos locais, com alterações não commitadas e arquivos novos não rastreados. Ainda NÃO publicado. Uma clonagem do remoto sozinha perde esse trabalho.
- Migração nova local: `drizzle/0003_hot_the_order.sql` e metadados correspondentes. As migrações 0000–0002 já publicadas são imutáveis. Confirmar o estado remoto antes de supor migrações aplicadas.
- A atualização do plano foi interrompida: o Lote 1 segue em andamento, não concluído.

## Já implementado localmente no Lote 1

- Tabelas de clientes, contatos, locais, vínculos lead/cliente, auditoria e perfis.
- APIs de criação/listagem de clientes, GET/PATCH de cliente e adição de contatos/locais.
- Interface `/crm/clientes` com criação, pesquisa, listagem e detalhe.
- Listas `CRM_ADMIN_EMAILS` e `CRM_ATTENDANT_EMAILS`; resolução do papel no servidor. Nenhuma nova conta real autorizada.
- TypeScript, build e 12 testes passaram antes da pausa. Os testes atuais não cobrem todos os endpoints, permissões ou interações de navegador.

## Revisão necessária ANTES de ampliar ou publicar

Achados visíveis no código, ainda sem correção nesta pausa:

1. `lib/crm-customers.ts`: busca textual sem dígitos gera `LIKE '%%'` para documento/telefone e pode retornar clientes sem relação com o termo. Corrigir e testar termo sem números, termo inexistente, telefone e documento.
2. `crm_user_profiles` é apenas tabela: a autorização ainda depende das listas de ambiente. Não há gestão funcional de usuários, ativação/revogação ou tela administrativa. `requireCrmAdmin` existe, mas sua existência não comprova proteção de ações administrativas; verificar consumidores.
3. `lead_customer_links` ainda não tem fluxo funcional de vínculo. Completar preservando leads e validando que contato/local pertencem ao cliente selecionado.
4. Interface tem cadastro, mas falta edição completa de cliente/contato/local e escolha de principal. CPF/CNPJ tem normalização para duplicidade, não validação completa; tratar concorrência da restrição única com erro de conflito compreensível.
5. Formulários usam actions que retornam `void` enquanto disparam trabalho assíncrono; verificar perda de campos em erro. Erro do cadastro aparece fora do modal. Preservar rascunhos e exibir erro dentro do fluxo correto.
6. Conferir seleção após criar cliente ou trocar busca durante requisições; resposta antiga e refresh não devem trocar o cliente errado. Há risco de sobrescrita de estado também no CRM inicial.
7. Datas atuais seguem o fuso do navegador; requisito é America/Sao_Paulo. Não considerar o simples envio de ISO como cumprimento integral desse requisito.
8. Lote 0 ainda tem limites de 100 em histórico/tarefas, indicador de vencidas apenas na página, retry de tarefa sem idempotência e validação de UI/autorização insuficiente. Revisar concorrência de PATCH e atualização de listagem filtrada.
9. Fazer QA real desktop/mobile/teclado com dados sintéticos isolados. Build aprovado não comprova experiência ou segurança completa.

## Sequência de trabalho

1. Ler este arquivo, 00 e 05; depois 01–03 e somente os arquivos do módulo em execução. Inspecionar `git status` e diff antes de editar, preservando trabalho local.
2. Corrigir a revisão acima e concluir um Lote 1 coerente: autorização real, cadastros editáveis, vários contatos/locais, vínculo com atendimento e auditoria. Não refazer a home.
3. Validar APIs com usuário anônimo, atendente, admin e conta não autorizada; origem/CSRF, erro de banco, duplicidade, atomicidade e campos inválidos. Não usar autenticação de teste em produção.
4. Rodar `npx tsc --noEmit`, `node scripts/test.mjs` e `npm run build`. O teste usa esbuild + mock de cloudflare; `node --import tsx` sozinho não é o comando correto. Incluir casos de regressão significativos.
5. Atualizar 05 com arquivos, decisões, testes reais, limitações, migração e próximo passo. Usar commits pequenos apenas no repositório Limpax. Preservar segredos fora do Git.
6. Avançar nos lotes seguintes conforme dependências reais; registrar bloqueios específicos, sem inventar dados fiscais, modelos de contrato ou colunas de planilhas.

## Restrições para outro IDE

- Preservar React/TypeScript, Vinext, Workers, D1/Drizzle, R2, lockfile e identidade de `.openai/hosting.json`. Nada de substituir por Firebase/Supabase ou criar outro Site sem pedido.
- Não usar localhost:5173 presumindo ser Limpax: nessa sessão essa porta pertencia a outro projeto. Confirmar o servidor e caminho antes de abrir.
- Sites depende de ferramentas próprias de publicação, não presumir que existem no Antigravity. Por pedido desta transferência, desenvolver e testar localmente; deixar publicação para o retorno ao Codex. Não tentar contornar a plataforma com credenciais ou Wrangler remoto.
- Fonte técnica/dados desconhecidos: `[VALIDAR]`; WhatsApp somente wa.me, sem API nem envio automático.
- Continuar em lotes e atualizar o registro de retomada, evitando releitura integral da conversa.

## Critérios da revisão no retorno

“Padrão GPT-Astra” representa o rigor desejado, não certificação ou garantia. Revisar o diff desde o último publicado, requisitos e fluxos executáveis: autorização por ação/registro, proteção de dados, migrações incrementais, integridade/idempotência, falhas/concorrência, acessibilidade e visual, desempenho/paginação, testes e documentação. Corrigir falhas, distinguir implementado/testado/publicado e somente então preparar publicação privada pelo fluxo Sites.

## Prompt para colar no Antigravity

Continue a implementação do CRM Limpax neste checkout. Leia primeiro docs/crm/06-HANDOFF-ANTIGRAVITY.md, 00-RETOMADA.md e 05-PLANO-E-STATUS.md; depois somente os documentos e código do módulo em execução. Preserve as alterações locais não commitadas. Faça primeiro a revisão e correção dos achados registrados no handoff, conclua o Lote 1 com fluxos reais e testes proporcionais e avance pelos lotes documentados conforme as dependências permitirem. Preserve stack, marca, dados e migrações já publicadas. Não invente fatos nem integrações prontas. Desenvolva e teste localmente, sem publicar ou alterar acessos externos; a publicação será feita no retorno ao Codex. Registre em 05 o que mudou, o que foi testado, pendências e próximo passo. Não declare CRM completo com base apenas no build. Quando faltar informação externa, registre a dependência e continue o trabalho independente.

## Prompt para retornar ao Codex

Retome o Limpax lendo docs/crm/06-HANDOFF-ANTIGRAVITY.md e o registro atualizado em 05-PLANO-E-STATUS.md. Revise com o rigor que combinamos para GPT-Astra todo o trabalho do Antigravity desde 98c0bbf3590536b9b078f5ae0611302ae5fd8393, incluindo arquivos não commitados. Confira requisitos, autorização, dados, migrações, testes e experiência real; corrija problemas e informe limitações com evidências. Após validar, publique pelo Sites mantendo a audiência privada e continue pelo próximo lote documentado.
