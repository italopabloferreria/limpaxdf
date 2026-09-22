# Plano de implementação e status

> **Estado vigente — 22/09/2026:** consultar `AGENTS.md`, `.icbai/PROJECT_STATE.json`, `docs/AI_HANDOFF.md` e `docs/CURRENT_TASK.md`. A01–A08 passam localmente com 47/47 testes, TypeScript e build; G13 continua reprovado por lint do código próprio, QA autenticado completo, recuperação e validação remota. Supabase é alvo posterior e ainda não foi conectado. Nenhum deploy novo.

Atualização: 16/09/2026. Pacote criado por pedido de documentação, sem mudanças de produto ou deploy nesta etapa.

## Linha de base

- Site privado e CRM inicial publicados anteriormente; fonte local em `outputs/limpax`.
- Último commit observado na conversa: `c89ecf5237b7daf7ec8b9fa0c3dad7888c2bafd0`. Conferir Git antes de trabalhar; não assumir que permanece atual.
- Check, leads, anexos e APIs existentes devem ser preservados.
- Build/TypeScript e dez testes anteriores não cobrem todas as interações do CRM novo. Não usar esse resultado para declarar o produto completo.
- Importações, clientes independentes, papéis completos, agenda, orçamentos, contratos, OS, financeiro e fiscal ainda não estão entregues.

## Revisão técnica obrigatória no primeiro lote

Observações da implementação registrada na conversa, a confirmar no código antes de corrigir:

- A resposta de detalhe de lead parece expor campos SQL/payload, enquanto a interface espera `contact`, `assignedTo` e `nextActionAt`; conferir contrato completo com lead real de teste.
- Alteração de status parece selecionar novamente o mesmo ID sem atualizar o detalhe; conferir atualização imediata e histórico.
- Requisições de detalhe precisam impedir que uma resposta antiga substitua o cliente selecionado depois.
- Rotas autenticadas de escrita devem conferir origem/CSRF e permissões, além de autenticação.
- Criação de tarefa e atividade devem ser atômicas; testar falha parcial e retry.
- Limite fixo de 150 registros não atende histórico completo; implementar paginação/pesquisa e totais corretos.
- Datas sem fuso precisam de regra consistente; testes e migrações devem refletir o estado realmente publicado.

## Entregas

| Lote | Estado | Escopo | Critério de aceite |
| --- | --- | --- | --- |
| 0 — Base confiável | Em andamento; núcleo implementado | Revisão acima, testes de fluxo/autorização, contratos de dados | Abrir, alterar, anotar, criar/concluir tarefa e reabrir sem erros; acesso negado corretamente |
| 1 — Acesso e cadastros | Planejado | Contas/papéis, empresa, clientes, contatos, locais e auditoria | Atendente e administradores veem apenas ações/dados permitidos; cliente suporta múltiplos locais |
| 2 — Infraestrutura e migração de dados | Planejado; após G13 | Supabase reversível, Google Auth, depois Excel/CSV/Sheets com mapeamento e rollback | D1/R2 preservados até reconciliação; Auth/RLS/Storage testados; importação sem duplicação |
| 3 — Comercial | Planejado | Funil, ficha, orçamento versionado, WhatsApp, tarefas | Atendimento até ganho/perda com condições e próxima ação; link correto sem alegar envio |
| 4 — Documentos | Planejado; modelo pendente | Upload de modelo, variáveis, revisão e DOCX/PDF | Documento fiel ao modelo, sem campos faltantes, snapshot preservado e acesso privado |
| 5 — Agenda e operação | Planejado | Compromissos, OS, equipe, LXP/01–03 e conclusão | Detectar conflito, reagendar com histórico, vincular execução e evidências |
| 6 — Recebimentos e gestão | Planejado | Parcelas, baixas, estornos, métricas e relatórios | Parcial/total/estorno corretos; indicadores reconciliáveis e filtráveis |
| 7 — Fiscal | Descoberta pendente | Conector confirmado, homologação, emissão e consulta | Emissão autorizada comprovada, rejeição tratada, retry sem duplicação e documentos guardados |
| 8 — Lançamento | Pendente | Dados reais, permissões, backup/restauração, treinamento e operação | Checklist abaixo atendido; status comunicado sem chamar pendências de concluídas |

Lotes são marcos verificáveis, não estimativa de horas ou custos. Evitar refazer a home enquanto o escopo é operacional.

## Informações pendentes

| Informação | Afeta | Pode avançar sem ela? |
| --- | --- | --- |
| Amostra anonimizada e volume de planilhas | Mapeamento/migração | Sim: revisão e estrutura inicial |
| E-mails do dono e da atendente; forma de login | Acesso real | Sim: modelo e testes fictícios |
| Delegação financeira e limites de aprovação | Permissões finais | Sim: padrão restritivo proposto |
| Modelo de contrato e dados oficiais da Limpax | Documentos finais | Sim: mecanismo com modelo sintético |
| Portal/emissor fiscal e parâmetros da contabilidade | Emissão fiscal | Sim: demais módulos |
| Razão social, contato de privacidade, retenção e operação aprovada | Captação pública real | Sim: ambiente privado de revisão |
| Regras de agenda, duração, equipe e disponibilidade | Agendamento real | Sim: estrutura configurável |

