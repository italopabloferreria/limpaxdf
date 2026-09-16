# Plano de implementação e status

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
| 2 — Migração | Planejado; amostra pendente | Excel/CSV, mapeamento, duplicidades, lotes e relatório | Amostra conferida; retry sem duplicação; dados/valores reconciliados; erros e reversão rastreáveis |
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