## Saída de beta

- Fluxos do escopo escolhido implementados, verificados e publicados; pendências claramente listadas.
- Testes relevantes de autorização, dados, migração, duplicidade, valores e interações; QA desktop/mobile e teclado.
- Dados de teste separados; histórico migrado e conferido com responsável.
- Backup e restauração ensaiados; monitoramento e procedimentos de falha definidos.
- Contas reais e permissões verificadas sem compartilhar credenciais.
- Identidade, privacidade/retenção, portfólio e contatos confirmados para captação real.
- Audiência pública decidida explicitamente; CRM continua protegido independentemente do site institucional.
- Emissão fiscal só considerada pronta após integração confirmada e homologada.

## Registro de retomada por lote

Ao trabalhar, manter uma entrada curta com: lote/status; decisão nova; arquivos principais; testes executados e resultado; limitações; publicação realizada ou pendente; próximo passo. Não copiar logs completos nem reler toda a conversa por rotina.

### 16/09/2026 — planejamento documental

Concluído: pacote de escopo, acesso, dados, migração, interface, integrações e plano. Nenhuma alteração de aplicação nesta etapa. Próximo: analisar amostra de planilhas e executar revisão da base quando a implementação for retomada.

### 16/09/2026 — lote 0, núcleo confiável

Implementado: contrato único de dados entre lista e detalhe; atualização imediata após mudança; cancelamento de respostas antigas; busca e paginação no servidor com totais globais; proteção de origem nas escritas; criação atômica de tarefa e histórico; datas enviadas com fuso explícito. Validação: build de produção aprovado e 11 testes sintéticos aprovados, incluindo paginação/filtro. O lote permanece em andamento até a conferência visual do fluxo autenticado publicado. Próximo: validar o CRM publicado e iniciar cadastros e papéis do lote 1.

### 16/09/2026 — lote 1 + 9 correções do handoff — CONCLUÍDO

**Correções aplicadas:**

1. **Busca textual** (`lib/crm-customers.ts`): predicados de dígito (`tax_id_normalized`, `phone_normalized`) só são adicionados quando o termo realmente contém números. Sintaxe `ESCAPE '\\'` corrigida para SQLite (era `'\\\\'` e causava erro de runtime).
2. **Gestão de usuários** (`app/api/crm/users/route.ts`, `users/[email]/route.ts`): `GET` lista equipe, `POST` cadastra membro (409 em duplicidade), `PATCH` atualiza papel/status impedindo remoção do último admin ativo. `requireCrmUser` em `lib/crm.ts` agora lê `crm_user_profiles` quando DB disponível: respeita `active=0` (403) e `role` persistido, com fallback para variáveis de ambiente, e atualiza `last_seen_at` a cada chamada.
3. **Fluxo lead↔cliente** (`app/api/crm/leads/[id]/customer/route.ts`): `GET` retorna vínculo atual; `POST` valida existência do lead, do cliente (não arquivado) e pertencimento de contato/local; `DELETE` desvincula. `GET /api/crm/leads/[id]` passa a retornar `linkedCustomer`.
4. **Edição completa de cliente/contato/local**: validação de checksum CPF/CNPJ em `lib/crm-customers.ts` (`isValidCpf`, `isValidCnpj`, `validateTaxId`). Rotas `PATCH`/`DELETE` para contatos (`contacts/[contactId]/route.ts`) e locais (`locations/[locationId]/route.ts`) com troca atômica de flag `is_primary`. Erros de `UNIQUE constraint` retornam 409 amigável.
5. **Estado dos formulários**: `CustomerWorkspace` reescrito com controlled inputs e `useState`-por-draft; erros exibidos dentro do `DialogContent`; botão de submit desabilitado durante `busy`; sem perda de campos digitados.
6. **Race conditions**: `useRef` preserva seleção atual; atualizações de listagem usam `prev` func. form; `AbortController` em todos os fetches.
7. **Fuso horário**: `lib/timezone.ts` criado com `formatDateTime`, `formatDate`, `toInputDateTime`, `fromInputDateTime` (America/Sao_Paulo). `customer-workspace.tsx` e `crm-workspace.tsx` passaram a usar esse módulo.
8. **Linked leads no cliente**: `getCustomer` agora retorna `linkedLeads[]` (via join `lead_customer_links → leads`). `CustomerWorkspace` exibe tabela de histórico de atendimentos vinculados com link para `/crm?selected=<id>`.

**Arquivos novos:** `lib/crm-customers.ts` (reescrito), `lib/timezone.ts`, `app/api/crm/users/route.ts`, `app/api/crm/users/[email]/route.ts`, `app/api/crm/leads/[id]/customer/route.ts`, `app/api/crm/customers/[id]/contacts/[contactId]/route.ts`, `app/api/crm/customers/[id]/locations/[locationId]/route.ts`.

**Arquivos modificados:** `lib/crm.ts`, `app/api/crm/customers/route.ts`, `app/api/crm/customers/[id]/route.ts`, `app/api/crm/leads/[id]/route.ts`, `components/customer-workspace.tsx`, `components/customer-workspace.module.css`.

**Validação:** 16/16 testes aprovados (`node scripts/test.mjs`), `npx tsc --noEmit` sem erros, build de produção pendente de confirmação.

**Limitações:** `crm-workspace.tsx` (painel de atendimentos) recebeu ajuste de timezone e linked customer mas a UI de vínculo (seleção de cliente no painel de leads) ainda é manual via API — formulário de vínculo no painel de leads fica como próximo passo do Lote 1.5.

**Próximo passo:** interface de vínculo lead↔cliente no `crm-workspace.tsx` (botão "Vincular cliente" + busca de cliente inline), testes de autorização real no ambiente publicado, e início do Lote 2 (migração).

### 16/09/2026 — retomada ICB-AI, incremento de acesso
Concluídos os complementos técnicos pre-code. Correções A01/A02: SSR e API usam guard único, perfil inativo/inválido não usa fallback de ambiente, banco indisponível não libera PII, exclusão de contato/local exige admin e botões respeitam papel. Testes antes: 8 falhas/4 passes; depois: 12/12, mais 16/16 regressões de negócio. TypeScript e build aprovados. Lint focalizado novo aprovado; dívida preexistente do restante mantida explícita. Sem migração remota ou deploy. Próximo: A03 com invariante atômica de último administrador; após, jornadas de vínculo/seleção. Estado em .icbai/PROJECT_STATE.json; não reiniciar planejamento.

### 16/09/2026 — A03 e jornada cliente→atendimento

A03 concluído localmente: atualização condicional atômica impede zero administradores persistidos mesmo com duas alterações simultâneas; auditoria registra apenas a mudança aceita. Deep link `/crm?selected=` agora abre o atendimento solicitado e ignora identificador inválido. Respostas atrasadas não substituem o atendimento selecionado. Validação consolidada: 34/34 testes, TypeScript e build aprovados; lint dos arquivos novos aprovado. Sem deploy. Próximo: busca/seletor para vincular ou desvincular cliente no atendimento; depois lifecycle A06.

### 17/09/2026 — A04b, vínculo atendimento→cliente

Concluído localmente: o detalhe do atendimento permite buscar clientes existentes, abrir contatos e locais, adotar os itens principais como padrão, escolher alternativas, vincular e desvincular. A API continua responsável por autorização, pertencimento dos IDs, auditoria e integridade. Estados vazio, carregando e erro foram incluídos na interface responsiva. TDD confirmado com 5 falhas antes e 5/5 aprovados depois. Regressão consolidada: 39/39 testes; TypeScript, lint focalizado do novo código e build de produção aprovados. O lint global continua aberto e `crm-workspace.tsx` mantém cinco erros preexistentes. Sem deploy. Próximo: A06, lifecycle e separação revisão/live, usando apenas dados sintéticos e mantendo prazo de retenção como [VALIDAR].

### 17/09/2026 — A06a, partição review/live

Concluído localmente: migração 0004 classifica clientes por `review/live`, registra origem e prepara `import_batch`; leads também recebem origem/lote. Registros legados ficam conservadoramente em `review/unknown`. Novos leads do Check usam `public_check`, clientes criados no CRM usam `manual`, o seletor filtra pelo modo do atendimento e a API bloqueia vínculos cruzados. Nenhum dado foi promovido, apagado ou migrado remotamente. TDD: 2 falhas antes e 2/2 aprovados depois. Regressão consolidada: 41/41 testes; TypeScript, lint focalizado e build aprovados. Próximo: A06b com arquivamento/restauração auditáveis e filtros operacionais, mantendo retenção como [VALIDAR].

### 21/09/2026 — A06b, arquivamento e restauração

Concluído localmente: administradores podem arquivar e restaurar clientes sem apagar contatos, locais, vínculos ou histórico. As transições são auditadas, recusam repetição, exigem origem válida e ficam indisponíveis para atendentes. A interface separa clientes ativos e arquivados, mantém arquivados somente para consulta e filtra pelo modo operacional `review/live`. Validação consolidada: 44/44 testes, TypeScript, lint focalizado e build aprovados. Migração 0004 e deploy continuam pendentes. Próximo: A08, compatibilidade dos endpoints legados, idempotência e validações sem perda silenciosa.

### 21/09/2026 — A08, integridade operacional

Concluído localmente: o endpoint legado de status agora atualiza timestamp e histórico de forma atômica; criação de tarefa usa chave idempotente persistida pela migração 0005, retorna o mesmo ID em retry idêntico e recusa conteúdo divergente; datas impossíveis e documentos não vazios inválidos deixam de ser aceitos como valores ausentes. A interface gera uma chave UUID por envio de tarefa. Validação consolidada: 47/47 testes, TypeScript, lint focalizado dos módulos novos e build aprovados. Migrações 0003–0005 foram aplicadas somente ao banco local para o preview autenticado; remoto e deploy permanecem pendentes. Próximo: Quality Gate com lint restante, QA desktop/mobile/teclado e ensaio de recuperação.
